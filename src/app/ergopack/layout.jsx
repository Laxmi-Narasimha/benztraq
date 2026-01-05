/**
 * Ergopack Layout - Premium Dark Theme
 * 
 * Layout for Ergopack India CRM module.
 * High-end dark sidebar with elegant typography and spacing.
 * 
 * @module app/ergopack/layout
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/lib/utils';
import {
    Loader2, Building2, LayoutDashboard,
    LogOut, Plus, Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
    { title: 'Dashboard', href: '/ergopack', icon: LayoutDashboard },
    { title: 'All Contacts', href: '/ergopack/contacts', icon: Building2 },
];

export default function ErgopackLayout({ children }) {
    const { user, isLoading, isAuthenticated, signOut, isDeveloper, isDirector } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [userCompanies, setUserCompanies] = useState([]);

    // Get user's allowed companies from localStorage
    useEffect(() => {
        const cachedUser = localStorage.getItem('benztraq_user');
        if (cachedUser) {
            try {
                const parsed = JSON.parse(cachedUser);
                setUserCompanies(parsed.companies || []);
            } catch (e) {
                setUserCompanies([]);
            }
        }
    }, [user]);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-500 mx-auto mb-4" />
                    <p className="text-zinc-600 font-light tracking-wide">INITIALIZING...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    // Check if user can access Benz Packaging
    const canAccessBenz = userCompanies.includes('benz') || isDeveloper || isDirector;

    return (
        <div className="min-h-screen bg-[#050505] flex font-sans antialiased text-zinc-300">
            {/* Sidebar */}
            <aside className="w-72 bg-[#080808] border-r border-zinc-900 flex flex-col h-screen sticky top-0 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.5)] z-50">
                {/* Header */}
                <div className="h-20 px-6 border-b border-zinc-900/50 flex items-center gap-4 flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-[0_0_15px_-3px_rgba(255,255,255,0.3)]">
                        <Package className="w-6 h-6 text-black" />
                    </div>
                    <div>
                        <h1 className="text-lg font-medium tracking-wide text-white">ERGOPACK</h1>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Outreach CRM</p>
                    </div>
                </div>

                {/* Navigation - Scrollable */}
                <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold mb-4 px-3">Menu</div>

                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/ergopack' && pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden',
                                    isActive
                                        ? 'text-white bg-zinc-900'
                                        : 'text-zinc-500 hover:text-white hover:bg-zinc-900/50'
                                )}
                            >
                                {/* Active Indicator Glow */}
                                {isActive && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_2px_rgba(255,255,255,0.5)]" />
                                )}

                                <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-white" : "text-zinc-600 group-hover:text-zinc-400")} />
                                {item.title}
                            </Link>
                        );
                    })}

                    {/* Add Contact Button */}
                    <div className="mt-8 px-1">
                        <Link href="/ergopack/contacts/new">
                            <Button className="w-full bg-white text-black hover:bg-zinc-200 hover:shadow-[0_0_15px_-5px_rgba(255,255,255,0.5)] transition-all h-11 rounded-xl font-medium tracking-wide">
                                <Plus className="w-4 h-4 mr-2" />
                                New Lead
                            </Button>
                        </Link>
                    </div>
                </nav>

                {/* Footer - Sticky at bottom */}
                <div className="p-4 border-t border-zinc-900/50 bg-[#080808] flex-shrink-0">
                    {/* Company Switcher */}
                    {canAccessBenz && (
                        <Link
                            href="/dashboard"
                            className="block mb-6 group px-2"
                        >
                            <span className="text-xs text-zinc-500 group-hover:text-white transition-colors flex items-center gap-2">
                                <Building2 className="w-3.5 h-3.5" />
                                <span className="border-b border-zinc-800 group-hover:border-zinc-500 pb-0.5 transition-colors">
                                    Switch to Benz Packaging
                                </span>
                            </span>
                        </Link>
                    )}

                    {/* User Info */}
                    <div className="flex items-center gap-3 bg-zinc-900/50 rounded-xl p-3 border border-zinc-900 group hover:border-zinc-800 transition-colors">
                        <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 text-xs font-medium text-zinc-300">
                            {user?.fullName?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-300 group-hover:text-white truncate transition-colors">
                                {user?.fullName || 'User'}
                            </p>
                            <p className="text-[10px] text-zinc-600 uppercase tracking-wider truncate">
                                {user?.designation || user?.role}
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={signOut}
                            className="text-zinc-600 hover:text-white hover:bg-zinc-800 flex-shrink-0 h-8 w-8 rounded-lg"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-[#050505]">
                {children}
            </main>
        </div>
    );
}
