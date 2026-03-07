/**
 * CRM Leads API
 * 
 * GET  /api/crm-leads — List leads with filtering
 * POST /api/crm-leads — Create a new lead
 * PATCH /api/crm-leads — Bulk inline updates (with audit logging)
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/utils/session';

export const dynamic = 'force-dynamic';

// Valid statuses matching the Google Sheet workflow
const VALID_STATUSES = [
    'In Discussion', 'Quote Sent', 'Sample Sent', 'VRF',
    'Order Received', 'Hold', 'Closed', 'Following Up'
];

// ============================================================================
// GET — List leads with filters
// ============================================================================
export async function GET(request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const source_tab = searchParams.get('tab');
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '200');

        const supabase = createAdminClient();

        let query = supabase
            .from('crm_leads')
            .select('*', { count: 'exact' })
            .order('sr_no', { ascending: true });

        // Filter by tab (source_tab)
        if (source_tab) {
            query = query.eq('source_tab', source_tab);
        }

        // Filter by status
        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        // Search across company, product, contact, location
        if (search) {
            query = query.or(
                `company.ilike.%${search}%,product.ilike.%${search}%,contact_name.ilike.%${search}%,location.ilike.%${search}%,email.ilike.%${search}%`
            );
        }

        // Pagination
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error('[CRM Leads GET] Error:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        // Get available tabs
        const { data: tabData } = await supabase
            .from('crm_leads')
            .select('source_tab')
            .order('source_tab');

        const tabs = [...new Set((tabData || []).map(t => t.source_tab).filter(Boolean))];

        // Get status counts
        const { data: statusData } = await supabase
            .from('crm_leads')
            .select('status');

        const statusCounts = {};
        (statusData || []).forEach(s => {
            statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
        });

        return NextResponse.json({
            success: true,
            data: data || [],
            tabs,
            statusCounts,
            total: count || 0,
            page,
            limit,
        });

    } catch (error) {
        console.error('[CRM Leads GET] Fatal:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// ============================================================================
// POST — Create a new lead
// ============================================================================
export async function POST(request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const supabase = createAdminClient();

        if (!body.company) {
            return NextResponse.json({ success: false, error: 'Company name is required' }, { status: 400 });
        }

        const lead = {
            company: body.company,
            contact_name: body.contact_name || null,
            product: body.product || null,
            phone: body.phone || null,
            email: body.email || null,
            location: body.location || null,
            country: body.country || 'Domestic',
            status: VALID_STATUSES.includes(body.status) ? body.status : 'In Discussion',
            remarks: body.remarks || null,
            source_tab: body.source_tab || 'General',
            assigned_to: body.assigned_to || currentUser.id,
            assigned_to_name: body.assigned_to_name || currentUser.fullName || currentUser.full_name,
            created_by: currentUser.id,
        };

        const { data, error } = await supabase
            .from('crm_leads')
            .insert(lead)
            .select()
            .single();

        if (error) {
            console.error('[CRM Leads POST] Error:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        // Log the creation activity
        await supabase.from('crm_lead_activities').insert({
            lead_id: data.id,
            activity_type: 'note',
            content: `Lead created: ${lead.company}`,
            created_by: currentUser.id,
            created_by_name: currentUser.fullName || currentUser.full_name,
        });

        return NextResponse.json({ success: true, data }, { status: 201 });

    } catch (error) {
        console.error('[CRM Leads POST] Fatal:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// ============================================================================
// PATCH — Bulk inline update with audit logging
// ============================================================================
export async function PATCH(request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { updates } = await request.json();
        // updates = [{ id, field, value, oldValue }]

        if (!Array.isArray(updates) || updates.length === 0) {
            return NextResponse.json({ success: false, error: 'No updates provided' }, { status: 400 });
        }

        const supabase = createAdminClient();
        const results = [];
        const activityLogs = [];

        for (const update of updates) {
            const { id, field, value, oldValue } = update;

            if (!id || !field) continue;

            // Update the lead
            const { data, error } = await supabase
                .from('crm_leads')
                .update({ [field]: value, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error(`[CRM Leads PATCH] Error updating ${id}:`, error.message);
                results.push({ id, error: error.message });
            } else {
                results.push({ id, success: true, data });

                // Create audit log entry
                activityLogs.push({
                    lead_id: id,
                    activity_type: 'edit',
                    content: `${field} changed from "${oldValue || '(empty)'}" to "${value || '(empty)'}"`,
                    field_name: field,
                    old_value: oldValue || null,
                    new_value: value || null,
                    created_by: currentUser.id,
                    created_by_name: currentUser.fullName || currentUser.full_name,
                });
            }
        }

        // Batch insert activity logs
        if (activityLogs.length > 0) {
            await supabase.from('crm_lead_activities').insert(activityLogs);
        }

        return NextResponse.json({
            success: true,
            results,
            auditLogged: activityLogs.length,
        });

    } catch (error) {
        console.error('[CRM Leads PATCH] Fatal:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
