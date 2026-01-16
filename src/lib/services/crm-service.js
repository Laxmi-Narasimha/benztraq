/**
 * CRM Service - Odoo-style Lead/Opportunity Management
 * Replicates crm.lead model logic from Odoo
 */

// Lead type constants
export const LEAD_TYPES = {
    LEAD: 'lead',
    OPPORTUNITY: 'opportunity'
};

// Priority levels (matching Odoo)
export const PRIORITIES = {
    LOW: '0',
    MEDIUM: '1',
    HIGH: '2',
    VERY_HIGH: '3'
};

// Validation states
export const VALIDATION_STATES = {
    CORRECT: 'correct',
    INCORRECT: 'incorrect'
};

/**
 * Calculate automated probability based on lead scoring
 * Mimics Odoo's predictive lead scoring
 */
export function calculateAutomatedProbability(lead, stageConfig = {}) {
    let probability = 0;

    // Base probability from stage
    if (stageConfig.is_won) {
        return 100;
    }

    // Stage sequence contribution (max 40%)
    const stageContribution = Math.min((stageConfig.sequence || 1) * 8, 40);
    probability += stageContribution;

    // Email quality (10%)
    if (lead.email_from && lead.email_state === 'correct') {
        probability += 10;
    }

    // Phone quality (10%)
    if ((lead.phone || lead.mobile) && lead.phone_state === 'correct') {
        probability += 10;
    }

    // Expected revenue (max 15%)
    if (lead.expected_revenue > 0) {
        probability += Math.min(lead.expected_revenue / 100000, 15);
    }

    // Partner linked (10%)
    if (lead.partner_id) {
        probability += 10;
    }

    // Has deadline (5%)
    if (lead.date_deadline) {
        probability += 5;
    }

    // UTM source (5%)
    if (lead.source_id) {
        probability += 5;
    }

    // Cap at 99% (100% only for won)
    return Math.min(Math.round(probability), 99);
}

/**
 * Calculate prorated revenue based on probability
 */
export function calculateProratedRevenue(expectedRevenue, probability) {
    return (expectedRevenue || 0) * (probability / 100);
}

/**
 * Validate email format
 */
export function validateEmail(email) {
    if (!email) return { valid: false, state: 'incorrect' };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const valid = emailRegex.test(email);
    return { valid, state: valid ? 'correct' : 'incorrect' };
}

/**
 * Validate phone number (Indian format)
 */
export function validatePhone(phone) {
    if (!phone) return { valid: false, state: 'incorrect' };
    // Remove spaces, dashes, and country code
    const cleaned = phone.replace(/[\s\-\+]/g, '');
    // Indian phone: 10 digits, optionally with 91 prefix
    const phoneRegex = /^(91)?[6-9]\d{9}$/;
    const valid = phoneRegex.test(cleaned);
    return { valid, state: valid ? 'correct' : 'incorrect' };
}

/**
 * Prepare lead data for saving (Odoo onchange equivalent)
 */
export function prepareLeadForSave(leadData, existingLead = {}) {
    const prepared = { ...existingLead, ...leadData };

    // Validate email
    if (prepared.email_from !== existingLead.email_from) {
        const emailValidation = validateEmail(prepared.email_from);
        prepared.email_state = emailValidation.state;
    }

    // Validate phone
    if (prepared.phone !== existingLead.phone || prepared.mobile !== existingLead.mobile) {
        const phone = prepared.phone || prepared.mobile;
        const phoneValidation = validatePhone(phone);
        prepared.phone_state = phoneValidation.state;
    }

    // Auto-set type based on stage
    if (prepared.stage_id && !prepared.type) {
        prepared.type = LEAD_TYPES.OPPORTUNITY;
    }

    // Calculate prorated revenue
    if (prepared.expected_revenue && prepared.probability) {
        prepared.prorated_revenue = calculateProratedRevenue(
            prepared.expected_revenue,
            prepared.probability
        );
    }

    // Set timestamps
    const now = new Date().toISOString();
    prepared.updated_at = now;

    // Track stage changes
    if (leadData.stage_id && leadData.stage_id !== existingLead.stage_id) {
        prepared.date_last_stage_update = now;

        // If first stage assignment
        if (!existingLead.stage_id) {
            prepared.date_open = now;
        }
    }

    return prepared;
}

