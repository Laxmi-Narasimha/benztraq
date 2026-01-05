/**
 * Update Passwords API Route
 * Updates passwords for specific users (Chaitanya, Manan, Prashansa)
 * 
 * POST /api/admin/update-passwords
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { hashPassword } from '@/lib/utils/password';

const CHOPRA_PASSWORD = 'Hound@1102';

const USERS_TO_UPDATE = [
    'chaitanya@benz-packaging.com',
    'manan@benz-packaging.com',
    'prashansa@benz-packaging.com'
];

export async function POST(request) {
    try {
        const supabase = createAdminClient();
        const passwordHash = await hashPassword(CHOPRA_PASSWORD);
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
