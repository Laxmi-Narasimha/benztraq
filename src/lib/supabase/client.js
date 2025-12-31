/**
 * Supabase Browser Client
 * 
 * Creates a Supabase client for browser-side operations.
 * Uses singleton pattern to ensure single instance across the application.
 * 
 * @module lib/supabase/client
 */

import { createBrowserClient } from '@supabase/ssr';

/**
 * Singleton instance of the Supabase browser client.
 * @type {import('@supabase/supabase-js').SupabaseClient | null}
 */
let supabaseInstance = null;

/**
 * Creates and returns a singleton Supabase client for browser usage.
 * This client is configured with the public URL and anonymous key.
 * 
 * @returns {import('@supabase/supabase-js').SupabaseClient | null} The Supabase client instance
 */
export function createClient() {
  // Return null during SSR if env vars are missing
  if (typeof window === 'undefined') {
    return null;
  }

  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not configured');
    return null;
  }

  supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);

  return supabaseInstance;
}

/**
 * Returns the singleton Supabase client instance.
 * Use this when you need direct access to the client.
 * 
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function getSupabaseClient() {
  return createClient();
}
