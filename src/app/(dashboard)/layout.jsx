/**
 * Dashboard Layout
 * 
 * Layout wrapper for all authenticated dashboard pages.
 * Provides the sidebar, topbar, and main content area.
 * 
 * @module app/(dashboard)/layout
 */

'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { AppLayout } from '@/components/layout';
import { useAuth } from '@/providers/auth-provider';
import { PageSkeleton } from '@/components/common';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({ children }) {
    const { isLoading, isAuthenticated } = useAuth();

    // Show loading state while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-pulse text-muted-foreground">
                    Loading...
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isLoading && !isAuthenticated) {
        redirect('/login');
    }

    return <AppLayout>{children}</AppLayout>;
}

