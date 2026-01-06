/**
 * Brands API Route
 * GET /api/products/brands - List all brands
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
