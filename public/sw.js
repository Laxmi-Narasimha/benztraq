// ============================================================================
// BenzTraq Service Worker
// Handles: Push Notifications
// ============================================================================

const CACHE_NAME = 'benztraq-v1';

// Install — skip waiting
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// Activate — claim clients
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Push — show notification
self.addEventListener('push', (event) => {
    let data = {
        title: 'BenzTraq',
        body: 'You have a new notification',
        icon: '/favicon.ico',
        url: '/tasks',
    };

    try {
        if (event.data) {
            const payload = event.data.json();
            data = { ...data, ...payload };
        }
    } catch (e) {
        if (event.data) data.body = event.data.text();
    }

    const options = {
        body: data.body,
        icon: data.icon || '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [200, 100, 200],
        data: { url: data.url || '/tasks' },
        tag: data.tag || 'benztraq-notification',
        requireInteraction: true,
        renotify: true,
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click — open/focus window
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data?.url || '/tasks';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(urlToOpen);
                    return client.focus();
                }
            }
            if (clients.openWindow) return clients.openWindow(urlToOpen);
        })
    );
});
