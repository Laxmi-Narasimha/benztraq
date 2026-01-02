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

const DEFAULT_USERS = [
    {
        email: 'laxmi@benz-packaging.com',
        fullName: 'Developer Admin',
        roleName: 'developer',
        designation: 'System Developer',
        phone: null,
        regionName: null
    },
    {
        email: 'pulak@benz-packaging.com',
        fullName: 'Pulak Biswas',
        roleName: 'head_of_sales',
        designation: 'Head of Sales',
        phone: null,
        regionName: 'Gurgaon'
    },
    {
        email: 'abhishek@benz-packaging.com',
        fullName: 'Abhishek',
        roleName: 'asm',
        designation: 'Area Sales Manager',
        phone: null,
        regionName: 'Gurgaon'
    },
    {
        email: 'wh.jaipur@benz-packaging.com',
        fullName: 'Mani Bhushan',
        roleName: 'asm',
        designation: 'Area Sales Manager',
        phone: null,
        regionName: 'Jaipur'
    },
    {
        email: 'asm1@benz-packaging.com',
        fullName: 'Sales Manager 1',
        roleName: 'asm',
        designation: 'Area Sales Manager',
        phone: null,
        regionName: 'Maharashtra'
    },
    {
        email: 'asm2@benz-packaging.com',
        fullName: 'Sales Manager 2',
        roleName: 'asm',
        designation: 'Area Sales Manager',
        phone: null,
        regionName: 'Chennai'
    },
    {
        email: 'asm3@benz-packaging.com',
        fullName: 'Sales Manager 3',
        roleName: 'asm',
        designation: 'Area Sales Manager',
        phone: null,
        regionName: 'Indore'
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
                    : user.roleName === 'head_of_sales' ? 'director'
                        : 'asm';

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
                        password_hash: passwordHash,
                        is_active: true,
                        role: legacyRole
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
