/**
 * Settings API
 * Returns application settings (prevents 404 errors)
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/utils/session';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Check authentication
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Return default settings
        return NextResponse.json({
            settings: {
                currency: 'INR',
                dateFormat: 'DD/MM/YYYY',
                timezone: 'Asia/Kolkata',
                companyName: 'Benz Packaging',
                defaultGSTRate: 18,
                defaultUOM: 'PCS'
            }
        });

    } catch (error) {
        console.error('Settings error:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}
