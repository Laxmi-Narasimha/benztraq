'use client';

/**
 * Inventory Dashboard — Company Grid View
 * Shows all companies as cards with item counts and stock summary.
 * QR code on each rack links to /inventory/company/[slug].
 */

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/providers/auth-provider';
import Link from 'next/link';
import {
    Search, Package, ArrowDownCircle, ArrowUpCircle,
    Clock, ChevronRight, BarChart3, AlertTriangle, Boxes, Plus, Table2
} from 'lucide-react';
import AddProductModal from '@/components/inventory/AddProductModal';

export default function InventoryDashboard() {
    const { profile } = useAuth();
    const [stats, setStats] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [activity, setActivity] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        Promise.all([
            fetch('/api/inventory/stats').then(r => r.json()),
            fetch('/api/inventory/customers').then(r => r.json()),
        ]).then(([statsData, customersData]) => {
            setStats(statsData);
            setCustomers(customersData.customers || []);
            setActivity(statsData.recentActivity || []);
        }).catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => {
        if (!search.trim()) return customers;
        const q = search.toLowerCase();
        return customers.filter(c => c.customer_name.toLowerCase().includes(q));
    }, [customers, search]);

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
                <div className="animate-pulse text-neutral-400 text-lg">Loading inventory...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
            {/* Header */}
            <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Inventory</h1>
                        <p className="text-sm text-neutral-500 mt-0.5">FG Stock — {customers.length} companies, {stats?.totalItems || 0} items</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Sheet View toggle */}
                        <Link href="/inventory/sheet"
                            className="flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-3 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap border border-neutral-200 dark:border-neutral-700">
                            <Table2 className="w-4 h-4" /> Sheet View
                        </Link>
                        {/* Add Button */}
                        {['store_manager', 'director', 'head_of_sales', 'vp', 'developer'].includes(profile?.role) && (
                            <button onClick={() => setShowAddModal(true)}
                                className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap shadow-sm">
                                <Plus className="w-4 h-4" /> Add Product / Company
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard label="Total Items" value={stats?.totalItems || 0} icon={<Boxes className="w-4 h-4" />} />
                    <StatCard label="In Stock" value={stats?.inStockItems || 0} color="text-emerald-600" icon={<Package className="w-4 h-4" />} />
                    <StatCard label="Zero Stock" value={stats?.zeroStockItems || 0} color="text-red-600" icon={<AlertTriangle className="w-4 h-4" />} />
                    <StatCard label="Stock Weight" value={`${((stats?.totalStockKg || 0) / 1000).toFixed(1)}T`} icon={<BarChart3 className="w-4 h-4" />} />
                </div>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Left: Company Grid */}
                    <div className="lg:col-span-3">
                        {/* Search */}
                        <div className="mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search company..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Company Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                            {filtered.map(company => (
                                <CompanyCard key={company.customer_name} company={company} />
                            ))}
                        </div>

                        {filtered.length === 0 && (
                            <div className="text-center py-16 text-neutral-400">
                                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>No companies found for "{search}"</p>
                            </div>
                        )}
                    </div>

                    {/* Right: Activity Feed */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden sticky top-6">
                            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-neutral-400" />
                                <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">Recent Activity</h3>
                            </div>
                            <div className="max-h-[500px] overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
                                {activity.length === 0 ? (
                                    <p className="text-sm text-neutral-400 p-4 text-center">No recent activity</p>
                                ) : activity.map((a, i) => (
                                    <div key={i} className="px-4 py-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${a.type === 'inward' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'}`}>
                                                {a.type === 'inward' ? 'IN' : 'OUT'}
                                            </span>
                                            <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                                                {a.type === 'inward' ? '+' : '-'}{parseFloat(a.quantity).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-neutral-500 truncate">{a.customer_name || 'Unknown'}</p>
                                        <p className="text-[10px] text-neutral-400 mt-0.5">
                                            {new Date(a.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            {a.created_by_name && ` • ${a.created_by_name}`}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <AddProductModal
                open={showAddModal}
                onOpenChange={setShowAddModal}
                onSuccess={(newItem) => {
                    window.location.reload();
                }}
            />
        </div>
    );
}

function StatCard({ label, value, color = 'text-neutral-900 dark:text-white', icon }) {
    return (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
                <span className="text-neutral-400">{icon}</span>
                <span className="text-xs text-neutral-500">{label}</span>
            </div>
            <p className={`text-xl font-bold ${color}`}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
        </div>
    );
}

function CompanyCard({ company }) {
    const slug = encodeURIComponent(company.customer_name);
    const count = company.item_count || 0;

    return (
        <Link
            href={`/inventory/company/${slug}`}
            className="group bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all"
        >
            <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {company.customer_name}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1">{count} product{count !== 1 ? 's' : ''}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
            </div>
        </Link>
    );
}
