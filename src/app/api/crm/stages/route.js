/**
 * CRM Stages API - Pipeline stage management
 * SECURITY: Uses custom JWT auth via getCurrentUser()
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/utils/session';

export const dynamic = 'force-dynamic';

// Roles that can manage stages
const MANAGER_ROLES = ['developer', 'director', 'vp', 'head_of_sales', 'manager'];
const ADMIN_ROLES = ['developer', 'director', 'vp', 'head_of_sales'];

/**
 * GET /api/crm/stages - List all pipeline stages with lead counts
 */
export async function GET(request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createAdminClient();
        const { searchParams } = new URL(request.url);
        const teamId = searchParams.get('team_id');
        const includeStats = searchParams.get('include_stats') !== 'false';

        const canSeeAllData = ADMIN_ROLES.includes(currentUser.role);

        // Get stages
        let query = supabase
            .from('crm_stages')
            .select('*')
            .eq('active', true)
            .order('sequence', { ascending: true });

        if (teamId) {
            query = query.or(`team_id.eq.${teamId},team_id.is.null`);
        }

        const { data: stages, error } = await query;
        if (error) throw error;

        if (!includeStats) {
            return NextResponse.json({ success: true, data: stages });
        }

        // Get lead stats for each stage
        const stagesWithStats = await Promise.all(stages.map(async (stage) => {
            let leadsQuery = supabase
                .from('leads')
                .select('id, expected_revenue, probability', { count: 'exact' })
                .eq('stage_id', stage.id)
                .eq('active', true);

            if (teamId) {
                leadsQuery = leadsQuery.eq('team_id', teamId);
            }

            // RBAC for non-admins: only their own leads
            if (!canSeeAllData) {
                leadsQuery = leadsQuery.eq('user_id', currentUser.id);
            }

            const { data: leads, count } = await leadsQuery;

            const totalRevenue = leads?.reduce((sum, l) => sum + (l.expected_revenue || 0), 0) || 0;
            const weightedRevenue = leads?.reduce((sum, l) =>
                sum + ((l.expected_revenue || 0) * (l.probability || 0) / 100), 0
            ) || 0;

            return {
                ...stage,
                leads_count: count || 0,
                total_revenue: totalRevenue,
                weighted_revenue: weightedRevenue
            };
        }));

        return NextResponse.json({ success: true, data: stagesWithStats });

    } catch (error) {
        console.error('GET /api/crm/stages error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/crm/stages - Create new stage
 */
export async function POST(request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only managers can create stages
        if (!MANAGER_ROLES.includes(currentUser.role)) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const supabase = createAdminClient();
        const body = await request.json();

        const stageData = {
            name: body.name,
            sequence: body.sequence || 10,
            is_won: body.is_won || false,
            fold: body.fold || false,
            team_id: body.team_id || null,
            requirements: body.requirements,
            company_id: body.company_id,
            active: true
        };

        const { data: stage, error } = await supabase
            .from('crm_stages')
            .insert(stageData)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data: stage }, { status: 201 });

    } catch (error) {
        console.error('POST /api/crm/stages error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * PUT /api/crm/stages - Bulk reorder stages
 */
export async function PUT(request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!MANAGER_ROLES.includes(currentUser.role)) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const supabase = createAdminClient();
        const body = await request.json();
        const { stages } = body; // Array of { id, sequence }

        if (!Array.isArray(stages)) {
            return NextResponse.json({ error: 'stages must be an array' }, { status: 400 });
        }

        // Update each stage's sequence
        for (const stage of stages) {
            const { error } = await supabase
                .from('crm_stages')
                .update({ sequence: stage.sequence })
                .eq('id', stage.id);

            if (error) throw error;
        }

        return NextResponse.json({ success: true, message: 'Stages reordered' });

    } catch (error) {
        console.error('PUT /api/crm/stages error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
