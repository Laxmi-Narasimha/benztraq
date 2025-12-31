/**
 * Supabase Server Client
 * 
 * Creates a Supabase client for server-side operations (API routes, server components).
 * Handles cookie management for authentication state persistence.
 * 
 * @module lib/supabase/server
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client for server-side usage.
 * This client manages authentication cookies automatically.
 * 
 * @returns {Promise<import('@supabase/supabase-js').SupabaseClient>} The Supabase server client
 * @throws {Error} If environment variables are not configured
 */
export async function createClient() {
    const cookieStore = await cookies();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
            'Missing Supabase environment variables. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
        );
    }

    return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options);
                    });
                } catch (error) {
                    // The `setAll` method is called from a Server Component.
                    // This can be ignored if you have middleware refreshing user sessions.
                }
            },
        },
    });
}

/**
 * Creates a Supabase admin client with service role privileges.
 * USE WITH CAUTION: This bypasses Row Level Security.
 * Only use for administrative operations that require elevated permissions.
 * 
 * @returns {import('@supabase/supabase-js').SupabaseClient} The Supabase admin client
 * @throws {Error} If service role key is not configured
 */
export function createAdminClient() {
    const { createClient: createSupabaseClient } = require('@supabase/supabase-js');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error(
            'Missing Supabase admin configuration. Please configure SUPABASE_SERVICE_ROLE_KEY'
        );
    }

    return createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
