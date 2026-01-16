/**
 * UTM Campaigns API - Marketing Attribution
 * SECURITY: Uses custom JWT auth via getCurrentUser()
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/utils/session';

export const dynamic = 'force-dynamic';

// Roles that can manage campaigns
const MANAGER_ROLES = ['developer', 'director', 'vp', 'head_of_sales', 'manager'];

/**
 * GET /api/utm/campaigns - List UTM campaigns
 */
export async function GET(request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createAdminClient();

        const { data: campaigns, error } = await supabase
            .from('utm_campaigns')
            .select('*')
            .eq('active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ success: true, data: campaigns });

    } catch (error) {
        console.error('GET /api/utm/campaigns error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/utm/campaigns - Create campaign
 */
export async function POST(request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only managers can create campaigns
        if (!MANAGER_ROLES.includes(currentUser.role)) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const supabase = createAdminClient();
        const body = await request.json();

        const { data: campaign, error } = await supabase
            .from('utm_campaigns')
            .insert({
                name: body.name,
                title: body.title,
                user_id: body.user_id || currentUser.id,
                is_auto_campaign: body.is_auto_campaign || false,
                color: body.color || 0,
                company_id: body.company_id
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data: campaign }, { status: 201 });

    } catch (error) {
        console.error('POST /api/utm/campaigns error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
