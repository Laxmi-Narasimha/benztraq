/**
 * Push Subscription API
 * POST /api/notifications/subscribe — Save push subscription
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/utils/session';

export async function POST(request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { endpoint, p256dh, auth } = await request.json();
        if (!endpoint || !p256dh || !auth) {
            return NextResponse.json({ error: 'Missing subscription data' }, { status: 400 });
        }

        const supabase = createAdminClient();

        const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
                user_id: session.sub,
                endpoint,
                p256dh,
                auth,
            }, { onConflict: 'user_id,endpoint' });

        if (error) {
            console.error('[Subscribe] Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Subscribe] Exception:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
