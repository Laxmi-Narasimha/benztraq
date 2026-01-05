/**
 * Verify OTP API Route
 * 
 * Verifies OTP code for password reset.
 * 
 * POST /api/auth/verify-otp
 * Body: { email: string, otp: string }
 * 
 * @module api/auth/verify-otp
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { isValidOTPFormat, isOTPExpired } from '@/lib/utils/otp';

export async function POST(request) {
    try {
        const { email, otp } = await request.json();

        if (!email || !otp) {
            return NextResponse.json(
                { error: 'Email and OTP are required' },
                { status: 400 }
            );
        }

        // Validate OTP format
        if (!isValidOTPFormat(otp)) {
            return NextResponse.json(
                { error: 'Invalid OTP format. Please enter a 6-digit code.' },
                { status: 400 }
            );
        }

        const normalizedEmail = email.trim().toLowerCase();
        const supabase = createAdminClient();

        // 1. Find the OTP record
        const { data: otpRecord, error: otpError } = await supabase
            .from('password_reset_otps')
            .select('*')
            .eq('email', normalizedEmail)
            .eq('otp_code', otp)
            .eq('used', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (otpError || !otpRecord) {
            console.log('[OTP] Invalid OTP attempted for:', normalizedEmail);
            return NextResponse.json(
                { error: 'Invalid or expired OTP. Please try again.' },
                { status: 401 }
            );
        }

        // 2. Check if OTP has expired
        if (isOTPExpired(otpRecord.expires_at)) {
            console.log('[OTP] Expired OTP used for:', normalizedEmail);
            return NextResponse.json(
                { error: 'OTP has expired. Please request a new one.' },
                { status: 401 }
            );
        }

        // 3. Mark OTP as verified (but not used yet - used after password change)
        await supabase
            .from('password_reset_otps')
            .update({ verified: true })
            .eq('id', otpRecord.id);

        console.log('[OTP] OTP verified for:', normalizedEmail);

        // 4. Generate a temporary reset token (valid for 5 minutes)
        // This token is used to authorize the password change
        const resetToken = Buffer.from(`${otpRecord.id}:${Date.now()}`).toString('base64');

        return NextResponse.json({
            success: true,
            message: 'OTP verified successfully. You can now reset your password.',
            resetToken, // Client needs to send this with password change request
            expiresIn: '5 minutes',
        });

    } catch (error) {
        console.error('[OTP] Verify OTP error:', error);
        return NextResponse.json(
            { error: 'An error occurred. Please try again.' },
            { status: 500 }
        );
    }
}
