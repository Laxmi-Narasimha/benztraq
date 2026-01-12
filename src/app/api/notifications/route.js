/**
 * Notifications API Route
 * 
 * Provides comprehensive notification functionality:
 * - GET: Fetch notifications (filtered by user role)
 * - POST: Create notification
 * - PATCH: Mark notification as read
 * 
 * Visibility Rules:
 * - Directors/Developers: See ALL notifications
 * - Head of Sales: See notifications for their company
 * - ASMs: See ONLY their own notifications
 * 
 * @module api/notifications
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/utils/session';

export const dynamic = 'force-dynamic';

// Manager roles that can see all notifications
const MANAGER_ROLES = ['developer', 'director', 'head_of_sales', 'head of sales', 'vp'];

function isManager(role) {
    if (!role) return false;
    return MANAGER_ROLES.includes(role.toLowerCase());
}

// ============================================================================
// GET: Fetch notifications
// ============================================================================

export async function GET(request) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized',
                notifications: [],
                unreadCount: 0
            }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit')) || 20;
        const unreadOnly = searchParams.get('unread') === 'true';

        const supabase = createAdminClient();
        const userIsManager = isManager(currentUser.role);

        let query = supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        // ASMs only see their own notifications
        if (!userIsManager) {
            query = query.eq('user_id', currentUser.id);
        }

        if (unreadOnly) {
            query = query.eq('is_read', false);
        }

        const { data: notifications, error } = await query;

        if (error) {
            console.error('[Notifications API] Fetch error:', error.message);
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch notifications',
                notifications: [],
                unreadCount: 0
            }, { status: 200 });
        }

        // Get unread count
        let countQuery = supabase
            .from('notifications')
            .select('id', { count: 'exact' })
            .eq('is_read', false);

        if (!userIsManager) {
            countQuery = countQuery.eq('user_id', currentUser.id);
        }

        const { count: unreadCount } = await countQuery;

        return NextResponse.json({
            success: true,
            notifications: notifications || [],
            unreadCount: unreadCount || 0,
            isManager: userIsManager
        });

    } catch (error) {
        console.error('[Notifications API] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            notifications: [],
            unreadCount: 0
        }, { status: 200 });
    }
}

// ============================================================================
// POST: Create notification
// ============================================================================

export async function POST(request) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized'
            }, { status: 401 });
        }

        let body;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json({
                success: false,
                error: 'Invalid JSON'
            }, { status: 400 });
        }

        const { type, title, message, user_id, metadata } = body;

        if (!type || !title) {
            return NextResponse.json({
                success: false,
                error: 'Type and title are required'
            }, { status: 400 });
        }

        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('notifications')
            .insert({
                type,
                title,
                message: message || '',
                user_id: user_id || null, // NULL means visible to all managers
                created_by: currentUser.id,
                metadata: metadata || {},
                is_read: false
            })
            .select()
            .single();

        if (error) {
            console.error('[Notifications API] Create error:', error.message);
            return NextResponse.json({
                success: false,
                error: 'Failed to create notification: ' + error.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            notification: data
        });

    } catch (error) {
        console.error('[Notifications API] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

// ============================================================================
// PATCH: Mark notification as read
// ============================================================================

export async function PATCH(request) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized'
            }, { status: 401 });
        }

        let body;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json({
                success: false,
                error: 'Invalid JSON'
            }, { status: 400 });
        }

        const { notificationId, markAllRead } = body;

        const supabase = createAdminClient();

        if (markAllRead) {
            // Mark all as read for this user
            let query = supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('is_read', false);

            if (!isManager(currentUser.role)) {
                query = query.eq('user_id', currentUser.id);
            }

            const { error } = await query;

            if (error) {
                return NextResponse.json({
                    success: false,
                    error: 'Failed to mark all as read'
                }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                message: 'All notifications marked as read'
            });
        }

        if (!notificationId) {
            return NextResponse.json({
                success: false,
                error: 'notificationId or markAllRead is required'
            }, { status: 400 });
        }

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (error) {
            return NextResponse.json({
                success: false,
                error: 'Failed to mark as read'
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Notification marked as read'
        });

    } catch (error) {
        console.error('[Notifications API] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
