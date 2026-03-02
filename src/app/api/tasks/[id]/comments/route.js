/**
 * Task Comments API
 * GET  /api/tasks/[id]/comments — List comments for a task
 * POST /api/tasks/[id]/comments — Add comment + instant OS-level push notification
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/utils/session';
import { sendPushNotification, sendPushToMany } from '@/lib/serverPush';

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

        // Instant push notification (in-app + OS-level web-push)
        try {
            const senderName = comment.author?.full_name || 'Someone';
            const preview = body.trim().length > 50 ? body.trim().substring(0, 50) + '...' : body.trim();

            if (hasMaster) {
                // Admin/Director sent message → push to the employee only
                await sendPushNotification(supabase, {
                    user_id: task.assigned_to,
                    title: `💬 ${senderName}`,
                    body: `${preview}\nOn: ${task.title}`,
                    url: '/tasks',
                    tag: `chat-${id}`,
                });
            } else {
                // Employee sent message → push to all masters
                const recipients = MASTER_ACCESS.filter(mid => mid !== session.sub);
                await sendPushToMany(supabase, recipients, {
                    title: `💬 ${senderName} replied`,
                    body: `${preview}\nOn: ${task.title}`,
                    url: '/tasks',
                    tag: `chat-${id}`,
                });
            }
        } catch (notifyErr) {
            console.error('[Comments] Notification error (non-fatal):', notifyErr);
        }

        return NextResponse.json({ comment }, { status: 201 });
    } catch (error) {
        console.error('[Comments] POST exception:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
