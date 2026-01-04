/**
 * Login API Route
 * Handles email/password authentication
 * 
 * POST /api/auth/login
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyPassword, hashPassword } from '@/lib/utils/password';
import { createToken, setSessionCookie } from '@/lib/utils/session';

// Default password for new users (first login will require change)
const DEFAULT_PASSWORD = 'Benz@2024';

export async function POST(request) {
    try {
        const { email, password, selectedCompany } = await request.json();

        console.log('[Auth] Login attempt starting for:', email, 'Company:', selectedCompany);

        if (!email || !password) {
            console.log('[Auth] Missing credentials');
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();
        let profile = null;
        let passwordValid = false;
        let roles = null;
        let permissionsMap = {};

        // 1. Database Lookup (Primary)
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('user_id, full_name, email, password_hash, is_active, role_id, region_id, designation, organization, companies')
                .ilike('email', email.trim())
                .single();

            if (data && !error) {
                profile = data;
                console.log('[Auth] Profile found in DB:', profile.user_id, 'Org:', profile.organization);
            } else {
                console.log('[Auth] Database lookup failed or returned no user:', error?.message);
                return NextResponse.json(
                    { error: 'Invalid email or password' },
                    { status: 401 }
                );
            }
        } catch (dbError) {
            console.error('[Auth] Database connection exception:', dbError);
            return NextResponse.json(
                { error: 'Internal server error' },
                { status: 500 }
            );
        }

        // 2. Authentication Logic
        if (profile) {
            // Check if active
            if (!profile.is_active) {
                console.warn('[Auth] Inactive account attempted login:', profile.email);
                return NextResponse.json(
                    { error: 'Account is inactive. Please contact administrator.' },
                    { status: 403 }
                );
            }

            // Fetch role
            if (profile.role_id) {
                const { data: role } = await supabase
                    .from('roles')
                    .select('id, name, display_name, level')
                    .eq('id', profile.role_id)
                    .single();
                roles = role;
            }
            profile.roles = roles;

            // Check password
            if (profile.password_hash) {
                passwordValid = await verifyPassword(password, profile.password_hash);
            } else if (password === DEFAULT_PASSWORD) {
                // First login
                console.log('[Auth] First time login detected');
                passwordValid = true;
                const hashedPassword = await hashPassword(DEFAULT_PASSWORD);
                await supabase.from('profiles').update({ password_hash: hashedPassword }).eq('user_id', profile.user_id);
            }

            // Get permissions
            const { data: permissions } = await supabase
                .from('permissions')
                .select('resource, can_read, can_write, can_create, can_delete, scope')
                .eq('role_id', profile.role_id);

            permissions?.forEach(p => {
                permissionsMap[p.resource] = {
                    read: p.can_read,
                    write: p.can_write,
                    create: p.can_create,
                    delete: p.can_delete,
                    scope: p.scope
                };
            });
        }

        console.log('[Auth] Password validation result:', passwordValid);

        if (!passwordValid) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // 3. Company Access Validation
        if (selectedCompany) {
            const userCompanies = profile.companies || [];

            // Map frontend company selection to DB values
            const companyMapping = {
                'benz': 'benz',
                'ergopack': 'ergopack',
                'benz_packaging': 'benz',
                'ergopack_india': 'ergopack'
            };

            const normalizedSelection = companyMapping[selectedCompany] || selectedCompany;

            // Check if user has access to selected company
            if (userCompanies.length > 0 && !userCompanies.includes(normalizedSelection)) {
                console.warn('[Auth] Company access denied for:', profile.email, 'Tried:', selectedCompany, 'Allowed:', userCompanies);
                return NextResponse.json(
                    { error: 'Access restricted. You don\'t have permission to access this company. Please select a different company.' },
                    { status: 403 }
                );
            }

            console.log('[Auth] Company access granted:', normalizedSelection);
        }

        // Create session token (Include Organization)
        const token = await createToken({
            sub: profile.user_id,
            email: profile.email,
            full_name: profile.full_name,
            role: profile.roles?.name,
            role_id: profile.role_id,
            role_level: profile.roles?.level,
            permissions: permissionsMap,
            organization: profile.organization || 'benz_packaging', // Default to benz if missing
        });

        // Set session cookie
        await setSessionCookie(token);

        console.log('[Auth] Login successful for:', profile.email);

        return NextResponse.json({
            success: true,
            user: {
                id: profile.user_id,
                email: profile.email,
                fullName: profile.full_name,
                role: profile.roles?.name,
                roleDisplay: profile.roles?.display_name,
                roleLevel: profile.roles?.level,
                designation: profile.designation,
                organization: profile.organization,
                permissions: permissionsMap,
                needsPasswordChange: !profile.password_hash,
            }
        });

    } catch (error) {
        console.error('[Auth] Login error exception:', error);
        return NextResponse.json(
            { error: 'An error occurred during login' },
            { status: 500 }
        );
    }
}
