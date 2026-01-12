/**
 * Customer Groups API Route
 * GET /api/customers/groups - List all customer groups
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
            .from('customer_groups')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching customer groups:', error);
            return NextResponse.json({ error: 'Failed to fetch customer groups' }, { status: 500 });
        }

        return NextResponse.json({ customerGroups: data || [] });
    } catch (error) {
        console.error('Customer groups GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
