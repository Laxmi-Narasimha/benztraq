/**
 * Sidebar Navigation Component
 * 
 * Premium sidebar with navigation items, user profile, and collapsible sections.
 * Follows the navigation item structure from constants.
 * 
 * @module components/layout/Sidebar
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAVIGATION_ITEMS } from '@/lib/constants';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
} from 'lucide-react';
import { formatInitials } from '@/lib/utils/formatting';
import { useState } from 'react';

/**
 * Icon mapping for navigation items.
 */
const IconMap = {
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
    Shield,
};

/**
 * Sidebar navigation component.
 * Features:
 * - Collapsible sections
 * - Active state highlighting
 * - Role-based item visibility
 * - User profile display
 * - Sign out functionality
 * 
 * @param {Object} props - Component props
 * @param {boolean} [props.collapsed=false] - Whether sidebar is collapsed
 * @param {Function} [props.onToggle] - Callback when collapse state changes
 */
export function Sidebar({ collapsed = false, onToggle }) {
    const pathname = usePathname();
    const { profile, signOut, isManager } = useAuth();
    const [isSigningOut, setIsSigningOut] = useState(false);

    const handleSignOut = async () => {
        setIsSigningOut(true);
        await signOut();
        setIsSigningOut(false);
    };

    /**
     * Checks if a navigation item should be visible to the current user.
     */
    const isItemVisible = (item) => {
        if (!item.roles) return true;
        if (!profile) return false;
        return item.roles.includes(profile.role);
    };

    /**
     * Checks if the current path matches the item href.
     */
    const isActive = (href) => {
        if (href === '/dashboard') {
            return pathname === href || pathname === '/';
        }
        return pathname.startsWith(href);
    };

    return (
        <aside
            className={cn(
                'flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
                collapsed ? 'w-16' : 'w-64'
            )}
        >
            {/* Header */}
            <div className={cn(
                'flex items-center h-16 px-4 border-b border-sidebar-border',
                collapsed ? 'justify-center' : 'justify-between'
            )}>
                {!collapsed && (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-sm font-semibold text-sidebar-foreground">
                                BENZTRAQ
                            </h1>
                            <p className="text-xs text-muted-foreground">Sales Hub</p>
                        </div>
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onToggle}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? (
                        <ChevronRight className="w-4 h-4" />
                    ) : (
                        <ChevronLeft className="w-4 h-4" />
                    )}
                </Button>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 py-4">
                <nav className="space-y-4 px-2">
                    {NAVIGATION_ITEMS.map((section) => (
                        <div key={section.title}>
                            {!collapsed && (
                                <h2 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    {section.title}
                                </h2>
                            )}
                            <ul className="space-y-1">
                                {section.items.filter(isItemVisible).map((item) => {
                                    const Icon = IconMap[item.icon];
                                    const active = isActive(item.href);

                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                                    active
                                                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                                                    collapsed && 'justify-center'
                                                )}
                                                title={collapsed ? item.title : undefined}
                                            >
                                                {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
                                                {!collapsed && <span>{item.title}</span>}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>
            </ScrollArea>

            {/* User Profile */}
            <div className="border-t border-sidebar-border p-4">
                {/* Switch to Ergopack - For directors/developers only */}
                {profile && ['director', 'developer'].includes(profile.role) && !collapsed && (
                    <Link href="/ergopack">
                        <Button
                            variant="outline"
                            className="w-full mb-3 border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                        >
                            <Package className="w-4 h-4 mr-2" />
                            Switch to Ergopack
                        </Button>
                    </Link>
                )}

                {profile && (
                    <div
                        className={cn(
                            'flex items-center gap-3',
                            collapsed && 'justify-center'
                        )}
                    >
                        <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                {formatInitials(profile.full_name)}
                            </AvatarFallback>
                        </Avatar>
                        {!collapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-sidebar-foreground truncate">
                                    {profile.full_name}
                                </p>
                                <p className="text-xs text-muted-foreground uppercase">
                                    {profile.role}
                                </p>
                            </div>
                        )}
                        {!collapsed && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 flex-shrink-0"
                                onClick={handleSignOut}
                                disabled={isSigningOut}
                                aria-label="Sign out"
                            >
                                <LogOut className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
}
