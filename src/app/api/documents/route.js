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

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching documents:', error);
            return NextResponse.json(
                { error: 'Failed to fetch documents', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            documents: data || [],
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

        // Generate document number
        const docPrefix = doc_type === 'quotation' ? 'QT' : 'SO';
        const timestamp = Date.now().toString().slice(-8);
        const docNumber = `${docPrefix}-${timestamp}`;

        // Insert document
        const { data: document, error: docError } = await supabase
            .from('documents')
            .insert({
                doc_type,
                doc_number: docNumber,
                doc_date: doc_date || new Date().toISOString().split('T')[0],
                customer_name_raw: customer_name,
                product_name: product_name,
                quantity: quantity || 1,
                uom: uom || 'pcs',
                unit_price: unit_price || 0,
                total_value: total_value || (quantity * unit_price) || 0,
                notes: notes || null,
                salesperson_user_id: currentUser.id,
                created_by: currentUser.id,
                organization: currentUser.organization || 'benz_packaging', // Fallback for stale sessions
                status: 'draft', // Default status for new documents
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
