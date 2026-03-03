/**
 * Tasks API Route
 * GET  /api/tasks — List tasks
 * POST /api/tasks — Create task
 * 
 * Master view: Directors (Manan, Chaitanya, Prashansa), Developer (Laxmi), Isha
 * Own tasks only: all CRMs
 * 
 * Tabs: 10 CRMs + Other
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/utils/session';

// Master view access
const MASTER_ACCESS = [
    '08f0a4c7-2dda-4236-a657-383e6a785573', // Manan (Director)
    '84ac5185-e461-4e77-8ea1-a1573bd2b394', // Chaitanya (Director)
    'cbba91c1-7bd3-43d3-855c-cd350944608c', // Prashansa (Director)
    '092d9927-e3ed-4a69-9b23-a521d9a80af9', // Laxmi (Developer)
    '480090cb-3fad-45ce-beae-b89576f4c722', // Isha (CRM with master access)
];

// Only these 10 people get their OWN tabs — everyone else goes to "Other"
const TASK_TABS = [
    { user_id: 'e2cd37b3-f92b-4378-95d3-8c46d469315b', name: 'Dinesh' },
    { user_id: 'c6f5ea1a-110c-4165-9433-ef6b4c8c71fa', name: 'Pradeep' },
    { user_id: 'c5c41c1e-c16d-4936-b51b-41ef9f6c9679', name: 'Shikha' },
    { user_id: '1c5b8a5c-2af5-4c96-801b-b5fc562d3ac2', name: 'Preeti' },
    { user_id: '480090cb-3fad-45ce-beae-b89576f4c722', name: 'Isha' },
    { user_id: '78387321-8aad-4ec4-9eae-0f7e99eda5dc', name: 'Sandeep' },
    { user_id: '2970b695-b623-48c1-b036-ba14919cb443', name: 'Satender' },
    { user_id: '872fca38-39e1-468e-9901-daa0823cd36a', name: 'Bhandari' },
    { user_id: '2ee61597-d5e1-4d1e-aad8-2b157adb599c', name: 'Tarun' },
    { user_id: '51deaf59-c580-418d-a78c-7acfa973a53d', name: 'Jayshree' },
    { user_id: 'OTHER', name: 'Other' },
];

// IDs that have their own tabs (for "Other" tab filtering)
const TAB_IDS = TASK_TABS.filter(t => t.user_id !== 'OTHER').map(t => t.user_id);

// All assignable people (for the assign dropdown)
// Only employees who currently have tasks — directors commented out
const ASSIGNABLE = [
    { user_id: 'e2cd37b3-f92b-4378-95d3-8c46d469315b', name: 'Dinesh' },
    { user_id: 'c6f5ea1a-110c-4165-9433-ef6b4c8c71fa', name: 'Pradeep' },
    { user_id: 'c5c41c1e-c16d-4936-b51b-41ef9f6c9679', name: 'Shikha' },
    { user_id: '1c5b8a5c-2af5-4c96-801b-b5fc562d3ac2', name: 'Preeti' },
    { user_id: '480090cb-3fad-45ce-beae-b89576f4c722', name: 'Isha' },
    { user_id: '78387321-8aad-4ec4-9eae-0f7e99eda5dc', name: 'Sandeep' },
    { user_id: '2970b695-b623-48c1-b036-ba14919cb443', name: 'Satender' },
    { user_id: '872fca38-39e1-468e-9901-daa0823cd36a', name: 'Bhandari' },
    { user_id: '2ee61597-d5e1-4d1e-aad8-2b157adb599c', name: 'Tarun' },
    { user_id: '51deaf59-c580-418d-a78c-7acfa973a53d', name: 'Jayshree' },
    { user_id: '0edd417c-95f9-4ffa-b76f-4a51673015f0', name: 'Udit' },
    // { user_id: '08f0a4c7-2dda-4236-a657-383e6a785573', name: 'Manan' },
    // { user_id: '84ac5185-e461-4e77-8ea1-a1573bd2b394', name: 'Chaitanya' },
    // { user_id: 'cbba91c1-7bd3-43d3-855c-cd350944608c', name: 'Prashansa' },
    // { user_id: '092d9927-e3ed-4a69-9b23-a521d9a80af9', name: 'Laxmi' },
];

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createAdminClient();
        const hasMasterAccess = MASTER_ACCESS.includes(session.sub);

        let query = supabase
            .from('tasks')
            .select(`
                *,
                assignee:profiles!tasks_assigned_to_fkey(user_id, full_name, email),
                assigner:profiles!tasks_assigned_by_fkey(user_id, full_name, email)
            `)
            .order('created_at', { ascending: false });

        if (!hasMasterAccess) {
            query = query.eq('assigned_to', session.sub);
        }

        const { data: tasks, error } = await query;

        if (error) {
            console.error('[Tasks] GET error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            tasks: tasks || [],
            tabs: hasMasterAccess ? TASK_TABS : [],
            tabIds: hasMasterAccess ? TAB_IDS : [],
            assignable: hasMasterAccess ? ASSIGNABLE : [],
            isAdmin: hasMasterAccess,
        });
    } catch (error) {
        console.error('[Tasks] GET exception:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!MASTER_ACCESS.includes(session.sub)) {
            return NextResponse.json({ error: 'You do not have permission to create tasks' }, { status: 403 });
        }

        const body = await request.json();
        const { title, assigned_to, deadline } = body;

        if (!title || !assigned_to) {
            return NextResponse.json({ error: 'Task and assigned employee are required' }, { status: 400 });
        }

        const supabase = createAdminClient();

        const { data: task, error } = await supabase
            .from('tasks')
            .insert({
                title,
                assigned_to,
                assigned_by: session.sub,
                deadline: deadline || null,
                priority: 'Normal',
                status: 'New',
            })
            .select(`
                *,
                assignee:profiles!tasks_assigned_to_fkey(user_id, full_name, email),
                assigner:profiles!tasks_assigned_by_fkey(user_id, full_name, email)
            `)
            .single();

        if (error) {
            console.error('[Tasks] POST error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Server-side push notification — notify the assignee (in-app + OS push)
        try {
            const { sendPushNotification } = require('@/lib/serverPush');
            await sendPushNotification(supabase, {
                user_id: assigned_to,
                title: '📋 New Task Assigned',
                body: title,
                url: '/tasks',
                tag: `task-new-${task.id}`,
            });
        } catch (notifyErr) {
            console.error('[Tasks] Notification error (non-fatal):', notifyErr);
        }

        return NextResponse.json({ task }, { status: 201 });
    } catch (error) {
        console.error('[Tasks] POST exception:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
