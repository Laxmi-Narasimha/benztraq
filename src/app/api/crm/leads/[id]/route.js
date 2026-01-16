/**
 * Single Lead API - GET, PUT, DELETE for individual leads
 * SECURITY: Uses custom JWT auth via getCurrentUser()
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/utils/session';
import {
    prepareLeadForSave,
    calculateAutomatedProbability,
    markLeadWon,
    markLeadLost,
    convertToOpportunity
} from '@/lib/services/crm-service';

export const dynamic = 'force-dynamic';

// Roles that can see all leads
const ADMIN_ROLES = ['developer', 'director', 'vp', 'head_of_sales'];

/**
 * GET /api/crm/leads/[id] - Get single lead with full details
 */
export async function GET(request, { params }) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createAdminClient();
        const { id } = await params;

        const { data: lead, error } = await supabase
            .from('leads')
            .select(`
                *,
                partner:customers!partner_id(
                    id, name, email, phone, mobile, gstin, 
                    l10n_in_gst_treatment, state_code, city, street
                ),
                stage:crm_stages!stage_id(id, name, sequence, is_won, fold, requirements),
                team:sales_teams!team_id(id, name, use_leads, use_opportunities),
                lost_reason:lost_reasons!lost_reason_id(id, name),
                campaign:utm_campaigns!campaign_id(id, name, title),
                source:utm_sources!source_id(id, name),
                medium:utm_mediums!medium_id(id, name)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        // RBAC: ASMs can only view their own leads
        const canSeeAllData = ADMIN_ROLES.includes(currentUser.role);
        if (!canSeeAllData && lead.user_id !== currentUser.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get related documents (quotations/orders)
        const { data: documents } = await supabase
            .from('documents')
            .select('id, name, doc_type, state, amount_total, created_at')
            .eq('opportunity_id', id)
            .order('created_at', { ascending: false });

        return NextResponse.json({
            success: true,
            data: {
                ...lead,
                documents: documents || []
            }
        });

    } catch (error) {
        console.error('GET /api/crm/leads/[id] error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * PUT /api/crm/leads/[id] - Update lead
 */
export async function PUT(request, { params }) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createAdminClient();
        const { id } = await params;
        const body = await request.json();

        // Get existing lead
        const { data: existingLead, error: fetchError } = await supabase
            .from('leads')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !existingLead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        // RBAC: ASMs can only update their own leads
        const canSeeAllData = ADMIN_ROLES.includes(currentUser.role);
        if (!canSeeAllData && existingLead.user_id !== currentUser.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Handle special actions
        if (body.action) {
            let updateData;

            switch (body.action) {
                case 'mark_won':
                    updateData = markLeadWon(existingLead);
                    updateData.stage_id = body.stage_id; // Won stage
                    break;

                case 'mark_lost':
                    updateData = markLeadLost(existingLead, body.lost_reason_id);
                    break;

                case 'convert_to_opportunity':
                    updateData = convertToOpportunity(existingLead, body.partner_id);
                    break;

                case 'restore':
                    updateData = {
                        active: true,
                        probability: existingLead.automated_probability || 10,
                        lost_reason_id: null,
                        date_closed: null
                    };
                    break;

                default:
                    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
            }

            const { data: result, error: actionError } = await supabase
                .from('leads')
                .update({
                    ...updateData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (actionError) throw actionError;
            return NextResponse.json({ success: true, data: result });
        }

        // Regular update
        const updateData = prepareLeadForSave(body, existingLead);

        // Recalculate probability if stage changed
        if (body.stage_id && body.stage_id !== existingLead.stage_id) {
            const { data: stage } = await supabase
                .from('crm_stages')
                .select('*')
                .eq('id', body.stage_id)
                .single();

            if (stage) {
                updateData.automated_probability = calculateAutomatedProbability(updateData, stage);
                updateData.date_last_stage_update = new Date().toISOString();

                if (stage.is_won) {
                    updateData.probability = 100;
                    updateData.date_closed = new Date().toISOString();
                } else if (updateData.is_automated_probability !== false) {
                    updateData.probability = updateData.automated_probability;
                }
            }
        }

        const { data: lead, error } = await supabase
            .from('leads')
            .update(updateData)
            .eq('id', id)
            .select(`
                *,
                partner:customers!partner_id(id, name, email),
                stage:crm_stages!stage_id(id, name, sequence, is_won),
                team:sales_teams!team_id(id, name)
            `)
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data: lead });

    } catch (error) {
        console.error('PUT /api/crm/leads/[id] error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/crm/leads/[id] - Delete lead (or archive)
 */
export async function DELETE(request, { params }) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createAdminClient();
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const permanent = searchParams.get('permanent') === 'true';

        // Get lead to check ownership
        const { data: lead } = await supabase
            .from('leads')
            .select('user_id')
            .eq('id', id)
            .single();

        // RBAC: ASMs can only delete their own leads
        const canSeeAllData = ADMIN_ROLES.includes(currentUser.role);
        if (!canSeeAllData && lead?.user_id !== currentUser.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (permanent) {
            // Hard delete - only admins
            if (!canSeeAllData) {
                return NextResponse.json({ error: 'Only admins can permanently delete' }, { status: 403 });
            }
            const { error } = await supabase
                .from('leads')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } else {
            // Soft delete (archive)
            const { error } = await supabase
                .from('leads')
                .update({
                    active: false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
        }

        return NextResponse.json({ success: true, message: 'Lead deleted' });

    } catch (error) {
        console.error('DELETE /api/crm/leads/[id] error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
