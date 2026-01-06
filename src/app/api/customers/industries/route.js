/**
 * Industries API Route
 * GET /api/customers/industries - List all industries
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
