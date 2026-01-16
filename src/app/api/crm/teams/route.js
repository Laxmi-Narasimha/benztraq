/**
 * Sales Teams API - Team management with metrics
 * SECURITY: Uses custom JWT auth via getCurrentUser()
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/utils/session';
import {
    calculateTeamMetrics,
    getTeamMembersWithStats,
    getTeamLeaderboard
} from '@/lib/services/sales-team-service';

export const dynamic = 'force-dynamic';

// Roles that can manage teams
const MANAGER_ROLES = ['developer', 'director', 'vp', 'head_of_sales', 'manager'];

/**
 * GET /api/crm/teams - List all sales teams with optional metrics
 */
export async function GET(request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createAdminClient();
        const { searchParams } = new URL(request.url);
        const includeMetrics = searchParams.get('include_metrics') === 'true';
        const includeMembers = searchParams.get('include_members') === 'true';

        // Get teams
        const { data: teams, error } = await supabase
            .from('sales_teams')
            .select('*')
            .eq('active', true)
            .order('sequence', { ascending: true });

        if (error) throw error;

        // Add metrics if requested
        if (includeMetrics || includeMembers) {
            const teamsWithData = await Promise.all(teams.map(async (team) => {
                const result = { ...team };

                if (includeMetrics) {
                    try {
                        result.metrics = await calculateTeamMetrics(supabase, team.id);
                    } catch (e) {
                        result.metrics = null;
                    }
                }

                if (includeMembers) {
                    try {
                        result.members = await getTeamMembersWithStats(supabase, team.id);
                    } catch (e) {
                        result.members = [];
                    }
                }

                return result;
            }));

            return NextResponse.json({ success: true, data: teamsWithData });
        }

        return NextResponse.json({ success: true, data: teams });

    } catch (error) {
        console.error('GET /api/crm/teams error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/crm/teams - Create new sales team
 */
export async function POST(request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only managers can create teams
        if (!MANAGER_ROLES.includes(currentUser.role)) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const supabase = createAdminClient();
        const body = await request.json();

        const teamData = {
            name: body.name,
            sequence: body.sequence || 10,
            active: true,
            company_id: body.company_id,
            use_leads: body.use_leads ?? true,
            use_opportunities: body.use_opportunities ?? true,
            assignment_enabled: body.assignment_enabled ?? false,
            assignment_max: body.assignment_max || 30,
            assignment_domain: body.assignment_domain,
            lead_properties_definition: body.lead_properties_definition,
            color: body.color || 0
        };

        const { data: team, error } = await supabase
            .from('sales_teams')
            .insert(teamData)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data: team }, { status: 201 });

    } catch (error) {
        console.error('POST /api/crm/teams error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
