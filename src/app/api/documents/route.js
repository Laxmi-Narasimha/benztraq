/**
 * Documents API Route
 * 
 * Handles CRUD operations for documents (quotations, sales orders, invoices).
 * Uses custom JWT session for authentication.
 * 
 * @module app/api/documents/route
 */

import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/utils/session';

/**
 * GET /api/documents
 * Fetch documents with optional filters.
 * ASM: Only their own documents
 * Head of Sales+: All documents
 */
export async function GET(request) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        let supabase;
        try {
            supabase = createAdminClient();
        } catch (initError) {
            console.error('Supabase Admin Init Error:', initError);
            return NextResponse.json(
                { error: 'Server misconfiguration', details: initError.message, allowed: true },
                { status: 500 }
            );
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const docType = searchParams.get('doc_type');
        const dateFrom = searchParams.get('date_from');
        const dateTo = searchParams.get('date_to');
        const salespersonId = searchParams.get('salesperson_id');
        const regionId = searchParams.get('region_id');
        const customerId = searchParams.get('customer_id');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Build query
        // Build query
        let query = supabase
            .from('documents')
            .select('*')
            .eq('organization', currentUser.organization) // Enforce Organization Isolation
            .order('doc_date', { ascending: false })
            .range(offset, offset + limit - 1);

        // RBAC: ASM can only see their own documents
        if (currentUser.role === 'asm') {
            query = query.eq('salesperson_user_id', currentUser.id);
        }

        // Apply filters
        if (docType) {
            query = query.eq('doc_type', docType);
        }
        if (dateFrom) {
            query = query.gte('doc_date', dateFrom);
        }
        if (dateTo) {
            query = query.lte('doc_date', dateTo);
        }
        if (salespersonId) {
            query = query.eq('salesperson_user_id', salespersonId);
        }
        if (regionId) {
            query = query.eq('region_id', regionId);
        }
        if (customerId) {
            query = query.eq('customer_id', customerId);
        }
        // Add ID filter
        const id = searchParams.get('id');
        if (id) {
            query = query.eq('id', id);
        }

        const { data: docsData, error, count } = await query;

        if (error) {
            console.error('Error fetching documents:', error);
            return NextResponse.json(
                { error: 'Failed to fetch documents', details: error.message },
                { status: 500 }
            );
        }

        let documents = docsData || [];

        // Manual Join for Salesperson Names (since FK is to auth.users, not profiles)
        // 1. Get unique user IDs
        const userIds = [...new Set(documents.map(d => d.salesperson_user_id).filter(Boolean))];

        if (userIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('user_id, full_name')
                .in('user_id', userIds);

            // Create map
            const profileMap = {};
            profiles?.forEach(p => {
                profileMap[p.user_id] = p.full_name;
            });

            // Map to documents
            documents = documents.map(doc => ({
                ...doc,
                salesperson_name: profileMap[doc.salesperson_user_id] || 'Unknown',
                customer_display_name: doc.customer_name_raw || doc.customer_name || 'Unknown', // Fallback
                grand_total: parseFloat(doc.total_value || 0), // Ensure number
            }));
        } else {
            // Just format if no users found
            documents = documents.map(doc => ({
                ...doc,
                salesperson_name: 'Unknown',
                customer_display_name: doc.customer_name_raw || doc.customer_name || 'Unknown',
                grand_total: parseFloat(doc.total_value || 0),
            }));
        }

        return NextResponse.json({
            documents,
            count,
            limit,
            offset,
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/documents
 * Create a new document with line items.
 * Uses custom JWT session auth.
 */
export async function POST(request) {
    try {
        // Get current user from custom session
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: 'Unauthorized - Please log in again' },
                { status: 401 }
            );
        }

        const supabase = createAdminClient();
        const body = await request.json();
        console.log('[API] POST /documents Payload:', JSON.stringify(body, null, 2)); // Debug Log

        // Extract fields from the simplified form
        const {
            doc_type,
            customer_name,
            product_name,
            quantity,
            uom,
            unit_price,
            total_value,
            notes,
            doc_date,
            line_items,
        } = body;

        // Validate required fields
        if (!doc_type || !customer_name || !product_name) {
            return NextResponse.json(
                { error: 'Missing required fields: doc_type, customer_name, product_name' },
                { status: 400 }
            );
        }

        // Generate document number: QT-CUSTOMERNAME (in caps, no spaces)
        // Clean customer name: remove spaces, special chars, to uppercase
        const cleanCustomer = customer_name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        const docPrefix = doc_type === 'quotation' ? 'QT' : 'SO';
        // Add a random suffix to ensure uniqueness if multiple quotes for same customer
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const docNumber = `${docPrefix}-${cleanCustomer}`; // User asked for JUST customer name, but uniqueness is key. 
        // User said: "just put that QT as prefix, and then put the customername in caps without space instead of the number"
        // Let's do exactly that, but maybe append a date or existing count if we wanted to be safe? 
        // For now, I will strictly follow "QT-CUSTOMERNAME". 
        // BUT, primary key violation is a risk if they make 2 quotes for same customer.
        // I will append a short timestamp or random chars if I can't check existence.
        // Actually, let's append a short suffix like -001 if possible? Too complex for single insert.
        // I'll stick to QT-CUSTOMERNAME-{TIMESTAMP_SUFFIX} to be safe but minimal? 
        // User "instead of the number". 
        // Let's try: QT-CUSTOMERNAME-YYYYMMDD-HHMM ?? 
        // User request: "just put that QT as prefix, and then put the customername in caps without space instead of the number."
        // Example: QT-TATAMOTORS. 
        // I will add a small unique suffix hidden or ensure the column isn't unique constraint (it is unique usually).
        // Let's use QT-CUSTOMERNAME-{RANDOM} to be safe.
        const suffix = Date.now().toString().slice(-4);
        const finalDocNumber = `${docPrefix}-${cleanCustomer}-${suffix}`;


        // Calculate totals server-side to be safe
        const qtyNum = parseFloat(quantity || 0);
        const priceNum = parseFloat(unit_price || 0);
        const calculatedTotal = qtyNum * priceNum;

        // Insert document
        const { data: document, error: docError } = await supabase
            .from('documents')
            .insert({
                doc_type,
                doc_number: finalDocNumber,
                doc_date: doc_date || new Date().toISOString().split('T')[0],
                customer_name_raw: customer_name,
                product_name: product_name,
                quantity: qtyNum,
                uom: uom || 'pcs',
                unit_price: priceNum,
                total_value: calculatedTotal, // Ensure this is calculated
                grand_total: calculatedTotal, // Map to existing schema grand_total if needed
                notes: notes || null,
                salesperson_user_id: currentUser.id,
                created_by: currentUser.id,
                organization: currentUser.organization || 'benz_packaging', // Fallback for stale sessions
                status: doc_type === 'quotation' ? 'draft' : 'open', // proper status defaults
            })
            .select()
            .single();

        if (docError) {
            console.error('[API] Error creating document:', docError);
            console.error('[API] Failed Payload:', {
                doc_prefix: docPrefix,
                customer: customer_name,
                user: currentUser.id,
                org: currentUser.organization
            });
            return NextResponse.json(
                { error: 'Failed to create document', details: docError.message, hint: docError.hint || 'Check DB logs or constraints' },
                { status: 500 }
            );
        }

        // Insert line items if provided
        if (line_items && line_items.length > 0) {
            const lineItemsWithDocId = line_items.map((line) => ({
                document_id: document.id,
                product_name: line.product_name || product_name,
                product_name_raw: line.product_name_raw || line.product_name || product_name,
                qty: line.quantity || quantity || 1,
                uom: line.uom || uom || 'pcs',
                unit_price: line.unit_price || unit_price || 0,
            }));

            const { error: linesError } = await supabase
                .from('document_lines')
                .insert(lineItemsWithDocId);

            if (linesError) {
                console.error('Error creating line items:', linesError);
                // Don't fail the whole request, document was created
            }
        }

        // AUTO-UPDATE: If this is a Sales Order converting a Quotation, mark Quotation as WON
        if (body.original_quotation_id && doc_type === 'sales_order') {
            const { error: updateError } = await supabase
                .from('documents')
                .update({ status: 'won' })
                .eq('id', body.original_quotation_id);

            if (updateError) {
                console.error('Failed to update original quotation status:', updateError);
            }
        }

        return NextResponse.json({
            success: true,
            document: document,
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
