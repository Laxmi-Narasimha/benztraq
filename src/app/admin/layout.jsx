/**
 * Admin Layout
 * 
 * Layout for admin panel pages.
 * Restricts access to developers only.
 * 
 * @module app/(admin)/layout
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Loader2, Shield, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({ children }) {
    const { user, isLoading, isDeveloper } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isDeveloper) {
            router.push('/dashboard');
        }
    }, [isLoading, isDeveloper, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-slate-400">Loading admin panel...</p>
                </div>
            </div>
        );
    }

    if (!isDeveloper) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="text-center">
                    <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
                    <p className="text-slate-400 mb-4">You don't have permission to access this area.</p>
                    <Link href="/dashboard" className="text-blue-400 hover:text-blue-300">
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900">
            {/* Admin Header */}
            <header className="bg-slate-800 border-b border-slate-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                                <Shield className="w-6 h-6 text-blue-500" />
                                <span className="font-bold text-white">BENZTRAQ</span>
                            </Link>
                            <ChevronRight className="w-4 h-4 text-slate-600" />
                            <span className="text-slate-400">Admin Panel</span>
                        </div>

                        <nav className="flex items-center gap-6">
                            <Link
                                href="/admin"
                                className="text-sm text-slate-400 hover:text-white transition-colors"
                            >
                                Overview
                            </Link>
                            <Link
                                href="/admin/users"
                                className="text-sm text-slate-400 hover:text-white transition-colors"
                            >
                                Users
                            </Link>
                            <Link
                                href="/admin/roles"
                                className="text-sm text-slate-400 hover:text-white transition-colors"
                            >
                                Roles & Permissions
                            </Link>
                            <Link
                                href="/dashboard"
                                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                ← Back to App
                            </Link>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}
