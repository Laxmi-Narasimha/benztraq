/**
 * Sales Team Service - Odoo-style Team Management
 * Replicates crm.team model logic from Odoo
 * 
 * FIXED: Uses 'profiles' table instead of non-existent 'users' table
 */

/**
 * Calculate team performance metrics
 */
export async function calculateTeamMetrics(supabase, teamId) {
    // Get team leads/opportunities
    const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id, expected_revenue, probability, stage_id, type, user_id')
        .eq('team_id', teamId)
        .eq('active', true)
        .eq('type', 'opportunity');

    if (leadsError) throw leadsError;

    // Get team sales orders
    const { data: orders, error: ordersError } = await supabase
        .from('documents')
        .select('id, amount_total, state')
        .eq('team_id', teamId)
        .in('doc_type', ['quotation', 'sales_order']);

    if (ordersError) throw ordersError;

    // Calculate metrics
    const openOpportunities = leads?.length || 0;
    const totalPipelineValue = leads?.reduce((sum, l) => sum + (l.expected_revenue || 0), 0) || 0;
    const weightedPipelineValue = leads?.reduce((sum, l) =>
        sum + ((l.expected_revenue || 0) * (l.probability || 0) / 100), 0
    ) || 0;

    const confirmedOrders = orders?.filter(o => o.state === 'sale') || [];
    const totalSales = confirmedOrders.reduce((sum, o) => sum + (o.amount_total || 0), 0);
    const quotations = orders?.filter(o => o.state === 'draft' || o.state === 'sent') || [];
    const quotationsValue = quotations.reduce((sum, o) => sum + (o.amount_total || 0), 0);

    return {
        opportunities_count: openOpportunities,
        opportunities_amount: totalPipelineValue,
        weighted_pipeline: weightedPipelineValue,
        sales_order_count: confirmedOrders.length,
        sales_amount: totalSales,
        quotation_count: quotations.length,
        quotation_amount: quotationsValue
    };
}

/**
 * Get team members with their stats
 * FIXED: Uses 'profiles' table instead of 'users'
 */
