/**
 * Ergopack Layout - Premium Light Theme
 * 
 * Layout for Ergopack India CRM module.
 * Premium light theme with elegant sidebar.
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
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-900 mx-auto mb-4" />
                    <p className="text-slate-500">Loading...</p>
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
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 shadow-sm">
                {/* Header */}
                <div className="h-16 px-4 border-b border-slate-100 flex items-center gap-3 flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                        <Package className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight text-slate-900">ERGOPACK</h1>
                        <p className="text-xs text-slate-500">Outreach CRM</p>
                    </div>
                </div>

                {/* Navigation - Scrollable */}
                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/ergopack' && pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                                    isActive
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.title}
                            </Link>
                        );
                    })}

                    {/* Add Contact Button */}
                    <Link href="/ergopack/contacts/new">
                        <Button className="w-full mt-4 bg-slate-100 text-slate-900 hover:bg-slate-200 font-medium border border-slate-200">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Contact
                        </Button>
                    </Link>
                </nav>

                {/* Footer - Sticky at bottom */}
                <div className="p-4 border-t border-slate-100 bg-white flex-shrink-0">
                    {/* Company Switcher - Elegant text link */}
                    {canAccessBenz && (
                        <Link
                            href="/dashboard"
                            className="block mb-4 group"
                        >
                            <span className="text-sm text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-2">
                                <Building2 className="w-3.5 h-3.5" />
                                <span className="border-b border-slate-300 group-hover:border-slate-500 pb-0.5">
                                    Benz Packaging
                                </span>
                            </span>
                        </Link>
                    )}

                    {/* User Info & Logout */}
                    <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-medium text-sm">
                                {user?.fullName?.charAt(0) || 'U'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                                {user?.fullName || 'User'}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                                {user?.designation || user?.role}
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={signOut}
                            className="text-slate-400 hover:text-slate-900 hover:bg-slate-200 flex-shrink-0"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-slate-50">
                {children}
            </main>
        </div>
    );
}
