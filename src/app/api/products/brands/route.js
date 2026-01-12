/**
 * Brands API Route
 * GET /api/products/brands - List all brands
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
            .from('brands')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching brands:', error);
            return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
        }

        return NextResponse.json({ brands: data || [] });
    } catch (error) {
        console.error('Brands GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
