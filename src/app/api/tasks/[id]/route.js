/**
 * Single Task API Route
 * PUT    /api/tasks/[id] — Update task
 * DELETE /api/tasks/[id] — Delete task
 * 
 * Master users can update all fields + delete.
 * CRMs/employees can only update employee_update on their own tasks.
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/utils/session';

const MASTER_ACCESS = [
    '08f0a4c7-2dda-4236-a657-383e6a785573', // Manan
    '84ac5185-e461-4e77-8ea1-a1573bd2b394', // Chaitanya
    'cbba91c1-7bd3-43d3-855c-cd350944608c', // Prashansa
    '092d9927-e3ed-4a69-9b23-a521d9a80af9', // Laxmi
    '480090cb-3fad-45ce-beae-b89576f4c722', // Isha
];

// Server-side notification helper — stores in-app notification (no push from API)
async function notifyMasters(supabase, title, message, excludeUserId) {
    const recipients = MASTER_ACCESS.filter(id => id !== excludeUserId);
    for (const uid of recipients) {
        await supabase.from('notifications').insert({
            user_id: uid, title, message, is_read: false,
        });
    }
}
async function notifyUser(supabase, userId, title, message) {
    await supabase.from('notifications').insert({
        user_id: userId, title, message, is_read: false,
    });
}

export async function PUT(request, { params }) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const hasMaster = MASTER_ACCESS.includes(session.sub);
        const supabase = createAdminClient();

        // Check task exists + ownership
        const { data: existing } = await supabase
            .from('tasks')
            .select('assigned_to')
            .eq('id', id)
            .single();

        if (!existing) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        let updateData = {};

        if (hasMaster) {
            // Master users can update all fields
            const { title, assigned_to, deadline, employee_update } = body;
            if (title !== undefined) updateData.title = title;
            if (assigned_to !== undefined) updateData.assigned_to = assigned_to;
            if (deadline !== undefined) updateData.deadline = deadline;
            if (employee_update !== undefined) {
                updateData.employee_update = employee_update;
                updateData.employee_updated_at = new Date().toISOString();
            }
        } else {
            // Employees can only update their own employee_update
            if (existing.assigned_to !== session.sub) {
                return NextResponse.json({ error: 'Access denied' }, { status: 403 });
            }
            const { employee_update } = body;
            if (employee_update !== undefined) {
                updateData.employee_update = employee_update;
                updateData.employee_updated_at = new Date().toISOString();
            }
        }

        const { data: task, error } = await supabase
            .from('tasks')
            .update(updateData)
            .eq('id', id)
            .select(`
                *,
                assignee:profiles!tasks_assigned_to_fkey(user_id, full_name, email),
                assigner:profiles!tasks_assigned_by_fkey(user_id, full_name, email)
            `)
            .single();

        if (error) {
            console.error('[Tasks] PUT error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Server-side notifications (exactly 1 per recipient, no duplicates)
        try {
            const assigneeName = task.assignee?.full_name || 'Someone';
            const taskTitle = task.title || 'Task';

            if (updateData.employee_update && !hasMaster) {
                // Employee submitted an update → notify all master users (except self)
                await notifyMasters(supabase, `📝 ${assigneeName} updated a task`, taskTitle, session.sub);
            }
            if (updateData.assigned_to && updateData.assigned_to !== existing.assigned_to) {
                // Task reassigned → notify new assignee
                await notifyUser(supabase, updateData.assigned_to, '📋 New Task Assigned', taskTitle);
            }
        } catch (notifyErr) {
            console.error('[Tasks] Notification error (non-fatal):', notifyErr);
        }

        return NextResponse.json({ task });
    } catch (error) {
        console.error('[Tasks] PUT exception:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!MASTER_ACCESS.includes(session.sub)) {
            return NextResponse.json({ error: 'You do not have permission to delete tasks' }, { status: 403 });
        }

        const { id } = await params;
        const supabase = createAdminClient();

        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('[Tasks] DELETE error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Tasks] DELETE exception:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
