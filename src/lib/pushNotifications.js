/**
 * Push Notifications Client Helper
 * Handles: Service Worker registration, Push subscription, Permission requests
 * Adapted from benzdesk pushNotifications.ts
 */

'use client';

// VAPID Public Key — safe to expose client-side
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
        return { success: false, error: 'Push not supported' };
    }

    try {
        const registration = await registerServiceWorker();
        if (!registration) return { success: false, error: 'SW not available' };

        const readyRegistration = await navigator.serviceWorker.ready;
        let subscription = await readyRegistration.pushManager.getSubscription();

        if (!subscription) {
            subscription = await readyRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });
        }

        // Save to our API
        const subJson = subscription.toJSON();
        const res = await fetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                endpoint: subJson.endpoint,
                p256dh: subJson.keys?.p256dh || '',
                auth: subJson.keys?.auth || '',
            }),
        });

        if (!res.ok) {
            const data = await res.json();
            return { success: false, error: data.error };
        }

        return { success: true };
    } catch (error) {
        console.error('[Push] Subscribe failed:', error);
        return { success: false, error: 'Failed to subscribe' };
    }
}
