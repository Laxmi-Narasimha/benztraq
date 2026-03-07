/**
 * CRM Lead Activities API
 * GET/POST /api/crm-leads/[id]/activities
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

        const { data, error } = await supabase
            .from('crm_lead_activities')
            .select('*')
            .eq('lead_id', id)
            .order('created_at', { ascending: false })
            .limit(200);

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: data || [] });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const supabase = createAdminClient();

        if (!body.content) {
            return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 });
        }

        const activity = {
            lead_id: id,
            activity_type: body.activity_type || 'note',
            content: body.content,
            activity_date: body.activity_date || new Date().toISOString().split('T')[0],
            created_by: currentUser.id,
            created_by_name: currentUser.fullName || currentUser.full_name,
        };

        const { data, error } = await supabase
            .from('crm_lead_activities')
            .insert(activity)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        // Also update the lead's remarks with this latest note if it's a note type
        if (body.activity_type === 'note' || !body.activity_type) {
            await supabase
                .from('crm_leads')
                .update({
                    remarks: body.content,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id);
        }

        return NextResponse.json({ success: true, data }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
