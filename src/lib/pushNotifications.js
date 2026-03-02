/**
 * Push Notifications Client Helper
 * Handles: Service Worker registration, Push subscription, Permission requests
 * 
 * IMPORTANT: When VAPID keys change, existing subscriptions must be unsubscribed
 * and re-created with the new key.
 */

'use client';

// VAPID Public Key — must match the server-side key
const VAPID_PUBLIC_KEY = 'BHl3YORFfOmNjRvHCWGFEdG1ov3i2T_DP0-lBedQZ8-ezxUx2MXvZTpdWjxvAXsb50fOj8qj5Q0OsyuAu1F3SY8';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function isPushSupported() {
    return (
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window
    );
}

export function getNotificationPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    return Notification.permission;
}

export async function requestNotificationPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    try {
        return await Notification.requestPermission();
    } catch {
        return 'denied';
    }
}

export async function registerServiceWorker() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
    try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        return registration;
    } catch (error) {
        console.error('[Push] SW registration failed:', error);
        return null;
    }
}

export async function subscribeToPush(userId) {
    if (!VAPID_PUBLIC_KEY || !isPushSupported()) {
        return { success: false, error: 'Push not supported in this browser' };
    }

    try {
        // Step 1: Register service worker
        console.log('[Push] Step 1: Registering service worker...');
        const registration = await registerServiceWorker();
        if (!registration) return { success: false, error: 'Service worker registration failed' };

        const readyRegistration = await navigator.serviceWorker.ready;
        console.log('[Push] Step 2: Service worker ready');

        // Step 2: Unsubscribe any existing subscription (may be bound to old VAPID key)
        const existingSub = await readyRegistration.pushManager.getSubscription();
        if (existingSub) {
            console.log('[Push] Step 3: Unsubscribing old subscription...');
            await existingSub.unsubscribe();
            console.log('[Push] Step 3: Old subscription removed');
        }

        // Step 3: Create fresh subscription with current VAPID key
        console.log('[Push] Step 4: Creating new subscription with VAPID key...');
        const subscription = await readyRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
        console.log('[Push] Step 5: Subscription created:', subscription.endpoint?.substring(0, 50));

        // Step 4: Save to our API
        const subJson = subscription.toJSON();
        const endpoint = subJson.endpoint;
        const p256dh = subJson.keys?.p256dh || '';
        const auth = subJson.keys?.auth || '';

        if (!endpoint || !p256dh || !auth) {
            return { success: false, error: 'Subscription missing required fields (endpoint/p256dh/auth)' };
        }

        console.log('[Push] Step 6: Saving to API...', {
            endpoint: endpoint.substring(0, 50),
            p256dh: p256dh.substring(0, 20) + '...',
            auth: auth.substring(0, 10) + '...',
        });

        const res = await fetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint, p256dh, auth }),
        });

        if (!res.ok) {
            const data = await res.json();
            console.error('[Push] Step 7: API error:', data);
            return { success: false, error: `API error: ${data.error || res.status}` };
        }

        console.log('[Push] Step 7: ✅ Subscription saved successfully!');
        return { success: true };
    } catch (error) {
        console.error('[Push] Subscribe failed:', error);
        return { success: false, error: `Exception: ${error.message}` };
    }
}
