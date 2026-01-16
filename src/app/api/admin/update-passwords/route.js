/**
 * Update Passwords API Route
 * Updates passwords for specific users (Chaitanya, Manan, Prashansa)
 * 
 * POST /api/admin/update-passwords
 * 
 * SECURITY: Requires developer role authentication
 * Uses SEED_DIRECTOR_PASSWORD environment variable
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { hashPassword } from '@/lib/utils/password';
import { getCurrentUser } from '@/lib/utils/session';

// SECURITY: Password loaded from environment variable
const DIRECTOR_PASSWORD = process.env.SEED_DIRECTOR_PASSWORD || 'ChangeMe123!';

const USERS_TO_UPDATE = [
    'chaitanya@benz-packaging.com',
    'manan@benz-packaging.com',
    'prashansa@benz-packaging.com'
];

export async function POST(request) {
    try {
        // SECURITY: Only developers can update passwords via this endpoint
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (currentUser.role !== 'developer') {
            return NextResponse.json({ error: 'Forbidden - Developer only' }, { status: 403 });
        }

        const supabase = createAdminClient();
        const passwordHash = await hashPassword(DIRECTOR_PASSWORD);
        const results = [];

        for (const email of USERS_TO_UPDATE) {
            const { data, error } = await supabase
                .from('profiles')
                .update({ password_hash: passwordHash })
                .eq('email', email.toLowerCase())
                .select('email, full_name')
                .single();

            if (error) {
                results.push({ email, status: 'error', message: error.message });
            } else if (data) {
                results.push({ email, status: 'success', name: data.full_name });
            } else {
                results.push({ email, status: 'not_found' });
            }
        }

        const successCount = results.filter(r => r.status === 'success').length;

        return NextResponse.json({
            success: true,
            message: `Updated passwords for ${successCount}/${USERS_TO_UPDATE.length} users`,
            results
        });

    } catch (error) {
        console.error('Update passwords error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
