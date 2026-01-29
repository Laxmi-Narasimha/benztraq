/**
 * Premium Sidebar Navigation Component
 * 
 * Modern, HubSpot/Notion-inspired sidebar with:
 * - Gradient icon containers
 * - Smooth animations and hover effects
 * - Premium user card with status indicator
 * - Section dividers with clean styling
 * - Active state with left accent border
 * 
 * @module components/layout/Sidebar
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAVIGATION_ITEMS } from '@/lib/constants';
import { useAuth } from '@/providers/auth-provider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    LayoutDashboard,
    FileText,
    Upload,
    GitCompare,
    Users,
    Package,
    MapPin,
    Target,
    BarChart3,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Shield,
    Plus,
    Sparkles,
    Search,
} from 'lucide-react';
import { formatInitials } from '@/lib/utils/formatting';
import { useState } from 'react';

/**
 * Icon mapping - Clean monochrome design
 * All icons use the same subtle styling, only active state gets accent color
 */
const IconConfig = {
    LayoutDashboard: { icon: LayoutDashboard },
    FileText: { icon: FileText },
    Upload: { icon: Upload },
    GitCompare: { icon: GitCompare },
    Users: { icon: Users },
    Package: { icon: Package },
    MapPin: { icon: MapPin },
    Target: { icon: Target },
    BarChart3: { icon: BarChart3 },
    Settings: { icon: Settings },
    Shield: { icon: Shield },
};

/**
 * Single Navigation Item Component - Pure B/W Design
 */
function NavItem({ item, collapsed, isActive }) {
    const config = IconConfig[item.icon] || { icon: LayoutDashboard };
    const Icon = config.icon;

    return (
        <Link
            href={item.href}
            className={cn(
                'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150',
                isActive
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100',
                collapsed && 'justify-center px-0'
            )}
            title={collapsed ? item.title : undefined}
        >
            {/* Icon */}
            <Icon className={cn(
                'flex-shrink-0 transition-colors duration-150',
                isActive
                    ? 'text-white dark:text-neutral-900'
                    : 'text-neutral-500 group-hover:text-neutral-700 dark:text-neutral-400 dark:group-hover:text-neutral-200',
                collapsed ? 'w-5 h-5' : 'w-4 h-4'
            )} />

            {/* Label */}
            {!collapsed && (
                <span className="truncate">{item.title}</span>
            )}

            {/* Badge */}
            {item.badge && !collapsed && (
                <span className="ml-auto text-xs font-medium px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300">
                    {item.badge}
                </span>
            )}
        </Link>
    );
}

/**
 * Navigation Section Component
 */
function NavSection({ section, collapsed, pathname }) {
    const { profile } = useAuth();

    const isItemVisible = (item) => {
        if (!item.roles) return true;
        if (!profile) return false;
        return item.roles.includes(profile.role);
    };

    const isActive = (href) => {
        if (href === '/dashboard') return pathname === href || pathname === '/';
        return pathname.startsWith(href);
    };

    const visibleItems = section.items.filter(isItemVisible);
    if (visibleItems.length === 0) return null;

    return (
        <div className="space-y-1">
            {/* Section Header */}
            {!collapsed && (
                <div className="flex items-center px-3 py-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500">
                        {section.title}
                    </span>
                    <span className="ml-2 flex-1 h-px bg-gradient-to-r from-stone-200 to-transparent dark:from-stone-700" />
                </div>
            )}

            {/* Nav Items */}
            <nav className="space-y-0.5 px-2">
                {visibleItems.map((item) => (
                    <NavItem
                        key={item.href}
                        item={item}
                        collapsed={collapsed}
                        isActive={isActive(item.href)}
                    />
                ))}
            </nav>
        </div>
    );
}

/**
 * Sidebar Component - Pure B/W Design
 */
