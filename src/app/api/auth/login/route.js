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
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Find user profile by email
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select(`
        user_id,
        full_name,
        email,
        password_hash,
        is_active,
        role_id,
        region_id,
        designation,
        roles (
          id,
          name,
          display_name,
          level
        )
      `)
            .eq('email', email.toLowerCase().trim())
            .single();

        if (profileError || !profile) {
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

        // Check password
        let passwordValid = false;

        if (profile.password_hash) {
            // Verify against stored hash
            passwordValid = await verifyPassword(password, profile.password_hash);
        } else {
            // First login - check against default password
            if (password === DEFAULT_PASSWORD) {
                passwordValid = true;
                // Hash and store the default password
                const hashedPassword = await hashPassword(DEFAULT_PASSWORD);
                await supabase
                    .from('profiles')
                    .update({ password_hash: hashedPassword })
                    .eq('user_id', profile.user_id);
            }
        }

        if (!passwordValid) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Get user permissions
        const { data: permissions } = await supabase
            .from('permissions')
            .select('resource, can_read, can_write, can_create, can_delete, scope')
            .eq('role_id', profile.role_id);

        // Format permissions as object
        const permissionsMap = {};
        permissions?.forEach(p => {
            permissionsMap[p.resource] = {
                read: p.can_read,
                write: p.can_write,
                create: p.can_create,
                delete: p.can_delete,
                scope: p.scope
            };
        });

        // Update last login
        await supabase
            .from('profiles')
            .update({
                last_login: new Date().toISOString(),
                login_count: (profile.login_count || 0) + 1
            })
            .eq('user_id', profile.user_id);

        // Log activity
        await supabase
            .from('activity_log')
            .insert({
                user_id: profile.user_id,
                action: 'login',
                resource_type: 'auth',
                details: { email: profile.email }
            });

        // Create session token
        const token = await createToken({
            sub: profile.user_id,
            email: profile.email,
            full_name: profile.full_name,
            role: profile.roles?.name,
            role_id: profile.role_id,
            role_level: profile.roles?.level,
            permissions: permissionsMap,
        });

        // Set session cookie
        await setSessionCookie(token);

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
                permissions: permissionsMap,
                needsPasswordChange: !profile.password_hash,
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'An error occurred during login' },
            { status: 500 }
        );
    }
}
