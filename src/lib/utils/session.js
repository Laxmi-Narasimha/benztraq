/**
 * Session Utility
 * Handles JWT token generation and validation for custom auth
 * 
 * @module lib/utils/session
 */

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-secret-key-change-in-production'
);

const SESSION_COOKIE_NAME = 'benztraq_session';
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 days in seconds

/**
 * Create a JWT token for a user
 * @param {Object} payload - User data to encode
 * @returns {Promise<string>} JWT token
 */
export async function createToken(payload) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${SESSION_DURATION}s`)
        .sign(SECRET_KEY);
}

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Promise<Object|null>} Decoded payload or null if invalid
 */
export async function verifyToken(token) {
    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        return payload;
    } catch (error) {
        console.error('Token verification failed:', error.message);
        return null;
    }
}

/**
 * Set session cookie
 * @param {string} token - JWT token
 */
export async function setSessionCookie(token) {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_DURATION,
        path: '/',
    });
}

/**
 * Get session from cookie
 * @returns {Promise<Object|null>} User session or null
 */
export async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) return null;

    return verifyToken(token);
}

/**
 * Clear session cookie
 */
export async function clearSession() {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Get current user from session
 * @returns {Promise<Object|null>} Current user or null
 */
export async function getCurrentUser() {
    const session = await getSession();
    if (!session) return null;

    return {
        id: session.sub,
        email: session.email,
        fullName: session.full_name,
        role: session.role,
        roleId: session.role_id,
        permissions: session.permissions || {},
    };
}
