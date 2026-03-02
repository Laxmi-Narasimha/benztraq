/**
 * Server-Side Push Notification Sender
 * 
 * Stores in-app notification + sends OS-level web-push instant notification.
 * Import this from any API route. Do NOT use on client-side.
 * 
 * Modeled after BenzDesk's send-push Edge Function.
 */

const VAPID_PUBLIC_KEY = 'BG7mB4EVdYq3PKoG0aXB4ukDNCeVzmE6kqjMLEQQWE0vTYSyxjTmqjLAmDXqT8qJcCT3ZTgobWPBWMB3WVzwE3o';
const VAPID_PRIVATE_KEY = (process.env.VAPID_PRIVATE_KEY || 'NXNH5RX2kBEHSHzzPUMZSURuEjF0neuJj0KO-D7zhSi0').trim();

let _webpush = null;
function getWebPush() {
    if (!_webpush) {
        const webpush = require('web-push');
        webpush.setVapidDetails('mailto:support@benz-packaging.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
        _webpush = webpush;
    }
    return _webpush;
}

/**
 * Send a push notification to a single user.
 * 1. Stores in-app notification in the `notifications` table
 * 2. Sends OS-level web-push to all user's subscribed browsers
 * 
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase 
 * @param {Object} payload
 * @param {string} payload.user_id - Target user UUID
 * @param {string} payload.title - Notification title
 * @param {string} payload.body - Notification body text
 * @param {string} [payload.url] - URL to open on click (default: /tasks)
 * @param {string} [payload.tag] - Tag for dedup (same tag replaces previous)
 */
export async function sendPushNotification(supabase, { user_id, title, body, url, tag }) {
    try {
        // 1. Store in-app notification
        await supabase.from('notifications').insert({
            user_id,
            title,
            message: body || '',
            is_read: false,
        });

        // 2. Fetch push subscriptions for this user
        const { data: subscriptions } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', user_id);

        if (!subscriptions || subscriptions.length === 0) {
            return { inApp: true, pushed: 0 };
        }

        // 3. Send web-push to all subscribed browsers
        const webpush = getWebPush();
        const payload = JSON.stringify({
            title,
            body: body || '',
            url: url || '/tasks',
            tag: tag || `benztraq-${Date.now()}`,
            icon: '/favicon.ico',
        });

        let sent = 0;
        for (const sub of subscriptions) {
            try {
                await webpush.sendNotification({
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth },
                }, payload);
                sent++;
            } catch (err) {
                // Remove stale subscriptions (410 Gone, 404 Not Found)
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await supabase.from('push_subscriptions').delete().eq('id', sub.id);
                }
                console.error(`[Push] Failed for ${sub.endpoint.substring(0, 40)}...:`, err.statusCode);
            }
        }

        return { inApp: true, pushed: sent };
    } catch (error) {
        console.error('[sendPushNotification] Error:', error);
        return { inApp: false, pushed: 0, error: error.message };
    }
}

/**
 * Notify multiple users (e.g., all directors/masters).
 * Sends 1 push per user — no duplicates.
 */
export async function sendPushToMany(supabase, userIds, { title, body, url, tag }) {
    const results = [];
    for (const uid of userIds) {
        const result = await sendPushNotification(supabase, { user_id: uid, title, body, url, tag });
        results.push({ user_id: uid, ...result });
    }
    return results;
}
