/**
 * CRM Leads API - Odoo-style Lead/Opportunity Management
 * Full CRUD with all Odoo crm.lead fields
 * 
 * SECURITY: Uses custom JWT auth via getCurrentUser()
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/utils/session';
import {
    prepareLeadForSave,
    calculateAutomatedProbability,
    getDefaultStage,
    LEAD_TYPES
} from '@/lib/services/crm-service';
import { autoAssignLead } from '@/lib/services/sales-team-service';

export const dynamic = 'force-dynamic';

// Roles that can see all leads
const ADMIN_ROLES = ['developer', 'director', 'vp', 'head_of_sales'];

/**
 * GET /api/crm/leads - List leads/opportunities with filters
 */
export async function GET(request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createAdminClient();
        const { searchParams } = new URL(request.url);

        // Get user's profile to get role
        const { data: profile } = await supabase
            .from('profiles')
            .select('*, role:roles(id, name)')
            .eq('user_id', currentUser.id)
            .single();

        const userRole = profile?.role?.name || currentUser.role;
        const canSeeAllData = ADMIN_ROLES.includes(userRole);

        // Filter parameters
        const type = searchParams.get('type'); // 'lead' or 'opportunity'
        const stageId = searchParams.get('stage_id');
        const teamId = searchParams.get('team_id');
        const userId = searchParams.get('user_id');
        const partnerId = searchParams.get('partner_id');
        const priority = searchParams.get('priority');
        const active = searchParams.get('active') !== 'false';
        const search = searchParams.get('search');

        // Pagination
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = (page - 1) * limit;

        // Sorting
        const sortBy = searchParams.get('sort_by') || 'created_at';
        const sortOrder = searchParams.get('sort_order') || 'desc';

        // Build query
        let query = supabase
            .from('leads')
            .select(`
                *,
                partner:customers!partner_id(id, name, email, gstin, state_code),
                stage:crm_stages!stage_id(id, name, sequence, is_won, fold),
                team:sales_teams!team_id(id, name),
                lost_reason:lost_reasons!lost_reason_id(id, name),
                campaign:utm_campaigns!campaign_id(id, name),
                source:utm_sources!source_id(id, name),
                medium:utm_mediums!medium_id(id, name)
            `, { count: 'exact' })
            .eq('active', active);

        // Apply filters
        if (type) query = query.eq('type', type);
        if (stageId) query = query.eq('stage_id', stageId);
        if (teamId) query = query.eq('team_id', teamId);
        if (userId) query = query.eq('user_id', userId);
        if (partnerId) query = query.eq('partner_id', partnerId);
        if (priority) query = query.eq('priority', priority);

        // Search
        if (search) {
            query = query.or(`name.ilike.%${search}%,email_from.ilike.%${search}%,phone.ilike.%${search}%,partner_name.ilike.%${search}%`);
        }

        // RBAC: ASMs only see their own leads
        if (!canSeeAllData) {
            query = query.eq('user_id', currentUser.id);
        }

        // Sorting and pagination
        query = query.order(sortBy, { ascending: sortOrder === 'asc' })
            .range(offset, offset + limit - 1);

        const { data, count, error } = await query;

        if (error) throw error;

        return NextResponse.json({
            success: true,
            data,
            pagination: {
                page,
                limit,
                total: count,
                pages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        console.error('GET /api/crm/leads error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/crm/leads - Create new lead/opportunity
 */
export async function POST(request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createAdminClient();
        const body = await request.json();

        // Prepare lead data with validation
        const leadData = prepareLeadForSave({
            // Core fields
            name: body.name,
            type: body.type || LEAD_TYPES.LEAD,
            active: true,
            company_id: body.company_id,

            // Probability & Revenue
            probability: body.probability || 0,
            expected_revenue: body.expected_revenue || 0,
            recurring_revenue: body.recurring_revenue,
            recurring_revenue_monthly: body.recurring_revenue_monthly,

            // Priority
            priority: body.priority || '0',
            color: body.color || 0,

            // Stage
            stage_id: body.stage_id,

            // Assignment - default to current user
            user_id: body.user_id || currentUser.id,
            team_id: body.team_id,

            // Customer Link
            partner_id: body.partner_id,
            partner_name: body.partner_name,

            // Contact Info
            contact_name: body.contact_name,
            email_from: body.email_from,
            phone: body.phone,
            mobile: body.mobile,

            // Address
            street: body.street,
            street2: body.street2,
            city: body.city,
            state_id: body.state_id,
            zip: body.zip,
            country_id: body.country_id || 'IN',

            // UTM Tracking
            campaign_id: body.campaign_id,
            source_id: body.source_id,
            medium_id: body.medium_id,

            // Dates
            date_deadline: body.date_deadline,

            // Custom Properties
            lead_properties: body.lead_properties,

            // Description
            description: body.description,
            website: body.website,
            referred: body.referred,

            // Timestamps
            created_at: new Date().toISOString()
        });

        // Get default stage if not provided
        if (!leadData.stage_id) {
            const defaultStage = await getDefaultStage(supabase, leadData.type, leadData.team_id);
            if (defaultStage) {
                leadData.stage_id = defaultStage.id;
            }
        }

        // Calculate automated probability
        if (leadData.stage_id) {
            const { data: stage } = await supabase
                .from('crm_stages')
                .select('*')
                .eq('id', leadData.stage_id)
                .single();

            if (stage) {
                leadData.automated_probability = calculateAutomatedProbability(leadData, stage);
                if (leadData.is_automated_probability !== false) {
                    leadData.probability = leadData.automated_probability;
                }
            }
        }

        // Insert lead
        const { data: lead, error } = await supabase
            .from('leads')
            .insert(leadData)
            .select(`
                *,
                partner:customers!partner_id(id, name, email),
                stage:crm_stages!stage_id(id, name, sequence, is_won),
                team:sales_teams!team_id(id, name)
            `)
            .single();

        if (error) throw error;

        // Auto-assign if team has auto-assignment enabled
        if (lead.team_id && !lead.user_id) {
            try {
                await autoAssignLead(supabase, lead.team_id, lead.id);
            } catch (assignError) {
                console.warn('Auto-assign failed:', assignError);
            }
        }

        return NextResponse.json({ success: true, data: lead }, { status: 201 });

    } catch (error) {
        console.error('POST /api/crm/leads error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * PATCH /api/crm/leads - Bulk update leads (for Kanban)
 */
export async function PATCH(request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createAdminClient();
        const body = await request.json();
        const { updates } = body; // Array of { id, ...fields }

        if (!Array.isArray(updates)) {
            return NextResponse.json({ error: 'updates must be an array' }, { status: 400 });
        }

        const results = [];

        for (const update of updates) {
            const { id, ...fields } = update;

            // Get current lead
            const { data: existingLead } = await supabase
                .from('leads')
                .select('*')
                .eq('id', id)
                .single();

            if (!existingLead) continue;

            // Prepare update data
            const updateData = prepareLeadForSave(fields, existingLead);

            // Recalculate probability if stage changed
            if (fields.stage_id && fields.stage_id !== existingLead.stage_id) {
                const { data: stage } = await supabase
                    .from('crm_stages')
                    .select('*')
                    .eq('id', fields.stage_id)
                    .single();

                if (stage) {
                    updateData.automated_probability = calculateAutomatedProbability(updateData, stage);
                    if (stage.is_won) {
                        updateData.probability = 100;
                        updateData.date_closed = new Date().toISOString();
                    } else if (updateData.is_automated_probability !== false) {
                        updateData.probability = updateData.automated_probability;
                    }
                }
            }

            const { data: result, error } = await supabase
                .from('leads')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            results.push(result);
        }

        return NextResponse.json({ success: true, data: results });

    } catch (error) {
        console.error('PATCH /api/crm/leads error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
