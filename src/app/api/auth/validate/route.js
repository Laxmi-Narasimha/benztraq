/**
 * Validate Credentials API Route
 * Checks email/password WITHOUT creating a session.
 * Returns user data including companies array for the login flow.
 * 
 * POST /api/auth/validate
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyPassword, hashPassword } from '@/lib/utils/password';

const DEFAULT_PASSWORD = 'Benz@2024';

export async function POST(request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Lookup profile
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('user_id, full_name, email, password_hash, is_active, role_id, organization, companies')
            .ilike('email', email.trim())
            .single();

        if (!profile || error) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        if (!profile.is_active) {
            return NextResponse.json(
                { error: 'Account is inactive. Please contact administrator.' },
                { status: 403 }
            );
        }

        // Verify password
        let passwordValid = false;
        if (profile.password_hash) {
            passwordValid = await verifyPassword(password, profile.password_hash);
        } else if (password === DEFAULT_PASSWORD) {
            passwordValid = true;
            const hashedPassword = await hashPassword(DEFAULT_PASSWORD);
            await supabase.from('profiles').update({ password_hash: hashedPassword }).eq('user_id', profile.user_id);
        }

        if (!passwordValid) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Get role name
        let roleName = 'asm';
        if (profile.role_id) {
            const { data: role } = await supabase
                .from('roles')
                .select('name, display_name')
                .eq('id', profile.role_id)
                .single();
            if (role) roleName = role.name;
        }

        // Return user data (NO session created yet)
        return NextResponse.json({
            success: true,
            user: {
                id: profile.user_id,
                email: profile.email,
                fullName: profile.full_name,
                role: roleName,
                organization: profile.organization,
                companies: profile.companies || [],
            }
        });

    } catch (error) {
        console.error('[Auth] Validate error:', error);
        return NextResponse.json(
            { error: 'An error occurred during validation' },
            { status: 500 }
        );
    }
}
