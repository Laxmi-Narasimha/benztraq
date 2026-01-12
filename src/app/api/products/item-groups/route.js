/**
 * Item Groups API Route
 * GET /api/products/item-groups - List all item groups
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/utils/session';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('item_groups')
            .select('*')
            .order('path', { ascending: true });

        if (error) {
            console.error('Error fetching item groups:', error);
            return NextResponse.json({ error: 'Failed to fetch item groups' }, { status: 500 });
        }

        return NextResponse.json({ itemGroups: data || [] });
    } catch (error) {
        console.error('Item groups GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
