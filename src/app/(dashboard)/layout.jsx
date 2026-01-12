/**
 * Dashboard Layout
 * 
 * Layout wrapper for all authenticated dashboard pages.
 * Provides the sidebar, topbar, and main content area.
 * Shows development banner on all pages.
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
import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Development Banner Component
 * Shows a dismissible warning banner at the top of all dashboard pages
 */
function DevelopmentBanner() {
    const [isVisible, setIsVisible] = useState(true);

    // Check if banner was dismissed in this session
    useEffect(() => {
        const dismissed = sessionStorage.getItem('devBannerDismissed');
        if (dismissed === 'true') {
            setIsVisible(false);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        sessionStorage.setItem('devBannerDismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium relative">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span className="text-center">
                🚧 Development in progress with more reliable features and workflows. If the system breaks anywhere, do not worry. 🚧
            </span>
            <button
                onClick={handleDismiss}
                className="absolute right-2 p-1 hover:bg-amber-600 rounded-sm transition-colors"
                aria-label="Dismiss banner"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

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

    return (
        <>
            <DevelopmentBanner />
            <AppLayout>{children}</AppLayout>
        </>
    );
}
