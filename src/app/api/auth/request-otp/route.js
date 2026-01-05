/**
 * Request OTP API Route
 * 
 * Generates and sends OTP for password reset.
 * 
 * POST /api/auth/request-otp
 * Body: { email: string }
 * 
 * @module api/auth/request-otp
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { generateOTP, getOTPExpiry, sendOTPEmail } from '@/lib/utils/otp';

// Rate limiting: max 3 OTP requests per email per hour
const RATE_LIMIT_WINDOW_MINUTES = 60;
const RATE_LIMIT_MAX_REQUESTS = 3;

export async function POST(request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        const normalizedEmail = email.trim().toLowerCase();
        const supabase = createAdminClient();

        // 1. Check if email exists in profiles
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('user_id, full_name, email, is_active')
            .ilike('email', normalizedEmail)
            .single();

        if (profileError || !profile) {
            // Don't reveal if email exists or not (security)
            console.log('[OTP] Email not found:', normalizedEmail);
            return NextResponse.json({
                success: true,
                message: 'If this email is registered, you will receive an OTP shortly.'
            });
        }

        if (!profile.is_active) {
            return NextResponse.json(
                { error: 'Account is inactive. Please contact administrator.' },
                { status: 403 }
            );
        }

        // 2. Rate limiting - check recent OTP requests
        const rateLimitTime = new Date();
        rateLimitTime.setMinutes(rateLimitTime.getMinutes() - RATE_LIMIT_WINDOW_MINUTES);

        const { count: recentRequests } = await supabase
            .from('password_reset_otps')
            .select('*', { count: 'exact', head: true })
            .eq('email', normalizedEmail)
            .gte('created_at', rateLimitTime.toISOString());

        if (recentRequests >= RATE_LIMIT_MAX_REQUESTS) {
            return NextResponse.json(
                { error: 'Too many OTP requests. Please try again later.' },
                { status: 429 }
            );
        }

        // 3. Invalidate any existing unused OTPs for this user
        await supabase
            .from('password_reset_otps')
            .update({ used: true })
            .eq('email', normalizedEmail)
            .eq('used', false);

        // 4. Generate new OTP
        const otp = generateOTP();
        const expiresAt = getOTPExpiry(10); // 10 minutes

        // 5. Store OTP in database
        const { error: insertError } = await supabase
            .from('password_reset_otps')
            .insert({
                user_id: profile.user_id,
                email: normalizedEmail,
                otp_code: otp,
                expires_at: expiresAt.toISOString(),
                ip_address: request.headers.get('x-forwarded-for') || 'unknown',
                user_agent: request.headers.get('user-agent') || 'unknown',
            });

        if (insertError) {
            console.error('[OTP] Failed to store OTP:', insertError);
            return NextResponse.json(
                { error: 'Failed to generate OTP. Please try again.' },
                { status: 500 }
            );
        }

        // 6. Send OTP via email
        const emailResult = await sendOTPEmail(normalizedEmail, otp, profile.full_name);

        if (!emailResult.success && process.env.NODE_ENV !== 'development') {
            console.error('[OTP] Failed to send email:', emailResult.error);
            return NextResponse.json(
                { error: 'Failed to send OTP email. Please try again.' },
                { status: 500 }
            );
        }

        console.log('[OTP] OTP generated for:', normalizedEmail, 'Expires:', expiresAt);

        // In development mode, include OTP in response for testing
        const response = {
            success: true,
            message: 'OTP sent to your email. Please check your inbox.',
            expiresIn: '10 minutes',
        };

        // DEV MODE ONLY: Include OTP for testing
        if (process.env.NODE_ENV === 'development' && emailResult.devOtp) {
            response.devOtp = emailResult.devOtp;
            response.devNote = 'OTP included for development testing only';
        }

        return NextResponse.json(response);

    } catch (error) {
        console.error('[OTP] Request OTP error:', error);
        return NextResponse.json(
            { error: 'An error occurred. Please try again.' },
            { status: 500 }
        );
    }
}
