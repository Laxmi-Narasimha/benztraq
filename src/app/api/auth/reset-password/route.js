/**
 * Reset Password API Route
 * 
 * Changes password after OTP verification.
 * 
 * POST /api/auth/reset-password
 * Body: { email: string, resetToken: string, newPassword: string }
 * 
 * @module api/auth/reset-password
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { hashPassword, validatePasswordStrength } from '@/lib/utils/password';
import { isOTPExpired } from '@/lib/utils/otp';

// Reset token validity (5 minutes after OTP verification)
const RESET_TOKEN_VALIDITY_MINUTES = 5;

export async function POST(request) {
    try {
        const { email, resetToken, newPassword } = await request.json();

        if (!email || !resetToken || !newPassword) {
            return NextResponse.json(
                { error: 'Email, reset token, and new password are required' },
                { status: 400 }
            );
        }

        // 1. Validate password strength
        const passwordValidation = validatePasswordStrength(newPassword);
        if (!passwordValidation.valid) {
            return NextResponse.json(
                {
                    error: 'Password does not meet requirements',
                    details: passwordValidation.errors
                },
                { status: 400 }
            );
        }

        const normalizedEmail = email.trim().toLowerCase();
        const supabase = createAdminClient();

        // 2. Decode and validate reset token
        let otpRecordId, tokenTimestamp;
        try {
            const decoded = Buffer.from(resetToken, 'base64').toString('utf-8');
            [otpRecordId, tokenTimestamp] = decoded.split(':');

            // Check token age (5 minutes max)
            const tokenAge = (Date.now() - parseInt(tokenTimestamp)) / 1000 / 60;
            if (tokenAge > RESET_TOKEN_VALIDITY_MINUTES) {
                return NextResponse.json(
                    { error: 'Reset token has expired. Please verify OTP again.' },
                    { status: 401 }
                );
            }
        } catch (e) {
            return NextResponse.json(
                { error: 'Invalid reset token.' },
                { status: 401 }
            );
        }

        // 3. Verify OTP record exists and is verified
        const { data: otpRecord, error: otpError } = await supabase
            .from('password_reset_otps')
            .select('*')
            .eq('id', otpRecordId)
            .eq('email', normalizedEmail)
            .eq('verified', true)
            .eq('used', false)
            .single();

        if (otpError || !otpRecord) {
            console.log('[Password Reset] Invalid token for:', normalizedEmail);
            return NextResponse.json(
                { error: 'Invalid or expired reset token. Please start over.' },
                { status: 401 }
            );
        }

        // 4. Check if OTP has expired
        if (isOTPExpired(otpRecord.expires_at)) {
            return NextResponse.json(
                { error: 'Session expired. Please request a new OTP.' },
                { status: 401 }
            );
        }

        // 5. Hash the new password
        const hashedPassword = await hashPassword(newPassword);

        // 6. Update password in profiles table
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ password_hash: hashedPassword })
            .eq('user_id', otpRecord.user_id);

        if (updateError) {
            console.error('[Password Reset] Failed to update password:', updateError);
            return NextResponse.json(
                { error: 'Failed to update password. Please try again.' },
                { status: 500 }
            );
        }

        // 7. Mark OTP as used
        await supabase
            .from('password_reset_otps')
            .update({ used: true })
            .eq('id', otpRecordId);

        // 8. Invalidate all other OTPs for this user
        await supabase
            .from('password_reset_otps')
            .update({ used: true })
            .eq('email', normalizedEmail)
            .eq('used', false);

        console.log('[Password Reset] Password changed successfully for:', normalizedEmail);

        return NextResponse.json({
            success: true,
            message: 'Password changed successfully. You can now login with your new password.',
        });

    } catch (error) {
        console.error('[Password Reset] Error:', error);
        return NextResponse.json(
            { error: 'An error occurred. Please try again.' },
            { status: 500 }
        );
    }
}
