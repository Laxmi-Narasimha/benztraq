/**
 * Company Transactions API
 * GET /api/inventory/transactions?customer=NAME&limit=10
 * Returns recent transactions for all items belonging to a company.
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
        const limit = parseInt(searchParams.get('limit') || '10');

        const supabase = createAdminClient();

        let query = supabase
            .from('inventory_transactions')
            .select(`
                id, type, quantity, reference_note, created_by_name, created_at,
                inventory_items!inner(id, customer_name, material_type, part_size)
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (customer) {
            query = query.eq('inventory_items.customer_name', customer.toUpperCase());
        }

        const { data, error } = await query;

        if (error) {
            console.error('[Inventory] Transactions list error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Flatten for frontend consumption
        const transactions = (data || []).map(txn => ({
            id: txn.id,
            type: txn.type,
            quantity: txn.quantity,
            reference_note: txn.reference_note,
            created_by_name: txn.created_by_name,
            created_at: txn.created_at,
            material_type: txn.inventory_items?.material_type || '',
            part_size: txn.inventory_items?.part_size || '',
        }));

        return NextResponse.json({ transactions });
    } catch (error) {
        console.error('[Inventory] Transactions error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
