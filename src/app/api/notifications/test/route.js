/**
 * Push Notification Test/Debug API
 * GET  /api/notifications/test — Check subscriptions, send test push, return diagnostics
 * POST /api/notifications/test — Send test push with verbose error output
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/utils/session';

const VAPID_PUBLIC_KEY = 'BHl3YORFfOmNjRvHCWGFEdG1ov3i2T_DP0-lBedQZ8-ezxUx2MXvZTpdWjxvAXsb50fOj8qj5Q0OsyuAu1F3SY8';
const VAPID_PRIVATE_KEY = (process.env.VAPID_PRIVATE_KEY || 'x0owlkJsbdQaaAJpdvbSnB5BZXckv717ipCUCQrEMHg').trim();

let _webpush = null;
function getWebPush() {
    if (!_webpush) {
        const webpush = require('web-push');
        webpush.setVapidDetails('mailto:support@benz-packaging.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
        _webpush = webpush;
    }
    return _webpush;
}

// GET — diagnostics: show subscriptions + notification count
export async function GET(request) {
    const diagnostics = { steps: [], errors: [] };
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        diagnostics.steps.push(`✅ Session OK — user_id: ${session.sub}, email: ${session.email}`);

        const supabase = createAdminClient();

        // 1. Check push subscriptions
        const { data: subs, error: subError } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', session.sub);

        if (subError) {
            diagnostics.errors.push(`❌ Subscription query failed: ${subError.message}`);
        } else {
            diagnostics.steps.push(`📱 Push subscriptions for you: ${subs?.length || 0}`);
            (subs || []).forEach((s, i) => {
                diagnostics.steps.push(`  Sub ${i + 1}: endpoint=${s.endpoint?.substring(0, 60)}...`);
                diagnostics.steps.push(`    p256dh: ${s.p256dh ? 'YES (' + s.p256dh.length + ' chars)' : 'MISSING'}`);
                diagnostics.steps.push(`    auth: ${s.auth ? 'YES (' + s.auth.length + ' chars)' : 'MISSING'}`);
            });
        }
        diagnostics.subscriptionCount = subs?.length || 0;

        // 2. Check all subscriptions across all users
        const { data: allSubs } = await supabase.from('push_subscriptions').select('user_id, endpoint');
        diagnostics.steps.push(`📊 Total push subscriptions (all users): ${allSubs?.length || 0}`);
        const byUser = {};
        (allSubs || []).forEach(s => { byUser[s.user_id] = (byUser[s.user_id] || 0) + 1; });
        Object.entries(byUser).forEach(([uid, cnt]) => {
            diagnostics.steps.push(`  ${uid.substring(0, 8)}... : ${cnt} subscription(s)`);
        });

        // 3. Check notifications count for this user
        const { data: notifs, count: notifCount } = await supabase
            .from('notifications')
            .select('*', { count: 'exact' })
            .eq('user_id', session.sub)
            .eq('is_read', false)
            .order('created_at', { ascending: false })
            .limit(10);

        diagnostics.steps.push(`🔔 Unread notifications for you: ${notifCount}`);
        (notifs || []).forEach((n, i) => {
            diagnostics.steps.push(`  #${i + 1}: "${n.title}" — "${n.message}" — ${n.created_at}`);
        });
        diagnostics.unreadCount = notifCount;

        // 4. VAPID key info
        diagnostics.steps.push(`🔑 VAPID private key: ${VAPID_PRIVATE_KEY ? 'SET (' + VAPID_PRIVATE_KEY.length + ' chars)' : 'MISSING'}`);
        diagnostics.steps.push(`🔑 VAPID public key: ${VAPID_PUBLIC_KEY.substring(0, 20)}...`);

        // 5. Service worker check
        diagnostics.steps.push(`📋 Service worker URL: /sw.js`);

        return NextResponse.json({ diagnostics });
    } catch (error) {
        diagnostics.errors.push(`❌ Exception: ${error.message}`);
        return NextResponse.json({ diagnostics, error: error.message }, { status: 500 });
    }
}

// POST — actually send a test push notification
export async function POST(request) {
    const results = { steps: [], errors: [] };
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        results.steps.push(`✅ Session: ${session.email} (${session.sub})`);

        const supabase = createAdminClient();

        // 1. Get subscriptions
        const { data: subs, error: subError } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', session.sub);

        if (subError) {
            results.errors.push(`❌ DB error: ${subError.message}`);
            return NextResponse.json({ results }, { status: 500 });
        }

        results.steps.push(`📱 Found ${subs?.length || 0} subscription(s)`);

        if (!subs || subs.length === 0) {
            results.errors.push('❌ No push subscriptions found for your account. Click "Enable" notifications first, then try again.');
            return NextResponse.json({ results });
        }

        // 2. Try sending web-push to each
        const webpush = getWebPush();
        const payload = JSON.stringify({
            title: '🔔 BenzTraq Push Test',
            body: `Test at ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}. If you see this, push works!`,
            url: '/tasks',
            tag: 'test-push',
            icon: '/notification-icon.png',
        });

        results.steps.push(`📤 Sending with VAPID private key (${VAPID_PRIVATE_KEY?.length || 0} chars)...`);

        let sent = 0, failed = 0;
        for (const sub of subs) {
            results.steps.push(`\n--- Subscription: ${sub.endpoint?.substring(0, 60)}... ---`);
            results.steps.push(`  p256dh: ${sub.p256dh?.substring(0, 20)}... (${sub.p256dh?.length} chars)`);
            results.steps.push(`  auth: ${sub.auth?.substring(0, 10)}... (${sub.auth?.length} chars)`);

            try {
                await webpush.sendNotification({
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth },
                }, payload);
                results.steps.push(`  ✅ SENT SUCCESSFULLY`);
                sent++;
            } catch (err) {
                results.steps.push(`  ❌ FAILED: ${err.message || 'Unknown error'}`);
                results.steps.push(`  Status: ${err.statusCode || 'N/A'}`);
                results.steps.push(`  Headers: ${JSON.stringify(err.headers || {})}`);
                results.steps.push(`  Body: ${err.body || 'N/A'}`);
                results.errors.push(`Push failed for endpoint: ${err.statusCode} ${err.message}`);
                failed++;

                // Remove stale
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await supabase.from('push_subscriptions').delete().eq('id', sub.id);
                    results.steps.push(`  🗑️ Removed stale subscription`);
                }
            }
        }

        results.steps.push(`\n📊 Results: ${sent} sent, ${failed} failed`);
        results.sent = sent;
        results.failed = failed;

        return NextResponse.json({ results });
    } catch (error) {
        results.errors.push(`❌ Exception: ${error.message}\n${error.stack}`);
        return NextResponse.json({ results, error: error.message }, { status: 500 });
    }
}
