/**
 * Authentication Utilities
 * 
 * Helper functions for authentication in API routes.
 * 
 * @module lib/auth
 */

import { createClient } from '@/lib/supabase/server';

/**
 * Get the current authenticated user from request context.
 * Uses Supabase session to validate the user.
 * 
 * @param {Request} request - The incoming request object
 * @returns {Promise<{id: string, email: string, profile: object} | null>} The user object or null if not authenticated
 */
export async function getUserFromRequest(request) {
    try {
        const supabase = await createClient();

        // Get the user from the session
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return null;
        }

        // Optionally fetch the user's profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('*, role:roles(id, name)')
            .eq('user_id', user.id)
            .single();

        return {
            id: user.id,
            email: user.email,
            profile: profile || null
        };
    } catch (error) {
        console.error('getUserFromRequest error:', error);
        return null;
    }
}

/**
 * Check if a user has a specific role.
 * 
 * @param {object} user - The user object from getUserFromRequest
 * @param {string[]} roles - Array of role names to check
 * @returns {boolean} True if user has any of the specified roles
 */
export function userHasRole(user, roles) {
    if (!user || !user.profile || !user.profile.role) {
        return false;
    }
    return roles.includes(user.profile.role.name);
}

/**
 * Check if a user is an admin (VP, Director, Developer)
 * 
 * @param {object} user - The user object from getUserFromRequest
 * @returns {boolean} True if user is an admin
 */
export function isAdmin(user) {
    return userHasRole(user, ['vp', 'director', 'developer']);
}

/**
 * Get session for API routes (alias for getUserFromRequest)
 * Returns user object with role property for RBAC checks
 * 
 * @returns {Promise<{user: object} | null>} Session with user or null
 */
export async function getSession() {
    try {
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return null;
        }

        // Fetch the user's profile with role
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

        return {
            user: {
                id: user.id,
                email: user.email,
                role: profile?.role || 'asm',
                full_name: profile?.full_name,
                ...profile
            }
        };
    } catch (error) {
        console.error('getSession error:', error);
        return null;
    }
}

