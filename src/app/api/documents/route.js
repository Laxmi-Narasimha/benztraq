/**
 * Documents API Route
 * 
 * Handles CRUD operations for documents (quotations, sales orders, invoices).
 * Uses custom JWT session for authentication.
 * Uses centralized RBAC for consistent access control.
 * 
 * @module app/api/documents/route
 */

import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/utils/session';
import { isManager, isASM, normalizeRole } from '@/lib/utils/rbac';

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
        if (isASM(currentUser.role)) {
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
 * Create a new document with line items and GST breakdown.
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
        console.log('[API] POST /documents Payload:', JSON.stringify(body, null, 2));

        // Extract fields - support both old and new format
        const {
            doc_type,
            quotation_number,
            doc_date,
            due_date,
            customer_id,
            customer_name,
            customer_address,
            customer_gstin,
            payment_terms,
            validity_days,
            country_of_supply,
            place_of_supply,
            terms_and_conditions,
            authorized_signatory,
            subtotal,
            cgst_total,
            sgst_total,
            grand_total,
            notes,
            line_items,
            // Legacy fields for backward compatibility
            product_name,
            quantity,
            uom,
            unit_price,
            total_value,
        } = body;

        // Validate required fields
        if (!doc_type || !customer_name) {
            return NextResponse.json(
                { error: 'Missing required fields: doc_type, customer_name' },
                { status: 400 }
            );
        }

        // Generate document number if not provided
        const cleanCustomer = customer_name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 20);
        const docPrefix = doc_type === 'quotation' ? 'QT' : 'SO';
        const suffix = Date.now().toString().slice(-6);
        const finalDocNumber = quotation_number || `${docPrefix}-${cleanCustomer}-${suffix}`;

        // Calculate totals - prefer new format, fallback to legacy
        const finalGrandTotal = grand_total || total_value || 0;
        const finalSubtotal = subtotal || finalGrandTotal;
        const finalCgst = cgst_total || 0;
        const finalSgst = sgst_total || 0;

        // Insert document
        const { data: document, error: docError } = await supabase
            .from('documents')
            .insert({
                doc_type,
                doc_number: finalDocNumber,
                quotation_number: quotation_number || finalDocNumber,
                doc_date: doc_date || new Date().toISOString().split('T')[0],
                due_date: due_date || null,
                customer_id: customer_id || null,
                customer_name_raw: customer_name,
                customer_address: customer_address || null,
                customer_gstin: customer_gstin || null,
                payment_terms: payment_terms || '100% Advance',
                validity_days: validity_days || 15,
                country_of_supply: country_of_supply || 'India',
                place_of_supply: place_of_supply || null,
                terms_and_conditions: terms_and_conditions || null,
                authorized_signatory: authorized_signatory || null,
                product_name: product_name || (line_items?.[0]?.product_name_raw) || 'Multiple Items',
                quantity: quantity || 1,
                uom: uom || 'Pcs',
                unit_price: unit_price || 0,
                subtotal: finalSubtotal,
                cgst_total: finalCgst,
                sgst_total: finalSgst,
                total_value: finalGrandTotal,
                grand_total: finalGrandTotal,
                notes: notes || null,
                salesperson_user_id: currentUser.id,
                created_by: currentUser.id,
                organization: currentUser.organization || 'benz_packaging',
                status: doc_type === 'quotation' ? 'draft' : 'open',
            })
            .select()
            .single();

        if (docError) {
            console.error('[API] Error creating document:', docError);
            return NextResponse.json(
                { error: 'Failed to create document', details: docError.message },
                { status: 500 }
            );
        }

        // Insert line items with GST breakdown
        if (line_items && line_items.length > 0) {
            const lineItemsWithDocId = line_items.map((line, idx) => ({
                document_id: document.id,
                line_number: idx + 1,
                product_id: line.product_id || null,
                product_name: line.product_name_raw || line.product_name || 'Product',
                product_name_raw: line.product_name_raw || line.product_name || 'Product',
                product_description: line.product_description || null,
                hsn_code: line.hsn_code || '39232100',
                gst_rate: line.gst_rate || 18,
                qty: parseFloat(line.qty || line.quantity || 1),
                uom: line.uom || 'Pcs',
                unit_price: parseFloat(line.unit_price || 0),
                base_amount: parseFloat(line.base_amount || 0),
                cgst_amount: parseFloat(line.cgst_amount || 0),
                sgst_amount: parseFloat(line.sgst_amount || 0),
                line_total: parseFloat(line.line_total || 0),
            }));

            const { error: linesError } = await supabase
                .from('document_lines')
                .insert(lineItemsWithDocId);

            if (linesError) {
                console.error('Error creating line items:', linesError);
                // Don't fail the whole request, document was created
            }
        }

        // Create notification for Directors when sales order is created
        if (doc_type === 'sales_order') {
            try {
                // Get all directors
                const { data: directors } = await supabase
                    .from('profiles')
                    .select('user_id, full_name')
                    .eq('role', 'director');

                if (directors && directors.length > 0) {
                    const notifications = directors.map(director => ({
                        user_id: director.user_id,
                        type: 'sales_order_created',
                        title: 'New Sales Order Created',
                        message: `${currentUser.name || 'A salesperson'} created SO #${finalDocNumber} for ${customer_name} - ₹${finalGrandTotal.toLocaleString('en-IN')}`,
                        metadata: {
                            document_id: document.id,
                            doc_number: finalDocNumber,
                            customer_name,
                            grand_total: finalGrandTotal,
                            created_by: currentUser.id,
                        },
                        is_read: false,
                    }));

                    await supabase.from('notifications').insert(notifications);
                }
            } catch (notifError) {
                console.error('Failed to create notifications:', notifError);
            }
        }

        // AUTO-UPDATE: If converting from Quotation, mark it as WON
        if (body.original_quotation_id && doc_type === 'sales_order') {
            await supabase
                .from('documents')
                .update({ status: 'won' })
                .eq('id', body.original_quotation_id);
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

/**
 * DELETE /api/documents
 * Delete a document by ID.
 */
export async function DELETE(request) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Document ID is required' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Check ownership or manager permission
        const { data: doc, error: fetchError } = await supabase
            .from('documents')
            .select('salesperson_user_id')
            .eq('id', id)
            .single();

        if (fetchError || !doc) {
            return NextResponse.json(
                { error: 'Document not found' },
                { status: 404 }
            );
        }

        // Only allow deletion if the user is the owner or a manager
        const isOwner = doc.salesperson_user_id === currentUser.id;
        const userIsManager = isManager(currentUser.role);

        if (!isOwner && !userIsManager) {
            return NextResponse.json(
                { error: 'You do not have permission to delete this document' },
                { status: 403 }
            );
        }

        // Delete the document
        const { error: deleteError } = await supabase
            .from('documents')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('Delete error:', deleteError);
            return NextResponse.json(
                { error: 'Failed to delete document', details: deleteError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, message: 'Document deleted' });
    } catch (error) {
        console.error('DELETE error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
