/**
 * Admin Password Reset API Route
 * Allows administrators to instantly reset any user's password.
 * 
 * POST /api/admin/reset-password
 * Body: { userId: string, newPassword?: string }
 * 
 * If newPassword is not provided, resets to default "Benz@2024"
 * 
 * SECURITY: Requires developer role authentication
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { hashPassword } from '@/lib/utils/password';
import { getCurrentUser } from '@/lib/utils/session';

const DEFAULT_PASSWORD = 'Benz@2024';

export async function POST(request) {
    try {
        // SECURITY: Only developers/admins can reset passwords
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Allow developer and director roles
        if (!['developer', 'director', 'head_of_sales'].includes(currentUser.role)) {
            return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 });
        }

        const body = await request.json();
        const { userId, newPassword } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const supabase = createAdminClient();
        const passwordToSet = newPassword || DEFAULT_PASSWORD;

        // Get user info for response
        const { data: targetUser, error: findError } = await supabase
            .from('profiles')
            .select('user_id, full_name, email')
            .eq('user_id', userId)
            .single();

        if (findError || !targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Hash and update password
        const passwordHash = await hashPassword(passwordToSet);

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ password_hash: passwordHash })
            .eq('user_id', userId);

        if (updateError) {
            console.error('[Admin] Password reset failed:', updateError);
            return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
        }

        // Log the action
        await supabase
            .from('activity_log')
            .insert({
                user_id: currentUser.sub || currentUser.id,
                action: 'reset_password',
                resource_type: 'users',
                resource_id: userId,
                details: {
                    target_email: targetUser.email,
                    target_name: targetUser.full_name,
                    reset_type: newPassword ? 'custom' : 'default',
                    performed_by: currentUser.email
                }
            });

        console.log(`[Admin] Password reset for ${targetUser.email} by ${currentUser.email}`);

        return NextResponse.json({
            success: true,
            message: `Password reset successfully for ${targetUser.full_name}`,
            user: {
                fullName: targetUser.full_name,
                email: targetUser.email
            },
            isDefault: !newPassword
        });

    } catch (error) {
        console.error('[Admin] Password reset error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
