/**
 * Industries API Route
 * GET /api/customers/industries - List all industries
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
            .from('industries')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching industries:', error);
            return NextResponse.json({ error: 'Failed to fetch industries' }, { status: 500 });
        }

        return NextResponse.json({ industries: data || [] });
    } catch (error) {
        console.error('Industries GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
