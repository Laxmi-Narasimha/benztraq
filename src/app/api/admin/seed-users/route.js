/**
 * Seed Users API Route
 * Seeds the default users into the database
 * 
 * POST /api/admin/seed-users
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { hashPassword } from '@/lib/utils/password';

const DEFAULT_PASSWORD = 'Benz@2024';
const CHOPRA_PASSWORD = 'Hound@1102';

const DEFAULT_USERS = [
    {
        email: 'laxmi@benz-packaging.com',
        fullName: 'Laxmi',
        roleName: 'developer',
        designation: 'System Developer',
        phone: null,
        regionName: null,
        organization: 'benz_packaging',
        companies: ['benz', 'ergopack']  // Full access
    },
    // Directors - Full access to both companies (Custom password)
    {
        email: 'manan@benz-packaging.com',
        fullName: 'Manan',
        roleName: 'director',
        designation: 'Director',
        phone: null,
        regionName: null,
        organization: 'benz_packaging',
        companies: ['benz', 'ergopack'],
        customPassword: CHOPRA_PASSWORD
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
        customPassword: CHOPRA_PASSWORD
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
        customPassword: CHOPRA_PASSWORD
    },
    // Lokesh - Ergopack only
    {
        email: 'lokesh@benz-packaging.com',
        fullName: 'Lokesh',
        roleName: 'head_of_sales',
        designation: 'VP Operations',
        phone: null,
        regionName: null,
        organization: 'ergopack_india',
        companies: ['ergopack']  // Ergopack only
    },
    // Pulak - Benz only, Head of Sales
    {
        email: 'pulak@benz-packaging.com',
        fullName: 'Pulak Biswas',
        roleName: 'head_of_sales',
        designation: 'Head of Sales',
        phone: null,
        regionName: 'Gurgaon',
        organization: 'benz_packaging',
        companies: ['benz']  // Benz only
    },
    // ASMs - 6 Location-based users (Benz only)
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
        // No auth check needed for seeding - this is for initial setup only
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

                // Map role to legacy user_role enum
                const legacyRole = user.roleName === 'developer' ? 'vp'
                    : user.roleName === 'director' ? 'director'
                        : user.roleName === 'head_of_sales' ? 'director'
                            : 'asm';

                // Use custom password if defined, otherwise use default
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
                        companies: user.companies || ['benz']  // Add companies array
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
