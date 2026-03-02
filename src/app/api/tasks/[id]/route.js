/**
 * Single Task API Route
 * PUT    /api/tasks/[id] — Update task
 * DELETE /api/tasks/[id] — Delete task (admins only)
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/utils/session';

const ADMIN_ROLES = ['director', 'developer', 'head_of_sales', 'vp'];

export async function PUT(request, { params }) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const isAdmin = ADMIN_ROLES.includes(session.role);
        const supabase = createAdminClient();

        // Get existing task to check ownership
        const { data: existing } = await supabase
            .from('tasks')
            .select('assigned_to')
            .eq('id', id)
            .single();

        if (!existing) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        let updateData = {};

        if (isAdmin) {
            // Admins can update all fields
            const { title, description, assigned_to, priority, deadline, status, tags, employee_update } = body;
            if (title !== undefined) updateData.title = title;
            if (description !== undefined) updateData.description = description;
            if (assigned_to !== undefined) updateData.assigned_to = assigned_to;
            if (priority !== undefined) updateData.priority = priority;
            if (deadline !== undefined) updateData.deadline = deadline;
            if (status !== undefined) updateData.status = status;
            if (tags !== undefined) updateData.tags = tags;
            if (employee_update !== undefined) {
                updateData.employee_update = employee_update;
                updateData.employee_updated_at = new Date().toISOString();
            }
        } else {
            // Employees can only update: employee_update, status
            if (existing.assigned_to !== session.sub) {
                return NextResponse.json({ error: 'Access denied' }, { status: 403 });
            }
            const { employee_update, status } = body;
            if (employee_update !== undefined) {
                updateData.employee_update = employee_update;
                updateData.employee_updated_at = new Date().toISOString();
            }
            if (status !== undefined) {
                updateData.status = status;
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

        const isAdmin = ADMIN_ROLES.includes(session.role);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Only admins can delete tasks' }, { status: 403 });
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
