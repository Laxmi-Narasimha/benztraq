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
 * Odoo-style with state workflow, fiscal position, and auto-computation.
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

        // Extract fields - support both Odoo-style and legacy format
        const {
            // Odoo-style fields
            name,                    // Order number (auto-generated if not provided)
            partner_id,              // Customer UUID
            partner_gstin,
            partner_state_code,
            invoice_address,
            shipping_address,
            date_order,
            validity_date,
            commitment_date,
            state,                   // draft/sent/sale/done/cancel
            fiscal_position,         // intrastate/interstate/export/sez
            place_of_supply,
            currency_id,
            payment_term_id,
            payment_term_note,
            note,
            internal_note,
            client_order_ref,
            origin,

            // Financial totals (computed by DB trigger, but can be overridden)
            amount_untaxed,
            amount_tax,
            amount_total,
            cgst_total,
            sgst_total,
            igst_total,

            // Line items
            line_items,
            order_line,              // Odoo naming

            // Legacy fields for backward compatibility
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
            terms_and_conditions,
            authorized_signatory,
            subtotal,
            grand_total,
            notes,
            product_name,
            quantity,
            uom,
            unit_price,
            total_value,
        } = body;

        // Determine document type from state or legacy doc_type
        const docState = state || (doc_type === 'sales_order' ? 'sale' : 'draft');
        const docType = doc_type || (docState === 'sale' ? 'sales_order' : 'quotation');

        // Validate required fields
        const finalCustomerId = partner_id || customer_id;
        const finalCustomerName = customer_name || body.partner_name;

        if (!finalCustomerName && !finalCustomerId) {
            return NextResponse.json(
                { error: 'Missing required fields: customer name or partner_id' },
                { status: 400 }
            );
        }

        // Generate order number using database sequence if not provided
        let orderNumber = name || quotation_number;
        if (!orderNumber) {
            const prefix = docType === 'quotation' ? 'QT' : 'SO';
            const { data: seqResult } = await supabase.rpc('generate_order_number', { prefix });
            orderNumber = seqResult || `${prefix}-${Date.now().toString().slice(-8)}`;
        }

        // Determine fiscal position if not provided
        let finalFiscalPosition = fiscal_position;
        if (!finalFiscalPosition && partner_state_code) {
            const companyState = 'HR'; // Benz is in Haryana
            finalFiscalPosition = partner_state_code.toUpperCase() === companyState
                ? 'intrastate'
                : 'interstate';
        }
        finalFiscalPosition = finalFiscalPosition || 'intrastate';

        // Calculate totals - prefer new format, fallback to legacy
        const finalAmountTotal = amount_total || grand_total || total_value || 0;
        const finalAmountUntaxed = amount_untaxed || subtotal || finalAmountTotal;
        const finalAmountTax = amount_tax || (cgst_total || 0) + (sgst_total || 0) + (igst_total || 0);

        // Build document insert payload
        const documentPayload = {
            // Odoo-style fields
            name: orderNumber,
            partner_id: finalCustomerId || null,
            partner_gstin: partner_gstin || customer_gstin || null,
            partner_state_code: partner_state_code || null,
            invoice_address: invoice_address || customer_address || null,
            shipping_address: shipping_address || null,
            date_order: date_order || doc_date || new Date().toISOString(),
            validity_date: validity_date || (due_date ? new Date(due_date) : null),
            commitment_date: commitment_date || null,
            state: docState,
            fiscal_position: finalFiscalPosition,
            place_of_supply: place_of_supply || null,
            currency_id: currency_id || 'INR',
            payment_term_id: payment_term_id || null,
            payment_term_note: payment_term_note || payment_terms || null,
            note: note || terms_and_conditions || notes || null,
            internal_note: internal_note || null,
            client_order_ref: client_order_ref || null,
            origin: origin || null,

            // Financial totals
            amount_untaxed: finalAmountUntaxed,
            amount_tax: finalAmountTax,
            amount_total: finalAmountTotal,
            cgst_total: cgst_total || 0,
            sgst_total: sgst_total || 0,
            igst_total: igst_total || 0,

            // Legacy fields (for backward compatibility)
            doc_type: docType,
            doc_number: orderNumber,
            quotation_number: orderNumber,
            doc_date: doc_date || new Date().toISOString().split('T')[0],
            due_date: due_date || null,
            customer_id: finalCustomerId || null,
            customer_name_raw: finalCustomerName,
            customer_address: customer_address || invoice_address || null,
            customer_gstin: customer_gstin || partner_gstin || null,
            payment_terms: payment_terms || payment_term_note || '100% Advance',
            validity_days: validity_days || 15,
            country_of_supply: country_of_supply || 'India',
            terms_and_conditions: terms_and_conditions || note || null,
            authorized_signatory: authorized_signatory || null,
            product_name: product_name || ((line_items || order_line)?.[0]?.name) || 'Multiple Items',
            quantity: quantity || 1,
            uom: uom || 'Pcs',
            unit_price: unit_price || 0,
            subtotal: finalAmountUntaxed,
            total_value: finalAmountTotal,
            grand_total: finalAmountTotal,
            notes: notes || note || null,

            // Tracking
            salesperson_id: currentUser.id,
            salesperson_user_id: currentUser.id,
            sales_team: currentUser.region || null,
            created_by: currentUser.id,
            organization: currentUser.organization || 'benz_packaging',
            status: docState === 'sale' ? 'open' : 'draft',
        };

        // Insert document
        const { data: document, error: docError } = await supabase
            .from('documents')
            .insert(documentPayload)
            .select()
            .single();

        if (docError) {
            console.error('[API] Error creating document:', docError);
            return NextResponse.json(
                { error: 'Failed to create document', details: docError.message },
                { status: 500 }
            );
        }

        // Insert line items with Odoo-style fields
        const lines = line_items || order_line || [];
        if (lines.length > 0) {
            const lineItemsWithDocId = lines.map((line, idx) => ({
                document_id: document.id,
                sequence: line.sequence || ((idx + 1) * 10),
                product_id: line.product_id || null,
                name: line.name || line.product_name_raw || line.product_name || 'Product',
                product_uom: line.product_uom || line.uom || 'Units',
                hsn_code: line.hsn_code || '39232100',
                product_uom_qty: parseFloat(line.product_uom_qty || line.qty || line.quantity || 1),
                price_unit: parseFloat(line.price_unit || line.unit_price || 0),
                discount: parseFloat(line.discount || 0),
                gst_rate: parseFloat(line.gst_rate || 18),
                // Computed fields (DB trigger will override)
                price_subtotal: parseFloat(line.price_subtotal || line.base_amount || 0),
                price_tax: parseFloat(line.price_tax || 0),
                price_total: parseFloat(line.price_total || line.line_total || 0),
                cgst_amount: parseFloat(line.cgst_amount || 0),
                sgst_amount: parseFloat(line.sgst_amount || 0),
                igst_amount: parseFloat(line.igst_amount || 0),
                // Legacy fields
                product_name: line.product_name_raw || line.name || 'Product',
                product_name_raw: line.product_name_raw || line.name || 'Product',
                product_description: line.product_description || null,
                qty: parseFloat(line.qty || line.product_uom_qty || line.quantity || 1),
                unit_price: parseFloat(line.unit_price || line.price_unit || 0),
                base_amount: parseFloat(line.base_amount || line.price_subtotal || 0),
                line_total: parseFloat(line.line_total || line.price_total || 0),
                line_number: idx + 1,
            }));

            const { error: linesError } = await supabase
                .from('document_lines')
                .insert(lineItemsWithDocId);

            if (linesError) {
                console.error('Error creating line items:', linesError);
                // Don't fail the whole request, document was created
            }
        }

        // Create notification for Directors when sales order is confirmed
        if (docState === 'sale') {
            try {
                const { data: directors } = await supabase
                    .from('profiles')
                    .select('user_id, full_name')
                    .eq('role', 'director');

                if (directors && directors.length > 0) {
                    const notifications = directors.map(director => ({
                        user_id: director.user_id,
                        type: 'sales_order_created',
                        title: 'New Sales Order Confirmed',
                        message: `${currentUser.name || 'A salesperson'} confirmed SO #${orderNumber} for ${finalCustomerName} - ₹${finalAmountTotal.toLocaleString('en-IN')}`,
                        metadata: {
                            document_id: document.id,
                            doc_number: orderNumber,
                            customer_name: finalCustomerName,
                            amount_total: finalAmountTotal,
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

        // AUTO-UPDATE: If converting from Quotation, mark original as WON
        if (body.original_quotation_id && docState === 'sale') {
            await supabase
                .from('documents')
                .update({ status: 'won', state: 'done' })
                .eq('id', body.original_quotation_id);
        }

        return NextResponse.json({
            success: true,
            document: document,
            id: document.id,
            name: document.name,
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

/**
 * PATCH /api/documents
 * Update a document (state transitions, field updates).
 * Supports Odoo-style state workflow: draft → sent → sale → done/cancel
 */
export async function PATCH(request) {
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
        const body = await request.json();

        // Get current document
        const { data: currentDoc, error: fetchError } = await supabase
            .from('documents')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !currentDoc) {
            return NextResponse.json(
                { error: 'Document not found' },
                { status: 404 }
            );
        }

        // Check permissions (owner or manager)
        const isOwner = currentDoc.salesperson_user_id === currentUser.id;
        const userIsManager = isManager(currentUser.role);

        if (!isOwner && !userIsManager) {
            return NextResponse.json(
                { error: 'You do not have permission to update this document' },
                { status: 403 }
            );
        }

        // State transition validation
        const stateTransitions = {
            draft: ['sent', 'sale', 'cancel'],
            sent: ['draft', 'sale', 'cancel'],
            sale: ['done', 'cancel'],
            done: [],
            cancel: ['draft'],
        };

        // If state is being updated, validate the transition
        if (body.state && body.state !== currentDoc.state) {
            const allowedTransitions = stateTransitions[currentDoc.state] || [];
            if (!allowedTransitions.includes(body.state)) {
                return NextResponse.json(
                    { error: `Cannot transition from ${currentDoc.state} to ${body.state}` },
                    { status: 400 }
                );
            }
        }

        // Build update payload
        const updatePayload = {};

        // Allowed fields for update
        const allowedFields = [
            'state', 'status', 'note', 'internal_note', 'payment_term_note',
            'validity_date', 'commitment_date', 'client_order_ref',
            'partner_gstin', 'invoice_address', 'shipping_address',
            'place_of_supply', 'fiscal_position', 'confirmed_at', 'confirmed_by',
            'cancelled_at', 'cancelled_by', 'cancel_reason', 'doc_type'
        ];

        allowedFields.forEach(field => {
            if (body[field] !== undefined) {
                updatePayload[field] = body[field];
            }
        });

        // Handle state transition side effects
        if (body.state === 'sale' && currentDoc.state !== 'sale') {
            updatePayload.confirmed_at = new Date().toISOString();
            updatePayload.confirmed_by = currentUser.id;
            updatePayload.doc_type = 'sales_order';
            updatePayload.status = 'open';
        }

        if (body.state === 'cancel') {
            updatePayload.cancelled_at = new Date().toISOString();
            updatePayload.cancelled_by = currentUser.id;
            updatePayload.cancel_reason = body.cancel_reason || 'Cancelled by user';
            updatePayload.status = 'cancelled';
        }

        if (body.state === 'done') {
            updatePayload.status = 'completed';
        }

        // Update the document
        const { data: updated, error: updateError } = await supabase
            .from('documents')
            .update(updatePayload)
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            console.error('Update error:', updateError);
            return NextResponse.json(
                { error: 'Failed to update document', details: updateError.message },
                { status: 500 }
            );
        }

        // Create notification on state change to 'sale'
        if (body.state === 'sale' && currentDoc.state !== 'sale') {
            try {
                const { data: directors } = await supabase
                    .from('profiles')
                    .select('user_id')
                    .eq('role', 'director');

                if (directors && directors.length > 0) {
                    const notifications = directors.map(director => ({
                        user_id: director.user_id,
                        type: 'quotation_confirmed',
                        title: 'Quotation Confirmed as Sales Order',
                        message: `${updated.name || updated.doc_number} has been confirmed as a Sales Order - ₹${(updated.amount_total || 0).toLocaleString('en-IN')}`,
                        metadata: { document_id: id },
                        is_read: false,
                    }));

                    await supabase.from('notifications').insert(notifications);
                }
            } catch (notifError) {
                console.error('Notification error:', notifError);
            }
        }

        return NextResponse.json({
            success: true,
            document: updated,
        });
    } catch (error) {
        console.error('PATCH error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