/**
 * Convert lead to opportunity
 */
export function convertToOpportunity(lead, partnerId = null) {
    return {
        ...lead,
        type: LEAD_TYPES.OPPORTUNITY,
        partner_id: partnerId || lead.partner_id,
        date_conversion: new Date().toISOString()
    };
}

/**
 * Mark lead as won
 */
export function markLeadWon(lead) {
    return {
        ...lead,
        probability: 100,
        automated_probability: 100,
        date_closed: new Date().toISOString()
    };
}

/**
 * Mark lead as lost with reason
 */
export function markLeadLost(lead, lostReasonId) {
    return {
        ...lead,
        probability: 0,
        automated_probability: 0,
        active: false,
        lost_reason_id: lostReasonId,
        date_closed: new Date().toISOString()
    };
}

/**
 * Calculate days to close
 */
export function calculateDaysToClose(lead) {
    if (!lead.date_closed || !lead.created_at) return null;

    const created = new Date(lead.created_at);
    const closed = new Date(lead.date_closed);
    const diffMs = closed - created;

    return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Calculate days open (to assign)
 */
export function calculateDaysOpen(lead) {
    if (!lead.date_open || !lead.created_at) return null;

    const created = new Date(lead.created_at);
    const opened = new Date(lead.date_open);
    const diffMs = opened - created;

    return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Get default stage for new lead/opportunity
 */
export async function getDefaultStage(supabase, type = 'lead', teamId = null) {
    let query = supabase
        .from('crm_stages')
        .select('*')
        .eq('active', true)
        .order('sequence', { ascending: true })
        .limit(1);

    if (teamId) {
        query = query.or(`team_id.eq.${teamId},team_id.is.null`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data?.[0] || null;
}

/**
 * Get pipeline stages with lead counts
 */
export async function getPipelineStages(supabase, options = {}) {
    const { teamId, userId, type = 'opportunity' } = options;

    // Get stages
    const { data: stages, error: stagesError } = await supabase
        .from('crm_stages')
        .select('*')
        .eq('active', true)
        .order('sequence', { ascending: true });

    if (stagesError) throw stagesError;

    // Get lead counts per stage
    let leadsQuery = supabase
        .from('leads')
        .select('stage_id, expected_revenue, probability')
        .eq('active', true)
        .eq('type', type);

    if (teamId) {
        leadsQuery = leadsQuery.eq('team_id', teamId);
    }
    if (userId) {
        leadsQuery = leadsQuery.eq('user_id', userId);
    }

    const { data: leads, error: leadsError } = await leadsQuery;

    if (leadsError) throw leadsError;

    // Calculate stats per stage
    return stages.map(stage => {
        const stageLeads = leads.filter(l => l.stage_id === stage.id);
        return {
            ...stage,
            leads_count: stageLeads.length,
            total_revenue: stageLeads.reduce((sum, l) => sum + (l.expected_revenue || 0), 0),
            weighted_revenue: stageLeads.reduce((sum, l) =>
                sum + ((l.expected_revenue || 0) * (l.probability || 0) / 100), 0
            )
        };
    });
}

/**
 * Assign lead to user (with auto-assignment logic)
 */
export async function assignLead(supabase, leadId, userId, options = {}) {
    const { teamId } = options;

    const updateData = {
        user_id: userId,
        date_open: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    if (teamId) {
        updateData.team_id = teamId;
    }

    const { data, error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', leadId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Bulk update leads (for Kanban drag-drop)
 */
export async function bulkUpdateLeads(supabase, updates) {
    const results = [];

    for (const update of updates) {
        const { id, ...data } = update;
        const { data: result, error } = await supabase
            .from('leads')
            .update({
                ...data,
                date_last_stage_update: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        results.push(result);
    }

    return results;
}

export default {
    LEAD_TYPES,
    PRIORITIES,
    VALIDATION_STATES,
    calculateAutomatedProbability,
    calculateProratedRevenue,
    validateEmail,
    validatePhone,
    prepareLeadForSave,
    convertToOpportunity,
    markLeadWon,
    markLeadLost,
    calculateDaysToClose,
    calculateDaysOpen,
    getDefaultStage,
    getPipelineStages,
    assignLead,
    bulkUpdateLeads
};
