/**
 * Lost Reasons API
 * SECURITY: Uses custom JWT auth via getCurrentUser()
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/utils/session';

export const dynamic = 'force-dynamic';

// Roles that can manage lost reasons
const MANAGER_ROLES = ['developer', 'director', 'vp', 'head_of_sales', 'manager'];

export async function GET(request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('lost_reasons')
            .select('*')
            .eq('active', true)
            .order('name', { ascending: true });

        if (error) throw error;
        return NextResponse.json({ success: true, data });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only managers can create lost reasons
        if (!MANAGER_ROLES.includes(currentUser.role)) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const supabase = createAdminClient();
        const body = await request.json();

        const { data, error } = await supabase
            .from('lost_reasons')
            .insert({
                name: body.name,
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
