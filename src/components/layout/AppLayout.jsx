/**
 * App Layout Component
 * 
 * Main application layout with sidebar and content area.
 * - Directors: NO sidebar on any page. Shows a minimal top bar with grid-launcher button.
 * - Store Managers: NO sidebar. Minimal top bar linking back to /inventory.
 * - Other roles: Standard sidebar + topbar layout.
 * - Tasks/Inventory pages: Full-width (no container cap).
 * 
 * @module components/layout/AppLayout
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { LayoutGrid, LogOut, Warehouse } from 'lucide-react';

/**
 * Minimal director top bar — replaces full sidebar for directors.
 * Shows logo, current page breadcrumb, and grid-launcher button.
 */
function DirectorTopBar() {
    const pathname = usePathname();
    const { profile, signOut } = useAuth();
    const [isSigningOut, setIsSigningOut] = useState(false);

    // Derive page name from pathname
    const getPageName = () => {
        const segments = pathname.split('/').filter(Boolean);
        if (segments.length === 0) return 'Home';
        const last = segments[segments.length - 1];
        return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ');
    };

    const handleSignOut = async () => {
        setIsSigningOut(true);
        await signOut();
    };

    return (
        <div className="flex items-center justify-between px-6 h-14 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md flex-shrink-0">
            {/* Left: Grid button + Logo + Breadcrumb */}
            <div className="flex items-center gap-3">
                <Link
                    href="/dashboard"
                    className="flex items-center justify-center w-9 h-9 rounded-lg bg-neutral-900 hover:bg-neutral-800 transition-colors shadow-sm"
                    title="Back to App Launcher"
                >
                    <LayoutGrid className="w-4.5 h-4.5 text-white" />
                </Link>
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-bold text-neutral-900 dark:text-white tracking-tight">BENZERP</span>
                    <span className="text-neutral-300 dark:text-neutral-600">·</span>
                    <span className="text-neutral-500 dark:text-neutral-400 font-medium">{getPageName()}</span>
                </div>
            </div>

            {/* Right: User info + Sign out */}
            <div className="flex items-center gap-4">
                {profile && (
                    <span className="text-xs text-neutral-400 font-medium hidden sm:inline">
                        {profile.full_name}
                    </span>
                )}
                <button
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-all"
                >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isSigningOut ? 'Signing out…' : 'Sign Out'}</span>
                </button>
            </div>
        </div>
    );
}

/**
 * Minimal store manager top bar — replaces full sidebar for store managers.
 * Shows logo, current page breadcrumb, and a back-to-inventory button.
 */
function StoreTopBar() {
    const pathname = usePathname();
    const { profile, signOut } = useAuth();
    const [isSigningOut, setIsSigningOut] = useState(false);

    const getPageName = () => {
        const segments = pathname.split('/').filter(Boolean);
        if (segments.length === 0) return 'Inventory';
        const last = segments[segments.length - 1];
        // Decode URI and clean up
        const decoded = decodeURIComponent(last);
        return decoded.charAt(0).toUpperCase() + decoded.slice(1).replace(/-/g, ' ');
    };

    const handleSignOut = async () => {
        setIsSigningOut(true);
        await signOut();
    };

    return (
        <div className="flex items-center justify-between px-6 h-14 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md flex-shrink-0">
            {/* Left: Inventory home button + Breadcrumb */}
            <div className="flex items-center gap-3">
                <Link
                    href="/inventory"
                    className="flex items-center justify-center w-9 h-9 rounded-lg bg-neutral-900 hover:bg-neutral-800 transition-colors shadow-sm"
                    title="Back to Inventory"
                >
                    <Warehouse className="w-4.5 h-4.5 text-white" />
                </Link>
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-bold text-neutral-900 dark:text-white tracking-tight">BENZERP</span>
                    <span className="text-neutral-300 dark:text-neutral-600">·</span>
                    <span className="text-neutral-500 dark:text-neutral-400 font-medium">{getPageName()}</span>
                </div>
            </div>

            {/* Right: User info + Sign out */}
            <div className="flex items-center gap-4">
                {profile && (
                    <span className="text-xs text-neutral-400 font-medium hidden sm:inline">
                        {profile.full_name}
                    </span>
                )}
                <button
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-all"
                >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isSigningOut ? 'Signing out…' : 'Sign Out'}</span>
                </button>
            </div>
        </div>
    );
}

/**
 * AppLayout component.
 * Provides the main application structure with sidebar and content area.
 * Directors get no sidebar — just a minimal top bar with a grid-launcher button.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Page content
 * @param {string} [props.title] - Page title for the top bar
 * @param {React.ReactNode} [props.actions] - Additional action buttons for the top bar
 */
export function AppLayout({ children, title, actions }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { profile } = useAuth();
    const isTasksPage = pathname === '/tasks';
    const isInventoryPage = pathname.startsWith('/inventory');
    const isFullWidthPage = isTasksPage || isInventoryPage;
    const isDirector = profile?.role === 'director';
    const isStoreManager = profile?.role === 'store_manager';
    const [sidebarCollapsed, setSidebarCollapsed] = useState(isTasksPage);

    // Director on dashboard grid (no ?view=analytics) → full-screen grid, no chrome at all
    const isDashboard = pathname === '/dashboard' || pathname === '/';
    const viewMode = searchParams.get('view');
    const showDirectorGrid = isDirector && isDashboard && viewMode !== 'analytics';

    // Auto-collapse on tasks page
    useEffect(() => {
        if (isTasksPage) setSidebarCollapsed(true);
    }, [isTasksPage]);

    // ── Director: App Grid (full-screen, no top bar) ──
    if (showDirectorGrid) {
        return (
            <div className="h-screen overflow-y-auto bg-background">
                {children}
            </div>
        );
    }

    // ── Director: All other pages (no sidebar, minimal top bar with grid button) ──
    if (isDirector) {
        return (
            <div className="flex flex-col h-screen overflow-hidden bg-background">
                <DirectorTopBar />
                <main className={cn("flex-1 overflow-hidden", !isFullWidthPage && "overflow-y-auto")}>
                    {isFullWidthPage ? (
                        children
                    ) : (
                        <div className="container py-6 px-6 max-w-7xl mx-auto">
                            {children}
                        </div>
                    )}
                </main>
            </div>
        );
    }

    // ── Store Manager: No sidebar, minimal top bar linking to inventory ──
    if (isStoreManager) {
        return (
            <div className="flex flex-col h-screen overflow-hidden bg-background">
                <StoreTopBar />
                <main className="flex-1 overflow-hidden overflow-y-auto">
                    {children}
                </main>
            </div>
        );
    }

    // ── Other roles: Standard sidebar + topbar ──
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <TopBar title={title} actions={actions} />
                <main className={cn("flex-1 overflow-hidden", !isFullWidthPage && "overflow-y-auto")}>
                    {isFullWidthPage ? (
                        children
                    ) : (
                        <div className="container py-6 px-6 max-w-7xl mx-auto">
                            {children}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
