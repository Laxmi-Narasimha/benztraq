/**
 * Tasks API Route
 * GET  /api/tasks — List tasks (admins: all, employees: own)
 * POST /api/tasks — Create task (admins only)
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/utils/session';

const ADMIN_ROLES = ['director', 'developer', 'head_of_sales', 'vp'];

export async function GET(request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createAdminClient();
        const isAdmin = ADMIN_ROLES.includes(session.role);

        // Get filter params
        const { searchParams } = new URL(request.url);
        const employeeFilter = searchParams.get('employee');
        const statusFilter = searchParams.get('status');
        const priorityFilter = searchParams.get('priority');

        let query = supabase
            .from('tasks')
            .select(`
                *,
                assignee:profiles!tasks_assigned_to_fkey(user_id, full_name, email),
                assigner:profiles!tasks_assigned_by_fkey(user_id, full_name, email)
            `)
            .order('created_at', { ascending: false });

        // Employees can only see their own tasks
        if (!isAdmin) {
            query = query.eq('assigned_to', session.sub);
        } else if (employeeFilter && employeeFilter !== 'all') {
            query = query.eq('assigned_to', employeeFilter);
        }

        if (statusFilter) {
            query = query.eq('status', statusFilter);
        }
        if (priorityFilter) {
            query = query.eq('priority', priorityFilter);
        }

        const { data: tasks, error } = await query;

        if (error) {
            console.error('[Tasks] GET error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Also return employee list for admin tab filters
        let employees = [];
        if (isAdmin) {
            const { data: empList } = await supabase
                .from('profiles')
                .select('user_id, full_name, email')
                .order('full_name');
            employees = empList || [];
        }

        return NextResponse.json({
            tasks: tasks || [],
            employees,
            isAdmin
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

        const isAdmin = ADMIN_ROLES.includes(session.role);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Only admins can create tasks' }, { status: 403 });
        }

        const body = await request.json();
        const { title, description, assigned_to, priority, deadline, status, tags } = body;

        if (!title || !assigned_to) {
            return NextResponse.json({ error: 'Title and assigned employee are required' }, { status: 400 });
        }

        const supabase = createAdminClient();

        const { data: task, error } = await supabase
            .from('tasks')
            .insert({
                title,
                description: description || null,
                assigned_to,
                assigned_by: session.sub,
                priority: priority || 'Normal',
                deadline: deadline || null,
                status: status || 'New',
                tags: tags || null,
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

        return NextResponse.json({ task }, { status: 201 });
    } catch (error) {
        console.error('[Tasks] POST exception:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
