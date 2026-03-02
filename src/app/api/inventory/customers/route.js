/**
 * Inventory Customers API
 * GET /api/inventory/customers - List unique customers for filters
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/utils/session';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createAdminClient();

        const { data } = await supabase
            .from('inventory_items')
            .select('customer_name')
            .eq('is_active', true)
            .order('customer_name');

        // Get unique customers with item counts
        const customerMap = {};
        (data || []).forEach(item => {
            customerMap[item.customer_name] = (customerMap[item.customer_name] || 0) + 1;
        });

        const customers = Object.entries(customerMap)
            .map(([name, count]) => ({ customer_name: name, item_count: count }))
            .sort((a, b) => a.customer_name.localeCompare(b.customer_name));

        return NextResponse.json({ customers });
    } catch (error) {
        console.error('[Inventory] Customers error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
