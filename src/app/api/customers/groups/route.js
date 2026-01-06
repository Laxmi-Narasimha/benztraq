/**
 * Customer Groups API Route
 * GET /api/customers/groups - List all customer groups
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createServerClient();

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
