/**
 * Send Push Notification API
 * POST /api/notifications/send — Send push + store in-app notification
 * 
 * Uses web-push library with VAPID keys
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/utils/session';

const VAPID_PUBLIC_KEY = 'BG7mB4EVdYq3PKoG0aXB4ukDNCeVzmE6kqjMLEQQWE0vTYSyxjTmqjLAmDXqT8qJcCT3ZTgobWPBWMB3WVzwE3o';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'NXNH5RX2kBEHSHzzPUMZSURuEjF0neuJj0KO-D7zhSi0';

let _webpush = null;
function getWebPush() {
    if (!_webpush) {
        const webpush = require('web-push');
        webpush.setVapidDetails('mailto:support@benz-packaging.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
        _webpush = webpush;
    }
    return _webpush;
}

export async function POST(request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { user_id, title, body, url, tag } = await request.json();
        if (!user_id || !title) {
            return NextResponse.json({ error: 'Missing user_id or title' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // 1. Store in-app notification
        await supabase.from('notifications').insert({
            user_id,
            title,
            message: body || '',
            is_read: false,
        });

        // Cleanup old notifications — keep latest 20 per user
        const { data: old } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', user_id)
            .order('created_at', { ascending: false })
            .range(20, 1000);

        if (old?.length > 0) {
            await supabase.from('notifications').delete().in('id', old.map(n => n.id));
        }

        // 2. Send push notification
        const { data: subscriptions } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', user_id);

        if (!subscriptions || subscriptions.length === 0) {
            return NextResponse.json({ success: true, sent: 0, inApp: true });
        }

        const payload = JSON.stringify({
            title,
            body: body || '',
            url: url || '/tasks',
            tag: tag || 'benztraq',
            icon: '/favicon.ico',
        });

        let sent = 0, failed = 0;
        for (const sub of subscriptions) {
            try {
                await getWebPush().sendNotification({
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth },
                }, payload);
                sent++;
            } catch (error) {
                failed++;
                // Cleanup stale subscriptions
                if (error.statusCode === 404 || error.statusCode === 410) {
                    await supabase.from('push_subscriptions').delete().eq('id', sub.id);
                }
            }
        }

        return NextResponse.json({ success: true, sent, failed, inApp: true });
    } catch (error) {
        console.error('[SendPush] Exception:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
