/**
 * Inventory Item Detail API
 * GET /api/inventory/[id] - Get item with recent transactions
 * PATCH /api/inventory/[id] - Update item master data
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/utils/session';

export async function GET(request, { params }) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const supabase = createAdminClient();

        // Get item
        const { data: item, error } = await supabase
            .from('inventory_items')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        // Get recent transactions
        const { data: transactions } = await supabase
            .from('inventory_transactions')
            .select('*')
            .eq('item_id', id)
            .order('created_at', { ascending: false })
            .limit(50);

        return NextResponse.json({
            item,
            transactions: transactions || [],
        });
    } catch (error) {
        console.error('[Inventory] GET detail error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request, { params }) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const allowedRoles = ['store_manager', 'director', 'head_of_sales', 'vp', 'developer'];
        if (!allowedRoles.includes(session.role)) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();

        // Only allow updating master data fields
        const allowedFields = ['customer_name', 'material_type', 'part_size', 'customer_part_code', 'uom', 'kg_per_piece', 'warehouse', 'notes', 'is_active'];
        const updates = {};
        for (const key of allowedFields) {
            if (body[key] !== undefined) {
                updates[key] = body[key];
            }
        }

        if (updates.customer_name) {
            updates.customer_name = updates.customer_name.toUpperCase();
        }

        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('inventory_items')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[Inventory] Update error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ item: data });
    } catch (error) {
        console.error('[Inventory] PATCH error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
