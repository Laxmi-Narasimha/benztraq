/**
 * Notification Trigger Layer
 * Calls /api/notifications/send to dispatch push + in-app notifications
 */

// Core send function
async function sendNotification({ user_id, title, body, url, tag }) {
    try {
        await fetch('/api/notifications/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id, title, body, url, tag }),
        });
    } catch (error) {
        console.error('[Notify] Failed:', error);
    }
}

// Task assigned → notify assignee
export async function notifyTaskAssigned(assigneeId, taskTitle, assignerName) {
    await sendNotification({
        user_id: assigneeId,
        title: '📋 New Task Assigned',
        body: `${taskTitle}\nAssigned by: ${assignerName}`,
        url: '/tasks',
        tag: 'task-assigned',
    });
}

// Employee update → notify all master users
export async function notifyEmployeeUpdate(masterUserIds, taskTitle, employeeName) {
    for (const uid of masterUserIds) {
        await sendNotification({
            user_id: uid,
            title: `📝 ${employeeName} updated a task`,
            body: taskTitle,
            url: '/tasks',
            tag: `update-${Date.now()}`,
        });
    }
}

// Chat message → notify recipient
export async function notifyNewChatMessage(recipientId, senderName, taskTitle, preview) {
    const previewText = preview.length > 50 ? preview.substring(0, 50) + '...' : preview;
    await sendNotification({
        user_id: recipientId,
        title: `💬 ${senderName}`,
        body: `${previewText}\nOn: ${taskTitle}`,
        url: '/tasks',
        tag: `chat-${Date.now()}`,
    });
}

// Deadline approaching → notify assignee
export async function notifyDeadlineApproaching(assigneeId, taskTitle, deadline) {
    await sendNotification({
        user_id: assigneeId,
        title: '⏰ Deadline Tomorrow',
        body: `${taskTitle}\nDue: ${deadline}`,
        url: '/tasks',
        tag: 'deadline-reminder',
    });
}
