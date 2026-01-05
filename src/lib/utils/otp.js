/**
 * OTP Utility Module
 * 
 * Handles OTP generation, validation, and email sending (pluggable).
 * 
 * @module lib/utils/otp
 */

import crypto from 'crypto';

// OTP Configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 3;

/**
 * Generate a cryptographically secure 6-digit OTP
 * @returns {string} 6-digit OTP code
 */
export function generateOTP() {
    // Generate random bytes and convert to a 6-digit number
    const buffer = crypto.randomBytes(4);
    const randomNum = buffer.readUInt32BE(0);
    const otp = (randomNum % 900000) + 100000; // Ensures 6 digits (100000-999999)
    return otp.toString();
}

/**
 * Get OTP expiry timestamp
 * @param {number} minutes - Minutes until expiry (default: 10)
 * @returns {Date} Expiry timestamp
 */
export function getOTPExpiry(minutes = OTP_EXPIRY_MINUTES) {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + minutes);
    return expiry;
}

/**
 * Validate OTP format
 * @param {string} otp - OTP to validate
 * @returns {boolean} True if valid format
 */
export function isValidOTPFormat(otp) {
    return /^\d{6}$/.test(otp);
}

/**
 * Check if OTP has expired
 * @param {Date|string} expiresAt - Expiry timestamp
 * @returns {boolean} True if expired
 */
export function isOTPExpired(expiresAt) {
    const expiry = new Date(expiresAt);
    return expiry < new Date();
}

/**
 * Email service configuration (to be filled with actual API key)
 * Supports: resend, sendgrid, mailgun
 */
export const EMAIL_CONFIG = {
    provider: process.env.EMAIL_PROVIDER || 'resend', // 'resend' | 'sendgrid' | 'mailgun'
    apiKey: process.env.EMAIL_API_KEY || '',
    fromEmail: process.env.EMAIL_FROM || 'noreply@benztraq.com',
    fromName: process.env.EMAIL_FROM_NAME || 'BenzTraq',
};

/**
 * Send OTP email (placeholder - will be implemented when API key is available)
 * @param {string} toEmail - Recipient email
 * @param {string} otp - OTP code
 * @param {string} userName - User's name for personalization
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
 */
export async function sendOTPEmail(toEmail, otp, userName = 'User') {
    // Check if email service is configured
    if (!EMAIL_CONFIG.apiKey) {
        console.log('[OTP] Email service not configured. OTP:', otp);
        console.log('[OTP] To configure, set EMAIL_API_KEY environment variable');

        // In development, return success and log OTP
        if (process.env.NODE_ENV === 'development') {
            return {
                success: true,
                messageId: 'dev-mode',
                devOtp: otp // Only in dev mode for testing
            };
        }

        return {
            success: false,
            error: 'Email service not configured'
        };
    }

    // Email HTML template
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset OTP</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5; padding: 40px 20px;">
                <tr>
                    <td align="center">
                        <table role="presentation" width="100%" max-width="500" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
                            <!-- Header -->
                            <tr>
                                <td style="background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); padding: 30px; text-align: center;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">BenzTraq</h1>
                                    <p style="color: #999999; margin: 8px 0 0 0; font-size: 14px;">Password Reset Request</p>
                                </td>
                            </tr>
                            <!-- Content -->
                            <tr>
                                <td style="padding: 40px 30px;">
                                    <p style="color: #333333; font-size: 16px; margin: 0 0 20px 0;">Hi ${userName},</p>
                                    <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0 0 30px 0;">
                                        You requested to reset your password. Use the verification code below to complete the process:
                                    </p>
                                    <!-- OTP Box -->
                                    <div style="background-color: #f8f9fa; border: 2px dashed #e0e0e0; border-radius: 8px; padding: 25px; text-align: center; margin: 0 0 30px 0;">
                                        <p style="color: #666666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0;">Your Verification Code</p>
                                        <p style="color: #1a1a1a; font-size: 36px; font-weight: 700; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${otp}</p>
                                    </div>
                                    <p style="color: #999999; font-size: 13px; line-height: 1.5; margin: 0 0 10px 0;">
                                        ⏱️ This code expires in <strong>10 minutes</strong>.
                                    </p>
                                    <p style="color: #999999; font-size: 13px; line-height: 1.5; margin: 0;">
                                        🔒 If you didn't request this, please ignore this email.
                                    </p>
                                </td>
                            </tr>
                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
                                    <p style="color: #999999; font-size: 12px; margin: 0;">
                                        © ${new Date().getFullYear()} Benz Packaging Solutions. All rights reserved.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;

    try {
        // Send email based on configured provider
        switch (EMAIL_CONFIG.provider) {
            case 'resend':
                return await sendViaResend(toEmail, htmlContent);
            case 'sendgrid':
                return await sendViaSendGrid(toEmail, htmlContent);
            default:
                return { success: false, error: 'Unknown email provider' };
        }
    } catch (error) {
        console.error('[OTP] Email send error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send email via Resend
 */
async function sendViaResend(toEmail, htmlContent) {
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${EMAIL_CONFIG.apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.fromEmail}>`,
            to: [toEmail],
            subject: 'Your Password Reset Code - BenzTraq',
            html: htmlContent,
        }),
    });

    const data = await response.json();

    if (response.ok) {
        return { success: true, messageId: data.id };
    } else {
        return { success: false, error: data.message || 'Failed to send email' };
    }
}

/**
 * Send email via SendGrid
 */
async function sendViaSendGrid(toEmail, htmlContent) {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${EMAIL_CONFIG.apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            personalizations: [{ to: [{ email: toEmail }] }],
            from: { email: EMAIL_CONFIG.fromEmail, name: EMAIL_CONFIG.fromName },
            subject: 'Your Password Reset Code - BenzTraq',
            content: [{ type: 'text/html', value: htmlContent }],
        }),
    });

    if (response.ok || response.status === 202) {
        return { success: true, messageId: 'sendgrid-sent' };
    } else {
        const data = await response.json();
        return { success: false, error: data.errors?.[0]?.message || 'Failed to send email' };
    }
}
