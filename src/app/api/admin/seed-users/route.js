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

        const SEED_ROLES = [
            { name: 'developer', display_name: 'Developer', level: 100 },
            { name: 'director', display_name: 'Director', level: 90 },
            { name: 'head_of_sales', display_name: 'Head of Sales', level: 80 },
            { name: 'asm', display_name: 'Area Sales Manager', level: 50 },
            { name: 'sales_executive', display_name: 'Sales Executive', level: 20 }
        ];

        const SEED_REGIONS = [
            { name: 'Gurgaon', code: 'DL' },
            { name: 'Madhya Pradesh', code: 'MP' },
            { name: 'Rajasthan', code: 'RJ' },
            { name: 'Karnataka', code: 'KA' },
            { name: 'Maharashtra', code: 'MH' },
            { name: 'Noida', code: 'UP' },
            { name: 'West Zone', code: 'WZ' }
        ];

        const supabase = createAdminClient();
        const results = [];
        const passwordHash = await hashPassword(DEFAULT_PASSWORD);

        // 1. Seed Roles
        const { error: rolesError } = await supabase
            .from('roles')
            .upsert(SEED_ROLES, { onConflict: 'name' });

        if (rolesError) console.error('Error seeding roles:', rolesError);

        // 2. Seed Regions
        const { error: regionsError } = await supabase
            .from('regions')
            .upsert(SEED_REGIONS, { onConflict: 'name' });

        if (regionsError) console.error('Error seeding regions:', regionsError);

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

        // 0. Fetch existing Auth Users to prevent duplicates
        // Note: listUsers defaults to 50, need pagination if many users, but for seeding 12 it's fine
        const { data: { users: authUsers }, error: authListError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 });
        const authUserMap = {};
        if (authUsers) {
            authUsers.forEach(u => {
                if (u.email) authUserMap[u.email.toLowerCase()] = u.id;
            });
        }

        for (const user of DEFAULT_USERS) {
            try {
                const email = user.email.toLowerCase();
                let userId = authUserMap[email];
                const userPassword = user.customPassword || DEFAULT_PASSWORD;

                if (!userId) {
                    // Create Auth User
                    const { data: newData, error: createError } = await supabase.auth.admin.createUser({
                        email: email,
                        password: userPassword,
                        email_confirm: true,
                        user_metadata: { full_name: user.fullName }
                    });

                    if (createError) {
                        // If error says 'already registered', try to find it (race condition) or skip
                        // But we listed them above. So mainly other errors.
                        results.push({ email, status: 'error', message: `Auth Create Error: ${createError.message}` });
                        continue;
                    }
                    userId = newData.user.id;
                } else {
                    // Optional: Update password for existing users to ensure access
                    // await supabase.auth.admin.updateUserById(userId, { password: userPassword });
                }

                const roleId = roleMap[user.roleName];
                const regionId = user.regionName ? regionMap[user.regionName] : null;

                const legacyRole = user.roleName === 'developer' ? 'vp'
                    : user.roleName === 'director' ? 'director'
                        : user.roleName === 'head_of_sales' ? 'director'
                            : 'asm';

                const userPasswordHash = await hashPassword(userPassword);

                const { data, error } = await supabase
                    .from('profiles')
                    .upsert({
                        user_id: userId,
                        full_name: user.fullName,
                        email: email,
                        role_id: roleId,
                        region_id: regionId,
                        designation: user.designation,
                        phone: user.phone,
                        password_hash: userPasswordHash, // Keep profile hash for app-level checks if needed
                        is_active: true,
                        role: legacyRole, // legacy fallback
                        organization: user.organization || 'benz_packaging',
                        companies: user.companies || ['benz']
                    }, {
                        onConflict: 'email',
                        ignoreDuplicates: false
                    })
                    .select('*') // Return all cols to inspect schema
                    .single();

                // Speculative sync to public.users (if it exists) to satisfy legacy FKs
                let legacySyncError = null;
                try {
                    await supabase.from('users').upsert({
                        id: userId,
                        email: email,
                        full_name: user.fullName,
                        avatar_url: '',
                    }, { onConflict: 'id' });
                } catch (legacyErr) {
                    legacySyncError = legacyErr.message;
                }

                if (error) {
                    results.push({ email: user.email, status: 'error', message: error.message });
                } else {
                    results.push({
                        email: user.email,
                        status: 'success',
                        userId: data.user_id,
                        profileKeys: Object.keys(data),
                        legacySyncError
                    });
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
