/**
 * Task Comments API
 * GET  /api/tasks/[id]/comments — List comments for a task
 * POST /api/tasks/[id]/comments — Add comment + trigger notification
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

export async function GET(request, { params }) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const supabase = createAdminClient();

        // Verify user has access to this task
        const { data: task } = await supabase
            .from('tasks')
            .select('assigned_to')
            .eq('id', id)
            .single();

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        const hasMaster = MASTER_ACCESS.includes(session.sub);
        if (!hasMaster && task.assigned_to !== session.sub) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const { data: comments, error } = await supabase
            .from('task_comments')
            .select(`
                *,
                author:profiles!task_comments_author_id_fkey(user_id, full_name, email)
            `)
            .eq('task_id', id)
            .order('created_at', { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ comments: comments || [] });
    } catch (error) {
        console.error('[Comments] GET exception:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { body } = await request.json();

        if (!body?.trim()) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Verify access
        const { data: task } = await supabase
            .from('tasks')
            .select('assigned_to, title, assignee:profiles!tasks_assigned_to_fkey(full_name)')
            .eq('id', id)
            .single();

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        const hasMaster = MASTER_ACCESS.includes(session.sub);
        if (!hasMaster && task.assigned_to !== session.sub) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Insert comment
        const { data: comment, error } = await supabase
            .from('task_comments')
            .insert({
                task_id: id,
                author_id: session.sub,
                body: body.trim(),
            })
            .select(`
                *,
                author:profiles!task_comments_author_id_fkey(user_id, full_name, email)
            `)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Trigger notification — determine who to notify
        const senderName = comment.author?.full_name || 'Someone';
        const preview = body.trim().length > 50 ? body.trim().substring(0, 50) + '...' : body.trim();

        if (hasMaster) {
            // Admin/Master sent message → notify the assignee
            await sendPushInternal(supabase, {
                user_id: task.assigned_to,
                title: `💬 ${senderName}`,
                body: `${preview}\nOn: ${task.title}`,
                url: '/tasks',
            });
        } else {
            // Employee sent message → notify all master users
            for (const masterId of MASTER_ACCESS) {
                await sendPushInternal(supabase, {
                    user_id: masterId,
                    title: `💬 ${senderName} replied`,
                    body: `${preview}\nOn: ${task.title}`,
                    url: '/tasks',
                });
            }
        }

        return NextResponse.json({ comment }, { status: 201 });
    } catch (error) {
        console.error('[Comments] POST exception:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Internal push — store in-app notification (push delivery handled by /api/notifications/send on client)
async function sendPushInternal(supabase, { user_id, title, body }) {
    try {
        await supabase.from('notifications').insert({
            user_id,
            title,
            message: body || '',
            is_read: false,
        });
    } catch (e) {
        console.error('[Comments] Notification insert failed:', e);
    }
}
