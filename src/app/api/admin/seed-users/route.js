/**
 * Seed Users API Route
 * Seeds the default users into the database
 * 
 * POST /api/admin/seed-users
 * 
 * SECURITY: Requires developer role authentication
 * 
 * Required environment variables:
 * - SEED_DEFAULT_PASSWORD: Default password for most users
 * - SEED_DIRECTOR_PASSWORD: Password for directors
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { hashPassword } from '@/lib/utils/password';
import { getCurrentUser } from '@/lib/utils/session';

// SECURITY: Passwords now loaded from environment variables
const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || 'ChangeMe123!';
const DIRECTOR_PASSWORD = process.env.SEED_DIRECTOR_PASSWORD || 'ChangeMe123!';

const DEFAULT_USERS = [
    {
        email: 'laxmi@benz-packaging.com',
        fullName: 'Laxmi',
        roleName: 'developer',
        designation: 'System Developer',
        phone: null,
        regionName: null,
        organization: 'benz_packaging',
        companies: ['benz', 'ergopack']
    },
    {
        email: 'manan@benz-packaging.com',
        fullName: 'Manan',
        roleName: 'director',
        designation: 'Director',
        phone: null,
        regionName: null,
        organization: 'benz_packaging',
        companies: ['benz', 'ergopack'],
        customPassword: DIRECTOR_PASSWORD
    },
    {
        email: 'chaitanya@benz-packaging.com',
        fullName: 'Chaitanya',
        roleName: 'director',
        designation: 'Director',
        phone: null,
        regionName: null,
        organization: 'benz_packaging',
        companies: ['benz', 'ergopack'],
        customPassword: DIRECTOR_PASSWORD
    },
    {
        email: 'prashansa@benz-packaging.com',
        fullName: 'Prashansa',
        roleName: 'director',
        designation: 'Director',
        phone: null,
        regionName: null,
        organization: 'benz_packaging',
        companies: ['benz', 'ergopack'],
        customPassword: DIRECTOR_PASSWORD
    },
    {
        email: 'isha@benz-packaging.com',
        fullName: 'Isha',
        roleName: 'head_of_sales',
        designation: 'VP Operations',
        phone: null,
        regionName: null,
        organization: 'ergopack_india',
        companies: ['ergopack']
    },
    {
        email: 'pulak@benz-packaging.com',
        fullName: 'Pulak Biswas',
        roleName: 'head_of_sales',
        designation: 'Head of Sales',
        phone: null,
        regionName: 'Gurgaon',
        organization: 'benz_packaging',
        companies: ['benz']
    },
    {
        email: 'abhishek@benz-packaging.com',
        fullName: 'Madhya Pradesh',
        roleName: 'asm',
        designation: 'Area Sales Manager',
        phone: null,
        regionName: 'Madhya Pradesh',
        organization: 'benz_packaging',
        companies: ['benz']
    },
    {
        email: 'wh.jaipur@benz-packaging.com',
        fullName: 'Rajasthan',
        roleName: 'asm',
        designation: 'Area Sales Manager',
        phone: null,
        regionName: 'Rajasthan',
        organization: 'benz_packaging',
        companies: ['benz']
    },
    {
        email: 'banglore@benz-packaging.com',
        fullName: 'Karnataka',
        roleName: 'asm',
        designation: 'Area Sales Manager',
        phone: null,
        regionName: 'Karnataka',
        organization: 'benz_packaging',
        companies: ['benz']
    },
    {
        email: 'rfq@benz-packaging.com',
        fullName: 'Maharashtra',
        roleName: 'asm',
        designation: 'Area Sales Manager',
        phone: null,
        regionName: 'Maharashtra',
        organization: 'benz_packaging',
        companies: ['benz']
    },
    {
        email: 'it@benz-packaging.com',
        fullName: 'Noida',
        roleName: 'asm',
        designation: 'Area Sales Manager',
        phone: null,
        regionName: 'Noida',
        organization: 'benz_packaging',
        companies: ['benz']
    },
    {
        email: 'west@benz-packaging.com',
        fullName: 'West Zone',
        roleName: 'asm',
        designation: 'Area Sales Manager',
        phone: null,
        regionName: 'West Zone',
        organization: 'benz_packaging',
        companies: ['benz']
    }
];

export async function POST(request) {
    try {
        // SECURITY: Only developers can seed users
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (currentUser.role !== 'developer') {
            return NextResponse.json({ error: 'Forbidden - Developer only' }, { status: 403 });
        }

        const supabase = createAdminClient();
        const results = [];
        const passwordHash = await hashPassword(DEFAULT_PASSWORD);

        // Get roles map
        const { data: roles } = await supabase
            .from('roles')
            .select('id, name');

        const roleMap = {};
        roles?.forEach(r => { roleMap[r.name] = r.id; });

        // Get regions map
        const { data: regions } = await supabase
            .from('regions')
            .select('id, name');

        const regionMap = {};
        regions?.forEach(r => { regionMap[r.name] = r.id; });

        for (const user of DEFAULT_USERS) {
            try {
                const userId = crypto.randomUUID();
                const roleId = roleMap[user.roleName];
                const regionId = user.regionName ? regionMap[user.regionName] : null;

                const legacyRole = user.roleName === 'developer' ? 'vp'
                    : user.roleName === 'director' ? 'director'
                        : user.roleName === 'head_of_sales' ? 'director'
                            : 'asm';

                const userPasswordHash = user.customPassword
                    ? await hashPassword(user.customPassword)
                    : passwordHash;

                const { data, error } = await supabase
                    .from('profiles')
                    .upsert({
                        user_id: userId,
                        full_name: user.fullName,
                        email: user.email.toLowerCase(),
                        role_id: roleId,
                        region_id: regionId,
                        designation: user.designation,
                        phone: user.phone,
                        password_hash: userPasswordHash,
                        is_active: true,
                        role: legacyRole,
                        organization: user.organization || 'benz_packaging',
                        companies: user.companies || ['benz']
                    }, {
                        onConflict: 'email',
                        ignoreDuplicates: false
                    })
                    .select('user_id, email, full_name')
                    .single();

                if (error) {
                    results.push({ email: user.email, status: 'error', message: error.message });
                } else {
                    results.push({ email: user.email, status: 'success', userId: data.user_id });
                }
            } catch (err) {
                results.push({ email: user.email, status: 'error', message: err.message });
            }
        }

        const successCount = results.filter(r => r.status === 'success').length;

        return NextResponse.json({
            success: true,
            message: `Seeded ${successCount}/${DEFAULT_USERS.length} users`,
            defaultPassword: DEFAULT_PASSWORD,
            results
        });

    } catch (error) {
        console.error('Seed users error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
