/**
 * Supabase Middleware Client
 * 
 * Creates a Supabase client for use in Next.js middleware.
 * Manages session refresh and cookie updates during requests.
 * 
 * @module lib/supabase/middleware
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

/**
 * Updates the Supabase session in middleware.
 * This ensures authentication state is properly maintained across requests.
 * 
 * @param {import('next/server').NextRequest} request - The incoming request
 * @returns {Promise<NextResponse>} The response with updated cookies
 */
export async function updateSession(request) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        // Skip Supabase session update if not configured
        return supabaseResponse;
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                // Update cookies on the request
                cookiesToSet.forEach(({ name, value }) => {
                    request.cookies.set(name, value);
                });

                // Create a new response with updated cookies
                supabaseResponse = NextResponse.next({
                    request,
                });

                // Set cookies on the response
                cookiesToSet.forEach(({ name, value, options }) => {
                    supabaseResponse.cookies.set(name, value, options);
                });
            },
        },
    });

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make your application
    // vulnerable to security issues.
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Define protected routes
    const protectedRoutes = [
        '/dashboard',
        '/documents',
        '/performance',
        '/customers',
        '/products',
        '/regions',
        '/comparison',
        '/targets',
        '/reports',
        '/settings',
    ];

    const isProtectedRoute = protectedRoutes.some((route) =>
        request.nextUrl.pathname.startsWith(route)
    );

    // Redirect unauthenticated users to login for protected routes
    if (isProtectedRoute && !user) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirectTo', request.nextUrl.pathname);
        return NextResponse.redirect(url);
    }

    // Redirect authenticated users away from login page
    if (request.nextUrl.pathname === '/login' && user) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}