export function Sidebar({ collapsed = false, onToggle }) {
    const pathname = usePathname();
    const { profile, signOut } = useAuth();
    const [isSigningOut, setIsSigningOut] = useState(false);

    const handleSignOut = async () => {
        setIsSigningOut(true);
        await signOut();
        setIsSigningOut(false);
    };

    return (
        <aside
            className={cn(
                'flex flex-col h-screen transition-all duration-200 ease-out',
                'bg-white dark:bg-neutral-950',
                'border-r border-neutral-200 dark:border-neutral-800',
                collapsed ? 'w-[72px]' : 'w-[240px]'
            )}
        >
            {/* Header */}
            <div className={cn(
                'flex items-center h-14 px-4 border-b border-neutral-200 dark:border-neutral-800',
                collapsed ? 'justify-center' : 'justify-between'
            )}>
                {!collapsed && (
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-md bg-neutral-900 dark:bg-white flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white dark:text-neutral-900" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-neutral-900 dark:text-white tracking-tight">
                                BENZTRAQ
                            </h1>
                            <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">Sales Hub</p>
                        </div>
                    </div>
                )}

                {/* Toggle Button */}
                <button
                    onClick={onToggle}
                    className={cn(
                        'p-2 rounded-md transition-all duration-150',
                        'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100',
                        'dark:text-neutral-500 dark:hover:text-neutral-300 dark:hover:bg-neutral-800',
                        collapsed && 'mx-auto'
                    )}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>

            {/* Search */}
            <div className="px-3 py-2">
                <button
                    className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-150',
                        'bg-neutral-100 hover:bg-neutral-200 text-neutral-500',
                        'dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-400',
                        collapsed ? 'justify-center' : ''
                    )}
                >
                    <Search className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && (
                        <>
                            <span className="text-sm">Search...</span>
                            <kbd className="ml-auto text-xs bg-white dark:bg-neutral-700 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-600 text-neutral-400">
                                ⌘K
                            </kbd>
                        </>
                    )}
                </button>
            </div>

            {/* ========== Navigation ========== */}
            <ScrollArea className="flex-1 py-2">
                <div className="space-y-4">
                    {NAVIGATION_ITEMS.map((section) => (
                        <NavSection
                            key={section.title}
                            section={section}
                            collapsed={collapsed}
                            pathname={pathname}
                        />
                    ))}
                </div>
            </ScrollArea>

            {/* New Quote Button */}
            <div className="px-3 py-2">
                <Link
                    href="/documents/new"
                    className={cn(
                        'flex items-center justify-center gap-2 w-full py-2 rounded-md font-medium text-sm transition-all duration-150',
                        'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900',
                        'hover:bg-neutral-800 dark:hover:bg-neutral-100',
                        collapsed ? 'px-0' : 'px-4'
                    )}
                >
                    <Plus className="w-4 h-4" />
                    {!collapsed && <span>New Quote</span>}
                </Link>
            </div>

            {/* Ergopack Switch (Directors Only) */}
            {profile && ['director', 'developer'].includes(profile.role) && !collapsed && (
                <div className="px-3 pb-2">
                    <Link
                        href="/ergopack"
                        className={cn(
                            'flex items-center justify-center gap-2 w-full py-2 rounded-md font-medium text-sm transition-all duration-150',
                            'border border-neutral-300 text-neutral-600',
                            'hover:bg-neutral-100 hover:border-neutral-400',
                            'dark:border-neutral-600 dark:text-neutral-400 dark:hover:bg-neutral-800'
                        )}
                    >
                        <Package className="w-4 h-4" />
                        <span>Switch to Ergopack</span>
                    </Link>
                </div>
            )}

            {/* User Profile */}
            <div className="border-t border-neutral-200 dark:border-neutral-800 p-3">
                {profile && (
                    <div className={cn(
                        'flex items-center gap-2.5 p-2 rounded-md transition-all duration-150',
                        'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                        collapsed && 'justify-center p-0'
                    )}>
                        {/* Avatar */}
                        <div className="relative">
                            <Avatar className={cn(
                                'ring-2 ring-neutral-200 dark:ring-neutral-700',
                                collapsed ? 'h-10 w-10' : 'h-8 w-8'
                            )}>
                                <AvatarFallback className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold">
                                    {formatInitials(profile.full_name)}
                                </AvatarFallback>
                            </Avatar>
                        </div>

                        {!collapsed && (
                            <>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                                        {profile.full_name}
                                    </p>
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500 capitalize">
                                        {profile.role}
                                    </p>
                                </div>

                                {/* Sign Out */}
                                <button
                                    onClick={handleSignOut}
                                    disabled={isSigningOut}
                                    className={cn(
                                        'p-1.5 rounded transition-all duration-150',
                                        'text-neutral-400 hover:text-red-600 hover:bg-red-50',
                                        'dark:text-neutral-500 dark:hover:text-red-400 dark:hover:bg-red-900/20',
                                        isSigningOut && 'opacity-50 cursor-not-allowed'
                                    )}
                                    aria-label="Sign out"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
}