export async function getTeamMembersWithStats(supabase, teamId) {
    // Get users assigned to this team via profiles
    const { data: members, error: membersError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, role')
        .eq('sales_team_id', teamId)
        .eq('is_active', true);

    if (membersError) {
        // If sales_team_id column doesn't exist, return empty array gracefully
        console.warn('getTeamMembersWithStats: Could not fetch team members', membersError);
        return [];
    }

    if (!members || members.length === 0) return [];

    // Get stats for each member
    const membersWithStats = await Promise.all(members.map(async (member) => {
        // Get leads
        const { data: leads } = await supabase
            .from('leads')
            .select('id, expected_revenue, probability')
            .eq('user_id', member.user_id)
            .eq('active', true);

        // Get orders
        const { data: orders } = await supabase
            .from('documents')
            .select('id, amount_total, state')
            .eq('salesperson_id', member.user_id)
            .in('doc_type', ['quotation', 'sales_order']);

        const openLeads = leads?.length || 0;
        const pipelineValue = leads?.reduce((sum, l) => sum + (l.expected_revenue || 0), 0) || 0;
        const confirmedOrders = orders?.filter(o => o.state === 'sale') || [];
        const salesAmount = confirmedOrders.reduce((sum, o) => sum + (o.amount_total || 0), 0);

        return {
            id: member.user_id,
            full_name: member.full_name,
            email: member.email,
            role: member.role,
            stats: {
                open_leads: openLeads,
                pipeline_value: pipelineValue,
                orders_count: confirmedOrders.length,
                sales_amount: salesAmount
            }
        };
    }));

    return membersWithStats;
}

/**
 * Auto-assign lead to team member (round-robin)
 * FIXED: Uses 'profiles' table instead of 'users'
 */
export async function autoAssignLead(supabase, teamId, leadId) {
    // Get team config
    const { data: team, error: teamError } = await supabase
        .from('sales_teams')
        .select('*')
        .eq('id', teamId)
        .single();

    if (teamError) throw teamError;
    if (!team.assignment_enabled) {
        return null; // Auto-assignment disabled
    }

    // Get team members with their current lead counts
    const { data: members, error: membersError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .eq('sales_team_id', teamId)
        .eq('is_active', true);

    if (membersError) {
        console.warn('autoAssignLead: Could not fetch team members', membersError);
        return null;
    }
    if (!members?.length) return null;

    // Get lead counts for each member
    const memberStats = await Promise.all(members.map(async (member) => {
        const { count } = await supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', member.user_id)
            .eq('active', true);

        return {
            id: member.user_id,
            full_name: member.full_name,
            lead_count: count || 0
        };
    }));

    // Find member with lowest leads (below max)
    const eligibleMembers = memberStats.filter(m =>
        m.lead_count < (team.assignment_max || 30)
    );

    if (!eligibleMembers.length) return null;

    // Assign to member with lowest count
    eligibleMembers.sort((a, b) => a.lead_count - b.lead_count);
    const assignee = eligibleMembers[0];

    // Update lead
    const { data: updatedLead, error: updateError } = await supabase
        .from('leads')
        .update({
            user_id: assignee.id,
            team_id: teamId,
            date_open: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', leadId)
        .select()
        .single();

    if (updateError) throw updateError;

    return { assignee, lead: updatedLead };
}

/**
 * Get team leaderboard
 * FIXED: Uses 'profiles' table instead of 'users'
 */
export async function getTeamLeaderboard(supabase, teamId, period = 'month') {
    // Calculate date range
    const now = new Date();
    let startDate;

    switch (period) {
        case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
        case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
        case 'quarter':
            startDate = new Date(now.setMonth(now.getMonth() - 3));
            break;
        case 'year':
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
        default:
            startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    // Get team members from profiles
    const { data: members, error: membersError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .eq('sales_team_id', teamId)
        .eq('is_active', true);

    if (membersError) {
        console.warn('getTeamLeaderboard: Could not fetch team members', membersError);
        return [];
    }
    if (!members?.length) return [];

    // Get stats for each member in the period
    const leaderboard = await Promise.all(members.map(async (member) => {
        // Won opportunities
        const { data: wonLeads } = await supabase
            .from('leads')
            .select('id, expected_revenue')
            .eq('user_id', member.user_id)
            .eq('probability', 100)
            .gte('date_closed', startDate.toISOString());

        // Confirmed orders
        const { data: orders } = await supabase
            .from('documents')
            .select('id, amount_total')
            .eq('salesperson_id', member.user_id)
            .eq('state', 'sale')
            .gte('date_order', startDate.toISOString());

        const dealsWon = wonLeads?.length || 0;
        const revenueWon = wonLeads?.reduce((sum, l) => sum + (l.expected_revenue || 0), 0) || 0;
        const orderCount = orders?.length || 0;
        const orderValue = orders?.reduce((sum, o) => sum + (o.amount_total || 0), 0) || 0;

        return {
            id: member.user_id,
            full_name: member.full_name,
            deals_won: dealsWon,
            revenue_won: revenueWon,
            orders: orderCount,
            order_value: orderValue,
            total_value: revenueWon + orderValue
        };
    }));

    // Sort by total value
    leaderboard.sort((a, b) => b.total_value - a.total_value);

    // Add rank
    return leaderboard.map((member, index) => ({
        ...member,
        rank: index + 1
    }));
}

/**
 * Create default sales teams
 */
export async function createDefaultTeams(supabase, companyId) {
    const defaultTeams = [
        {
            name: 'Direct Sales',
            sequence: 1,
            use_leads: true,
            use_opportunities: true,
            assignment_enabled: true,
            color: 1,
            company_id: companyId,
            active: true
        },
        {
            name: 'Online Sales',
            sequence: 2,
            use_leads: true,
            use_opportunities: true,
            assignment_enabled: false,
            color: 2,
            company_id: companyId,
            active: true
        },
        {
            name: 'Key Accounts',
            sequence: 3,
            use_leads: false,
            use_opportunities: true,
            assignment_enabled: false,
            color: 5,
            company_id: companyId,
            active: true
        }
    ];

    const { data, error } = await supabase
        .from('sales_teams')
        .upsert(defaultTeams, { onConflict: 'name' })
        .select();

    if (error) throw error;
    return data;
}

export default {
    calculateTeamMetrics,
    getTeamMembersWithStats,
    autoAssignLead,
    getTeamLeaderboard,
    createDefaultTeams
};
