/**
 * Inventory API Route
 * GET /api/inventory - List inventory items with filters
 * POST /api/inventory - Create new inventory item
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/utils/session';

export async function GET(request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const customer = searchParams.get('customer');
        const material = searchParams.get('material');
        const warehouse = searchParams.get('warehouse') || 'FG STOCK';
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const sortBy = searchParams.get('sortBy') || 'customer_name';
        const sortDir = searchParams.get('sortDir') || 'asc';
        const showZero = searchParams.get('showZero') === 'true';
        const allWarehouses = searchParams.get('allWarehouses') === 'true';

        const supabase = createAdminClient();

        let query = supabase
            .from('inventory_items')
            .select('*', { count: 'exact' })
            .eq('is_active', true);

        // Warehouse filter
        if (!allWarehouses && warehouse) {
            query = query.eq('warehouse', warehouse);
        }

        // Customer filter — exact match for company pages
        if (customer) {
            query = query.eq('customer_name', customer.toUpperCase());
        }

        // Material type filter
        if (material) {
            query = query.ilike('material_type', `%${material}%`);
        }

        // Search across multiple fields
        if (search) {
            query = query.or(
                `customer_name.ilike.%${search}%,material_type.ilike.%${search}%,part_size.ilike.%${search}%,customer_part_code.ilike.%${search}%`
            );
        }

        // Filter zero-balance items
        if (!showZero) {
            query = query.gt('balance_qty', 0);
        }

        // Sorting
        const ascending = sortDir === 'asc';
        query = query.order(sortBy, { ascending });

        // Pagination
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error('[Inventory] List error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            items: data || [],
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit),
        });
    } catch (error) {
        console.error('[Inventory] GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check role - only store_manager, director, vp, developer
        const allowedRoles = ['store_manager', 'director', 'head_of_sales', 'vp', 'developer'];
        if (!allowedRoles.includes(session.role)) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const body = await request.json();
        const { customer_name, material_type, part_size, customer_part_code, uom, kg_per_piece, warehouse, notes } = body;

        if (!customer_name) {
            return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
        }

        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('inventory_items')
            .insert({
                customer_name: customer_name.toUpperCase(),
                material_type: material_type || null,
                part_size: part_size || null,
                customer_part_code: customer_part_code || null,
                uom: (uom || 'PCS').toUpperCase(),
                kg_per_piece: parseFloat(kg_per_piece) || 0,
                warehouse: warehouse || 'FG STOCK',
                notes: notes || null,
            })
            .select()
            .single();

        if (error) {
            console.error('[Inventory] Create error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ item: data }, { status: 201 });
    } catch (error) {
        console.error('[Inventory] POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
