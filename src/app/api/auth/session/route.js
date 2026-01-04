/**
 * Session API Route
 * Returns current session info
 * 
 * GET /api/auth/session
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/utils/session';

export async function GET() {
    try {
        const user = await getCurrentUser();

        if (!user) {
            // Return 200 instead of 401 to avoid browser console errors
            return NextResponse.json({ authenticated: false });
        }

        return NextResponse.json({
            authenticated: true,
            user
        });
    } catch (error) {
        console.error('Session check error:', error);
        return NextResponse.json({ authenticated: false });
    }
}
