/**
 * Admin Roles API Route
 * Manage roles and their permissions
 * 
 * GET /api/admin/roles - List all roles with permissions
 * PUT /api/admin/roles - Update role permissions
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/utils/session';

// Check if user has admin access
async function checkAdminAccess() {
    const user = await getCurrentUser();
    if (!user) {
        return { allowed: false, error: 'Not authenticated', status: 401 };
    }

    // Only developers can manage roles
    if (user.role !== 'developer') {
        return { allowed: false, error: 'Access denied. Admin privileges required.', status: 403 };
    }

    return { allowed: true, user };
}

/**
 * GET - List all roles with their permissions
 */
export async function GET() {
    try {
        const access = await checkAdminAccess();
        if (!access.allowed) {
            return NextResponse.json({ error: access.error }, { status: access.status });
        }

        const supabase = createAdminClient();

        // Get all roles
        const { data: roles, error: rolesError } = await supabase
            .from('roles')
            .select('*')
            .order('level', { ascending: false });

        if (rolesError) {
            console.error('Error fetching roles:', rolesError);
            return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
        }

        // Get all permissions
        const { data: permissions, error: permError } = await supabase
            .from('permissions')
            .select('*');

        if (permError) {
            console.error('Error fetching permissions:', permError);
            return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
        }

        // Group permissions by role
        const rolesWithPermissions = roles.map(role => ({
            ...role,
            permissions: permissions.filter(p => p.role_id === role.id)
        }));

        // Get unique resources
        const resources = [...new Set(permissions.map(p => p.resource))].sort();

        return NextResponse.json({ roles: rolesWithPermissions, resources });

    } catch (error) {
        console.error('Roles API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PUT - Update role permissions
 */
export async function PUT(request) {
    try {
        const access = await checkAdminAccess();
        if (!access.allowed) {
            return NextResponse.json({ error: access.error }, { status: access.status });
        }

        const body = await request.json();
        const { roleId, permissions } = body;

        if (!roleId || !permissions) {
            return NextResponse.json(
                { error: 'Role ID and permissions are required' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Check if role is system role
        const { data: role } = await supabase
            .from('roles')
            .select('is_system, name')
            .eq('id', roleId)
            .single();

        // Prevent modifying developer role permissions
        if (role?.name === 'developer') {
            return NextResponse.json(
                { error: 'Cannot modify developer role permissions' },
                { status: 400 }
            );
        }

        // Update permissions for each resource
        for (const perm of permissions) {
            const { error } = await supabase
                .from('permissions')
                .upsert({
                    role_id: roleId,
                    resource: perm.resource,
                    can_read: perm.can_read,
                    can_write: perm.can_write,
                    can_create: perm.can_create,
                    can_delete: perm.can_delete,
                    scope: perm.scope || 'own'
                }, {
                    onConflict: 'role_id,resource'
                });

            if (error) {
                console.error('Error updating permission:', error);
            }
        }

        // Log activity
        await supabase
            .from('activity_log')
            .insert({
                user_id: access.user.id,
                action: 'update_permissions',
                resource_type: 'roles',
                resource_id: roleId,
                details: { role: role?.name, permissionsUpdated: permissions.length }
            });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Update permissions error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
