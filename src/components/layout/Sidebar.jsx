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
 * Icon mapping with associated colors for gradient backgrounds
 */
const IconConfig = {
    LayoutDashboard: { icon: LayoutDashboard, gradient: 'from-teal-500 to-cyan-500', bg: 'bg-teal-500/10' },
    FileText: { icon: FileText, gradient: 'from-blue-500 to-indigo-500', bg: 'bg-blue-500/10' },
    Upload: { icon: Upload, gradient: 'from-violet-500 to-purple-500', bg: 'bg-violet-500/10' },
    GitCompare: { icon: GitCompare, gradient: 'from-pink-500 to-rose-500', bg: 'bg-pink-500/10' },
    Users: { icon: Users, gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/10' },
    Package: { icon: Package, gradient: 'from-emerald-500 to-green-500', bg: 'bg-emerald-500/10' },
    MapPin: { icon: MapPin, gradient: 'from-red-500 to-rose-500', bg: 'bg-red-500/10' },
    Target: { icon: Target, gradient: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-500/10' },
    BarChart3: { icon: BarChart3, gradient: 'from-indigo-500 to-violet-500', bg: 'bg-indigo-500/10' },
    Settings: { icon: Settings, gradient: 'from-stone-500 to-stone-600', bg: 'bg-stone-500/10' },
    Shield: { icon: Shield, gradient: 'from-rose-500 to-red-500', bg: 'bg-rose-500/10' },
};

/**
 * Single Navigation Item Component
 */
function NavItem({ item, collapsed, isActive }) {
    const config = IconConfig[item.icon] || { icon: LayoutDashboard, gradient: 'from-stone-500 to-stone-600', bg: 'bg-stone-500/10' };
    const Icon = config.icon;

    return (
        <Link
            href={item.href}
            className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                    ? 'bg-gradient-to-r from-teal-500/10 to-cyan-500/5 text-teal-700 dark:text-teal-300'
                    : 'text-stone-600 hover:bg-stone-100/80 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800/50 dark:hover:text-stone-200',
                collapsed && 'justify-center px-0'
            )}
            title={collapsed ? item.title : undefined}
        >
            {/* Active Indicator */}
            {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-teal-500 to-cyan-500 rounded-r-full" />
            )}

            {/* Icon Container */}
            <span className={cn(
                'relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200',
                isActive
                    ? `bg-gradient-to-br ${config.gradient} text-white shadow-lg shadow-teal-500/20`
                    : `${config.bg} text-stone-500 group-hover:text-stone-700 dark:text-stone-400`,
                collapsed ? 'w-10 h-10' : 'w-8 h-8'
            )}>
                <Icon className={cn('transition-transform duration-200 group-hover:scale-110', collapsed ? 'w-5 h-5' : 'w-4 h-4')} />
            </span>

            {/* Label */}
            {!collapsed && (
                <span className="truncate">{item.title}</span>
            )}

            {/* Badge/Count (if applicable) */}
            {item.badge && !collapsed && (
                <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">
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
 * Premium Sidebar Component
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
                'flex flex-col h-screen transition-all duration-300 ease-out',
                'bg-gradient-to-b from-white via-white to-stone-50/50',
                'dark:from-stone-900 dark:via-stone-900 dark:to-stone-950/50',
                'border-r border-stone-200/80 dark:border-stone-800',
                collapsed ? 'w-[72px]' : 'w-[260px]'
            )}
        >
            {/* ========== Header ========== */}
            <div className={cn(
                'flex items-center h-16 px-4 border-b border-stone-200/80 dark:border-stone-800',
                collapsed ? 'justify-center' : 'justify-between'
            )}>
                {!collapsed && (
                    <div className="flex items-center gap-3">
                        {/* Logo */}
                        <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            {/* Pulse animation */}
                            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-stone-800 dark:text-white tracking-tight">
                                BENZTRAQ
                            </h1>
                            <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">Sales Hub</p>
                        </div>
                    </div>
                )}

                {/* Toggle Button */}
                <button
                    onClick={onToggle}
                    className={cn(
                        'p-2 rounded-lg transition-all duration-200',
                        'text-stone-400 hover:text-stone-600 hover:bg-stone-100',
                        'dark:text-stone-500 dark:hover:text-stone-300 dark:hover:bg-stone-800',
                        collapsed && 'mx-auto'
                    )}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>
            </div>

            {/* ========== Quick Search (Collapsed: Just icon) ========== */}
            <div className="px-3 py-3">
                <button
                    className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                        'bg-stone-100/80 hover:bg-stone-200/80 text-stone-500',
                        'dark:bg-stone-800/50 dark:hover:bg-stone-800 dark:text-stone-400',
                        collapsed ? 'justify-center' : ''
                    )}
                >
                    <Search className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && (
                        <>
                            <span className="text-sm">Search...</span>
                            <kbd className="ml-auto text-xs bg-white dark:bg-stone-700 px-1.5 py-0.5 rounded border border-stone-200 dark:border-stone-600 text-stone-400">
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

            {/* ========== Quick Create Button ========== */}
            <div className="px-3 py-2">
                <Link
                    href="/documents/new"
                    className={cn(
                        'flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-medium text-sm transition-all duration-200',
                        'bg-gradient-to-r from-teal-500 to-cyan-600 text-white',
                        'hover:from-teal-600 hover:to-cyan-700 hover:shadow-lg hover:shadow-teal-500/30',
                        'active:scale-[0.98]',
                        collapsed ? 'px-0' : 'px-4'
                    )}
                >
                    <Plus className="w-4 h-4" />
                    {!collapsed && <span>New Quote</span>}
                </Link>
            </div>

            {/* ========== Ergopack Switch (Directors Only) ========== */}
            {profile && ['director', 'developer'].includes(profile.role) && !collapsed && (
                <div className="px-3 pb-2">
                    <Link
                        href="/ergopack"
                        className={cn(
                            'flex items-center justify-center gap-2 w-full py-2 rounded-xl font-medium text-sm transition-all duration-200',
                            'border border-dashed border-emerald-300 text-emerald-600',
                            'hover:bg-emerald-50 hover:border-emerald-400',
                            'dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20'
                        )}
                    >
                        <Package className="w-4 h-4" />
                        <span>Switch to Ergopack</span>
                    </Link>
                </div>
            )}

            {/* ========== User Profile Card ========== */}
            <div className="border-t border-stone-200/80 dark:border-stone-800 p-3">
                {profile && (
                    <div className={cn(
                        'flex items-center gap-3 p-2 rounded-xl transition-all duration-200',
                        'hover:bg-stone-100/80 dark:hover:bg-stone-800/50',
                        collapsed && 'justify-center p-0'
                    )}>
                        {/* Avatar with Status */}
                        <div className="relative">
                            <Avatar className={cn(
                                'ring-2 ring-stone-200 dark:ring-stone-700',
                                collapsed ? 'h-10 w-10' : 'h-9 w-9'
                            )}>
                                <AvatarFallback className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white text-sm font-semibold">
                                    {formatInitials(profile.full_name)}
                                </AvatarFallback>
                            </Avatar>
                            {/* Online Status */}
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-stone-900" />
                        </div>

                        {!collapsed && (
                            <>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-stone-800 dark:text-white truncate">
                                        {profile.full_name}
                                    </p>
                                    <p className="text-xs text-stone-400 dark:text-stone-500 capitalize">
                                        {profile.role}
                                    </p>
                                </div>

                                {/* Sign Out */}
                                <button
                                    onClick={handleSignOut}
                                    disabled={isSigningOut}
                                    className={cn(
                                        'p-2 rounded-lg transition-all duration-200',
                                        'text-stone-400 hover:text-red-500 hover:bg-red-50',
                                        'dark:text-stone-500 dark:hover:text-red-400 dark:hover:bg-red-900/20',
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
