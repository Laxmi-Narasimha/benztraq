/**
 * CRM Lead Single Item API
 * GET/PUT/DELETE /api/crm-leads/[id]
 */
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/utils/session';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const supabase = createAdminClient();

        const { data: lead, error } = await supabase
            .from('crm_leads')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !lead) {
            return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
        }

        // Fetch activities
        const { data: activities } = await supabase
            .from('crm_lead_activities')
            .select('*')
            .eq('lead_id', id)
            .order('created_at', { ascending: false })
            .limit(100);

        return NextResponse.json({
            success: true,
            data: { ...lead, activities: activities || [] },
        });

    } catch (error) {
        console.error('[CRM Lead GET] Fatal:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const supabase = createAdminClient();

        // Get old lead for diff
        const { data: oldLead } = await supabase
            .from('crm_leads')
            .select('*')
            .eq('id', id)
            .single();

        if (!oldLead) {
            return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
        }

        const updateFields = {};
        const editableFields = ['company', 'contact_name', 'product', 'phone', 'email', 'location', 'country', 'status', 'remarks', 'source_tab', 'assigned_to', 'assigned_to_name'];
        const changes = [];

        editableFields.forEach(field => {
            if (body[field] !== undefined && body[field] !== oldLead[field]) {
                updateFields[field] = body[field];
                changes.push({
                    lead_id: id,
                    activity_type: field === 'status' ? 'status_change' : 'edit',
                    content: `${field} changed from "${oldLead[field] || '(empty)'}" to "${body[field] || '(empty)'}"`,
                    field_name: field,
                    old_value: oldLead[field] || null,
                    new_value: body[field] || null,
                    created_by: currentUser.id,
                    created_by_name: currentUser.fullName || currentUser.full_name,
                });
            }
        });

        if (Object.keys(updateFields).length === 0) {
            return NextResponse.json({ success: true, data: oldLead, message: 'No changes' });
        }

        updateFields.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('crm_leads')
            .update(updateFields)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        // Log all changes
        if (changes.length > 0) {
            await supabase.from('crm_lead_activities').insert(changes);
        }

        return NextResponse.json({ success: true, data });

    } catch (error) {
        console.error('[CRM Lead PUT] Fatal:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const supabase = createAdminClient();

        const { error } = await supabase
            .from('crm_leads')
            .delete()
            .eq('id', id);

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Lead deleted' });

    } catch (error) {
        console.error('[CRM Lead DELETE] Fatal:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
