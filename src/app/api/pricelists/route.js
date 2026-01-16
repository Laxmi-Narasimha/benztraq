/**
 * Pricelists API - Price management
 * SECURITY: Uses custom JWT auth via getCurrentUser()
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/utils/session';

export const dynamic = 'force-dynamic';

// Roles that can manage pricelists
const MANAGER_ROLES = ['developer', 'director', 'vp', 'head_of_sales', 'manager'];

/**
 * GET /api/pricelists - List pricelists
 */
export async function GET(request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createAdminClient();
        const { searchParams } = new URL(request.url);
        const includeItems = searchParams.get('include_items') === 'true';

        let query = supabase
            .from('pricelists')
            .select(includeItems ? `
                *,
                items:pricelist_items(
                    id,
                    product_id,
                    category_id,
                    compute_price,
                    fixed_price,
                    percent_price,
                    date_start,
                    date_end,
                    min_quantity,
                    product:products(id, name)
                )
            ` : '*')
            .eq('active', true)
            .order('name', { ascending: true });

        const { data, error } = await query;

        if (error) throw error;
        return NextResponse.json({ success: true, data });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/pricelists - Create pricelist
 */
export async function POST(request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!MANAGER_ROLES.includes(currentUser.role)) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const supabase = createAdminClient();
        const body = await request.json();

        const { data, error } = await supabase
            .from('pricelists')
            .insert({
                name: body.name,
                currency_id: body.currency_id || 'INR',
                discount_policy: body.discount_policy || 'with_discount',
                company_id: body.company_id
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
