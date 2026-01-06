/**
 * HSN Codes API Route
 * GET /api/products/hsn-codes - List all HSN codes
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
            .from('hsn_codes')
            .select('*')
            .order('hsn_code', { ascending: true });

        if (error) {
            console.error('Error fetching HSN codes:', error);
            return NextResponse.json({ error: 'Failed to fetch HSN codes' }, { status: 500 });
        }

        return NextResponse.json({ hsnCodes: data || [] });
    } catch (error) {
        console.error('HSN codes GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
