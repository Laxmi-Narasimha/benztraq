/**
 * Middleware - Route Protection and Role-Based Access
 * 
 * Protects routes based on:
 * - Authentication (must be logged in for dashboard routes)
 * - Role (ASM restricted from analytics)
 * - Company (validates access based on user's companies array)
 */

import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-secret-key'
);

const SESSION_COOKIE_NAME = 'benztraq_session';

// Specific emails allowed to access the inventory module
const INVENTORY_ACCESS_EMAILS = [
    'store@benz-packaging.com',
    'laxmi@benz-packaging.com',
    'chaitanya@benz-packaging.com',
    'warehouse@benz-packaging.com',
    'bhandari@benz-packaging.com',
    'it@benz-packaging.com',
    'manan@benz-packaging.com',
];

// Routes that require authentication
const PROTECTED_ROUTES = [
    '/dashboard',
    '/documents',
    '/comparison',
    '/targets',
    '/admin',
    '/ergopack',
    '/inventory',
    '/tasks',
];

// Routes that ASM cannot access
const ASM_RESTRICTED_ROUTES = [
    '/comparison',
    '/admin',
];

// Routes that store_manager CAN access (all others redirect to /inventory)
const STORE_MANAGER_ALLOWED = [
    '/inventory',
];

async function getSession(request) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        return payload;
    } catch {
        return null;
    }
}

export async function middleware(request) {
    const { pathname } = request.nextUrl;

    // Skip middleware for API routes, static files, and public routes
    if (
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/login') ||
        pathname === '/' ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // Check if this is a protected route
    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

    if (!isProtectedRoute) {
        return NextResponse.next();
    }

    // Get user session
    const session = await getSession(request);

    // Not authenticated - redirect to login
    if (!session) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(loginUrl);
    }

    const userRole = session.role || 'asm';
    const isASM = userRole === 'asm';
    const isDeveloper = userRole === 'developer';
    const isDirector = userRole === 'director';

    // Get user's organization from session
    const userOrganization = session.organization || 'benz_packaging';

    // Store manager restrictions - can ONLY access inventory
    if (userRole === 'store_manager') {
        const isAllowed = STORE_MANAGER_ALLOWED.some(route => pathname.startsWith(route));
        if (!isAllowed) {
            return NextResponse.redirect(new URL('/inventory', request.url));
        }
    }

    // ASM restrictions (comparison, admin, AND inventory - completely hidden from ASMs)
    if (isASM) {
        if (pathname.startsWith('/inventory')) {
            return NextResponse.redirect(new URL('/dashboard?access=denied', request.url));
        }
        const isASMRestricted = ASM_RESTRICTED_ROUTES.some(route => pathname.startsWith(route));
        if (isASMRestricted) {
            return NextResponse.redirect(new URL('/dashboard?access=denied', request.url));
        }
    }

    // Inventory access — only allowed for specific emails
    if (pathname.startsWith('/inventory')) {
        const userEmail = (session.email || '').toLowerCase();
        const hasInventoryAccess = INVENTORY_ACCESS_EMAILS.includes(userEmail) || isDeveloper;
        if (!hasInventoryAccess) {
            return NextResponse.redirect(new URL('/dashboard?access=denied', request.url));
        }
    }

    // Ergopack access - based on organization, NOT role
    // Users with ergopack_india organization can access /ergopack
    // Directors and developers can also access regardless of org
    if (pathname.startsWith('/ergopack')) {
        const hasErgopackAccess =
            userOrganization === 'ergopack_india' ||
            isDeveloper ||
            isDirector;

        if (!hasErgopackAccess) {
            return NextResponse.redirect(new URL('/dashboard?access=denied', request.url));
        }
    }

    // Admin routes - only developers
    if (pathname.startsWith('/admin') && userRole !== 'developer' && userRole !== 'director') {
        return NextResponse.redirect(new URL('/dashboard?access=denied', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
