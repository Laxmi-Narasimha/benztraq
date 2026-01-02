/**
 * Admin Users API Route
 * CRUD operations for user management
 * 
 * GET /api/admin/users - List all users
 * POST /api/admin/users - Create new user
 * PUT /api/admin/users - Update user
 * DELETE /api/admin/users - Delete user
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/utils/session';
import { hashPassword } from '@/lib/utils/password';

// Check if user has admin access
async function checkAdminAccess() {
    const user = await getCurrentUser();
    if (!user) {
        return { allowed: false, error: 'Not authenticated', status: 401 };
    }

    // Only developers can manage users
    if (user.role !== 'developer') {
        return { allowed: false, error: 'Access denied. Admin privileges required.', status: 403 };
    }

    return { allowed: true, user };
}

/**
 * GET - List all users with their roles and permissions
 */
export async function GET() {
    try {
        const access = await checkAdminAccess();
        if (!access.allowed) {
            return NextResponse.json({ error: access.error }, { status: access.status });
        }

        const supabase = createAdminClient();

        const { data: users, error } = await supabase
            .from('profiles')
            .select(`
        user_id,
        full_name,
        email,
        phone,
        designation,
        is_active,
        last_login,
        login_count,
        created_at,
        updated_at,
        roles (
          id,
          name,
          display_name,
          level
        ),
        regions (
          id,
          name
        ),
        manager:profiles!manager_id (
          user_id,
          full_name
        )
      `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error);
            return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
        }

        // Get user count by role
        const { data: roleCounts } = await supabase
            .from('profiles')
            .select('role_id, roles(name)')
            .not('role_id', 'is', null);

        const stats = {
            total: users?.length || 0,
            active: users?.filter(u => u.is_active).length || 0,
            byRole: {}
        };

        roleCounts?.forEach(r => {
            const roleName = r.roles?.name;
            if (roleName) {
                stats.byRole[roleName] = (stats.byRole[roleName] || 0) + 1;
            }
        });

        return NextResponse.json({ users, stats });

    } catch (error) {
        console.error('Users API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST - Create a new user
 */
export async function POST(request) {
    try {
        const access = await checkAdminAccess();
        if (!access.allowed) {
            return NextResponse.json({ error: access.error }, { status: access.status });
        }

        const body = await request.json();
        const { email, fullName, roleId, regionId, designation, phone, password } = body;

        if (!email || !fullName || !roleId) {
            return NextResponse.json(
                { error: 'Email, full name, and role are required' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Check if email already exists
        const { data: existing } = await supabase
            .from('profiles')
            .select('email')
            .eq('email', email.toLowerCase().trim())
            .single();

        if (existing) {
            return NextResponse.json(
                { error: 'A user with this email already exists' },
                { status: 400 }
            );
        }

        // Get role info for backwards compatibility and companies assignment
        const { data: role, error: roleError } = await supabase
            .from('roles')
            .select('name')
            .eq('id', roleId)
            .single();

        if (roleError || !role) {
            return NextResponse.json(
                { error: 'Invalid role ID' },
                { status: 400 }
            );
        }

        // Auto-assign companies based on role
        let companies = ['benz']; // Default
        if (role.name === 'developer' || role.name === 'director') {
            companies = ['benz', 'ergopack'];
        }

        // Map role name for backwards compatibility
        const legacyRole = role.name === 'developer' ? 'vp' :
            role.name === 'director' ? 'director' :
                role.name === 'head_of_sales' ? 'director' : 'asm';

        // Hash password if provided
        const passwordHash = password ? await hashPassword(password) : null;

        // Generate a new UUID for the user
        const userId = crypto.randomUUID();

        // Create profile
        const { data: newUser, error } = await supabase
            .from('profiles')
            .insert({
                user_id: userId,
                full_name: fullName,
                email: email.toLowerCase().trim(),
                role_id: roleId,
                region_id: regionId || null,
                designation: designation || null,
                phone: phone || null,
                password_hash: passwordHash,
                is_active: true,
                role: legacyRole,
                companies: companies
            })
            .select(`
        user_id,
        full_name,
        email,
        is_active,
        companies,
        roles (id, name, display_name),
        regions (id, name)
      `)
            .single();

        if (error) {
            console.error('Error creating user:', error);
            return NextResponse.json({
                error: 'Failed to create user',
                details: error.message
            }, { status: 500 });
        }

        // Log activity
        await supabase
            .from('activity_log')
            .insert({
                user_id: access.user.id,
                action: 'create_user',
                resource_type: 'users',
                resource_id: userId,
                details: { email, fullName, role: role?.name, companies }
            });

        return NextResponse.json({ user: newUser, success: true });

    } catch (error) {
        console.error('Create user error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}

/**
 * PUT - Update an existing user
 */
export async function PUT(request) {
    try {
        const access = await checkAdminAccess();
        if (!access.allowed) {
            return NextResponse.json({ error: access.error }, { status: access.status });
        }

        const body = await request.json();
        const { userId, fullName, roleId, regionId, designation, phone, isActive, password } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Build update object
        const updates = {};
        if (fullName !== undefined) updates.full_name = fullName;
        if (roleId !== undefined) updates.role_id = roleId;
        if (regionId !== undefined) updates.region_id = regionId;
        if (designation !== undefined) updates.designation = designation;
        if (phone !== undefined) updates.phone = phone;
        if (isActive !== undefined) updates.is_active = isActive;
        if (password) updates.password_hash = await hashPassword(password);

        // Update role field for backwards compatibility
        if (roleId) {
            const { data: role } = await supabase
                .from('roles')
                .select('name')
                .eq('id', roleId)
                .single();

            if (role) {
                updates.role = role.name === 'developer' ? 'vp' : role.name === 'head_of_sales' ? 'director' : 'asm';
            }
        }

        const { data: updatedUser, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('user_id', userId)
            .select(`
        user_id,
        full_name,
        email,
        is_active,
        roles (id, name, display_name),
        regions (id, name)
      `)
            .single();

        if (error) {
            console.error('Error updating user:', error);
            return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
        }

        // Log activity
        await supabase
            .from('activity_log')
            .insert({
                user_id: access.user.id,
                action: 'update_user',
                resource_type: 'users',
                resource_id: userId,
                details: { updates: Object.keys(updates) }
            });

        return NextResponse.json({ user: updatedUser, success: true });

    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE - Delete a user
 */
export async function DELETE(request) {
    try {
        const access = await checkAdminAccess();
        if (!access.allowed) {
            return NextResponse.json({ error: access.error }, { status: access.status });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Prevent self-deletion
        if (userId === access.user.id) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Get user info before deletion
        const { data: userToDelete } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('user_id', userId)
            .single();

        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('user_id', userId);

        if (error) {
            console.error('Error deleting user:', error);
            return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
        }

        // Log activity
        await supabase
            .from('activity_log')
            .insert({
                user_id: access.user.id,
                action: 'delete_user',
                resource_type: 'users',
                resource_id: userId,
                details: { email: userToDelete?.email, fullName: userToDelete?.full_name }
            });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
