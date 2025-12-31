/**
 * Documents API Route
 * 
 * Handles CRUD operations for documents (quotations, sales orders, invoices).
 * 
 * @module app/api/documents/route
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { documentCreateSchema, validateWithSchema } from '@/lib/schemas';

/**
 * GET /api/documents
 * Fetch documents with optional filters.
 */
export async function GET(request) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
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
            .select(`
        *,
        customer:customers(id, name),
        region:regions(id, name),
        salesperson:profiles!documents_salesperson_user_id_fkey(user_id, full_name)
      `)
            .order('doc_date', { ascending: false })
            .range(offset, offset + limit - 1);

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
                { error: 'Failed to fetch documents' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            documents: data,
            count,
            limit,
            offset,
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/documents
 * Create a new document with line items.
 */
export async function POST(request) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const validation = validateWithSchema(documentCreateSchema, body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.errors },
                { status: 400 }
            );
        }

        const { line_items, ...documentData } = validation.data;

        // Insert document
        const { data: document, error: docError } = await supabase
            .from('documents')
            .insert({
                ...documentData,
                created_by: user.id,
            })
            .select()
            .single();

        if (docError) {
            console.error('Error creating document:', docError);
            return NextResponse.json(
                { error: 'Failed to create document' },
                { status: 500 }
            );
        }

        // Insert line items
        const lineItemsWithDocId = line_items.map((line) => ({
            ...line,
            document_id: document.id,
            product_name_raw: line.product_name_raw || line.product_name,
        }));

        const { error: linesError } = await supabase
            .from('document_lines')
            .insert(lineItemsWithDocId);

        if (linesError) {
            console.error('Error creating line items:', linesError);
            // Rollback document creation
            await supabase.from('documents').delete().eq('id', document.id);
            return NextResponse.json(
                { error: 'Failed to create line items' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            document: document,
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
