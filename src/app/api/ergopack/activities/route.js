/**
 * Ergopack Activities API
 * Activity log for contacts
 * 
 * GET /api/ergopack/activities?contactId=xxx - Get activities for a contact
 * POST /api/ergopack/activities - Create new activity
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/utils/session';

/**
 * GET - Get activities for a contact
 */
export async function GET(request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const contactId = searchParams.get('contactId');

        if (!contactId) {
            return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 });
        }

        const supabase = createAdminClient();

        const { data: activities, error } = await supabase
            .from('ergopack_activities')
            .select(`
        *,
        created_by_user:profiles!ergopack_activities_created_by_fkey(full_name)
      `)
            .eq('contact_id', contactId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching activities:', error);
            return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
        }

        return NextResponse.json({ activities });

    } catch (error) {
        console.error('Activities API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST - Create a new activity
 */
export async function POST(request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const { contactId, activityType, title, description, scheduledDate } = body;

        if (!contactId || !activityType) {
            return NextResponse.json({ error: 'Contact ID and activity type are required' }, { status: 400 });
        }

        const supabase = createAdminClient();

        const { data: activity, error } = await supabase
            .from('ergopack_activities')
            .insert({
                contact_id: contactId,
                activity_type: activityType,
                title: title || null,
                description: description || null,
                scheduled_date: scheduledDate || null,
                created_by: user.id,
            })
            .select(`
        *,
        created_by_user:profiles!ergopack_activities_created_by_fkey(full_name)
      `)
            .single();

        if (error) {
            console.error('Error creating activity:', error);
            return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
        }

        // Update contact's updated_by and updated_at
        await supabase
            .from('ergopack_contacts')
            .update({
                updated_by: user.id,
                updated_at: new Date().toISOString()
            })
            .eq('id', contactId);

        return NextResponse.json({ activity, success: true });

    } catch (error) {
        console.error('Create activity error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
