/**
 * Inventory Transactions API
 * POST /api/inventory/[id]/transactions - Record inward/outward
 * GET /api/inventory/[id]/transactions - List transaction history
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
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        const supabase = createAdminClient();
        const offset = (page - 1) * limit;

        const { data, error, count } = await supabase
            .from('inventory_transactions')
            .select('*', { count: 'exact' })
            .eq('item_id', id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            transactions: data || [],
            total: count || 0,
            page,
            limit,
        });
    } catch (error) {
        console.error('[Inventory] GET transactions error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only store_manager can record transactions
        const allowedRoles = ['store_manager'];
        if (!allowedRoles.includes(session.role)) {
            return NextResponse.json({ error: 'Access denied. Only the store manager can record inward/outward transactions.' }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { type, quantity, reference_note } = body;

        // Validate
        if (!type || !['inward', 'outward'].includes(type)) {
            return NextResponse.json({ error: 'Type must be "inward" or "outward"' }, { status: 400 });
        }

        const qty = parseFloat(quantity);
        if (!qty || qty <= 0) {
            return NextResponse.json({ error: 'Quantity must be a positive number' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Verify item exists
        const { data: item } = await supabase
            .from('inventory_items')
            .select('id, balance_qty')
            .eq('id', id)
            .single();

        if (!item) {
            return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
        }

        // For outward, check if enough balance
        if (type === 'outward' && qty > item.balance_qty) {
            return NextResponse.json({
                error: `Insufficient stock. Available: ${item.balance_qty}, Requested: ${qty}`
            }, { status: 400 });
        }

        // Insert transaction - trigger will auto-update totals
        const { data: txn, error } = await supabase
            .from('inventory_transactions')
            .insert({
                item_id: id,
                type,
                quantity: qty,
                reference_note: reference_note || null,
                created_by: session.sub,
                created_by_name: session.full_name || session.email,
            })
            .select()
            .single();

        if (error) {
            console.error('[Inventory] Transaction error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Fetch updated item
        const { data: updatedItem } = await supabase
            .from('inventory_items')
            .select('*')
            .eq('id', id)
            .single();

        return NextResponse.json({
            transaction: txn,
            item: updatedItem,
        }, { status: 201 });
    } catch (error) {
        console.error('[Inventory] POST transaction error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
