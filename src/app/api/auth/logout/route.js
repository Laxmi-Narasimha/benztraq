/**
 * Logout API Route
 * Clears session and logs activity
 * 
 * POST /api/auth/logout
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'benztraq_session';

export async function POST() {
    try {
        // Clear session cookie
        const cookieStore = await cookies();
        cookieStore.delete(SESSION_COOKIE_NAME);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Logout error:', error);

        // Return success anyway with cookie deletion in response
        const response = NextResponse.json({ success: true });
        response.cookies.delete(SESSION_COOKIE_NAME);
        return response;
    }
}
