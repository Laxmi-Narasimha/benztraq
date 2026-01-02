/**
 * Ergopack Layout
 * 
 * Layout for Ergopack India CRM module.
 * Dark themed with dedicated navigation.
 * 
 * @module app/ergopack/layout
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/lib/utils';
import {
    Loader2, Building2, Users, LayoutDashboard,
    LogOut, ArrowLeft, Plus, Phone, Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
    { title: 'Dashboard', href: '/ergopack', icon: LayoutDashboard },
    { title: 'All Contacts', href: '/ergopack/contacts', icon: Building2 },
];

export default function ErgopackLayout({ children }) {
    const { user, isLoading, isAuthenticated, signOut } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
                    <p className="text-slate-400">Loading Ergopack...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-900 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
                {/* Header */}
                <div className="h-16 px-4 border-b border-slate-700 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white">ERGOPACK</h1>
                        <p className="text-xs text-slate-400">Outreach CRM</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/ergopack' && pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-emerald-600/20 text-emerald-400'
                                        : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.title}
                            </Link>
                        );
                    })}

                    {/* Add Contact Button */}
                    <Link href="/ergopack/contacts/new">
                        <Button className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Contact
                        </Button>
                    </Link>
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700">
                    {/* Switch to Benz */}
                    <Link href="/dashboard">
                        <Button
                            variant="outline"
                            className="w-full mb-3 border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-white"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Benz Packaging
                        </Button>
                    </Link>

                    {/* User Info */}
                    <div className="flex items-center justify-between">
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {user?.fullName || 'User'}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                                {user?.email}
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={signOut}
                            className="text-slate-400 hover:text-white hover:bg-slate-700"
                        >
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
