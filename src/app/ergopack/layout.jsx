/**
 * Ergopack Layout - Black & White Theme
 * 
 * Layout for Ergopack India CRM module.
 * Premium black & white design with sticky footer.
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
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
                    <p className="text-zinc-500">Loading...</p>
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
        <div className="min-h-screen bg-black flex">
            {/* Sidebar */}
            <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col h-screen sticky top-0">
                {/* Header */}
                <div className="h-16 px-4 border-b border-zinc-800 flex items-center gap-3 flex-shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                        <Package className="w-6 h-6 text-black" />
                    </div>
                    <div>
                        <h1 className="text-lg font-light tracking-wide text-white">ERGOPACK</h1>
                        <p className="text-xs text-zinc-500">Outreach CRM</p>
                    </div>
                </div>

                {/* Navigation - Scrollable */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/ergopack' && pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-light transition-colors',
                                    isActive
                                        ? 'bg-white text-black'
                                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.title}
                            </Link>
                        );
                    })}

                    {/* Add Contact Button */}
                    <Link href="/ergopack/contacts/new">
                        <Button className="w-full mt-4 bg-white text-black hover:bg-zinc-200 font-light">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Contact
                        </Button>
                    </Link>
                </nav>

                {/* Footer - Sticky at bottom */}
                <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex-shrink-0">
                    {/* Company Switcher - Elegant text link */}
                    {canAccessBenz && (
                        <Link
                            href="/dashboard"
                            className="block mb-4 group"
                        >
                            <span className="text-sm text-zinc-500 hover:text-white transition-colors flex items-center gap-2">
                                <Building2 className="w-3.5 h-3.5" />
                                <span className="border-b border-zinc-700 group-hover:border-white/50 pb-0.5">
                                    Benz Packaging
                                </span>
                            </span>
                        </Link>
                    )}

                    {/* User Info & Logout */}
                    <div className="flex items-center gap-3 bg-zinc-800/50 rounded-lg p-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                            <span className="text-black font-medium text-sm">
                                {user?.fullName?.charAt(0) || 'U'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {user?.fullName || 'User'}
                            </p>
                            <p className="text-xs text-zinc-500 truncate">
                                {user?.designation || user?.role}
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={signOut}
                            className="text-zinc-400 hover:text-white hover:bg-zinc-700 flex-shrink-0"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-black">
                {children}
            </main>
        </div>
    );
}
