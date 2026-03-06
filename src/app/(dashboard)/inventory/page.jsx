'use client';

/**
 * Inventory Dashboard — Pyle-Inspired
 * Features: Stat cards, pie chart, bar chart, stock alerts, company grid, activity feed
 */

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/providers/auth-provider';
import Link from 'next/link';
import {
    Search, Package, ArrowDownCircle, ArrowUpCircle,
    Clock, ChevronRight, BarChart3, AlertTriangle, Boxes, Plus, Table2,
    TrendingUp, Users, Weight
} from 'lucide-react';
import AddProductModal from '@/components/inventory/AddProductModal';

// ============================================================
// SVG Pie Chart — Top companies by weight
// ============================================================
const CHART_COLORS = [
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
    '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'
];

function PieChart({ data }) {
    if (!data || data.length === 0) return <div className="text-sm text-neutral-400 text-center py-8">No data</div>;

    const total = data.reduce((sum, d) => sum + d.weight, 0);
    if (total === 0) return <div className="text-sm text-neutral-400 text-center py-8">No weight data</div>;

    let cumAngle = 0;
    const slices = data.map((d, i) => {
        const pct = d.weight / total;
        const startAngle = cumAngle;
        cumAngle += pct * 360;
        const endAngle = cumAngle;
        return { ...d, pct, startAngle, endAngle, color: CHART_COLORS[i % CHART_COLORS.length] };
    });

    const cx = 100, cy = 100, r = 80;
    const toRad = (deg) => (deg - 90) * Math.PI / 180;
    const arcPath = (start, end) => {
        if (end - start >= 359.99) {
            return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.001} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy - r}`;
        }
        const x1 = cx + r * Math.cos(toRad(start));
        const y1 = cy + r * Math.sin(toRad(start));
        const x2 = cx + r * Math.cos(toRad(end));
        const y2 = cy + r * Math.sin(toRad(end));
        const large = end - start > 180 ? 1 : 0;
        return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    };

    return (
        <div className="flex items-start gap-4">
            <svg viewBox="0 0 200 200" className="w-36 h-36 flex-shrink-0">
                {slices.map((s, i) => (
                    <path key={i} d={arcPath(s.startAngle, s.endAngle)} fill={s.color}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                        strokeWidth="1" stroke="white" />
                ))}
                <circle cx={cx} cy={cy} r={35} fill="white" />
                <text x={cx} y={cy - 4} textAnchor="middle" className="text-[10px] fill-neutral-400 font-medium">Total</text>
                <text x={cx} y={cy + 10} textAnchor="middle" className="text-[11px] fill-neutral-800 font-bold">
                    {(total / 1000).toFixed(1)}T
                </text>
            </svg>
            <div className="flex-1 space-y-1 min-w-0 pt-1">
                {slices.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="truncate text-neutral-700 flex-1">{s.name}</span>
                        <span className="font-mono text-neutral-500 tabular-nums">{(s.pct * 100).toFixed(0)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================================
// Horizontal Bar Chart — Material type distribution
// ============================================================
function BarChart({ data }) {
    if (!data || data.length === 0) return <div className="text-sm text-neutral-400 text-center py-8">No data</div>;

    const maxCount = Math.max(...data.map(d => d.count));

    return (
        <div className="space-y-2">
            {data.slice(0, 8).map((d, i) => {
                const pct = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
                return (
                    <div key={i} className="flex items-center gap-2">
                        <span className="text-[11px] text-neutral-600 w-28 truncate flex-shrink-0">{d.name || 'Other'}</span>
                        <div className="flex-1 bg-neutral-100 rounded-full h-5 relative overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-700 ease-out"
                                style={{
                                    width: `${Math.max(pct, 2)}%`,
                                    background: `linear-gradient(90deg, ${CHART_COLORS[i % CHART_COLORS.length]}cc, ${CHART_COLORS[i % CHART_COLORS.length]})`
                                }}
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-neutral-500">
                                {d.count}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ============================================================
// Stock Alerts Table
// ============================================================
function StockAlerts({ alerts }) {
    if (!alerts || alerts.length === 0) {
        return (
            <div className="text-center py-6 text-neutral-400 text-sm">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                All items have healthy stock levels
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-neutral-200">
                        <th className="text-left py-2 px-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">Customer</th>
                        <th className="text-left py-2 px-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">Material</th>
                        <th className="text-left py-2 px-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">Part Size</th>
                        <th className="text-center py-2 px-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">UOM</th>
                        <th className="text-right py-2 px-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">Balance</th>
                    </tr>
                </thead>
                <tbody>
                    {alerts.map((item, i) => {
                        const bal = parseFloat(item.balance_qty) || 0;
                        const isCritical = bal <= 10;
                        return (
                            <tr key={item.id || i} className={`border-b border-neutral-100 ${isCritical ? 'bg-red-50' : 'bg-amber-50/40'}`}>
                                <td className="py-2 px-3 font-medium text-neutral-800 text-[13px]">{item.customer_name}</td>
                                <td className="py-2 px-3 text-neutral-600 text-[13px]">{item.material_type || '—'}</td>
                                <td className="py-2 px-3 text-neutral-500 text-[13px]">{item.part_size || '—'}</td>
                                <td className="py-2 px-3 text-center text-neutral-500 text-[12px]">{item.uom}</td>
                                <td className={`py-2 px-3 text-right font-bold font-mono text-[13px] ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>
                                    {bal.toLocaleString()}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

// ============================================================
// Main Dashboard
// ============================================================
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
                        {/* Add Button — store_manager only */}
                        {profile?.role === 'store_manager' && (
                            <button onClick={() => setShowAddModal(true)}
                                className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap shadow-sm">
                                <Plus className="w-4 h-4" /> Add Product / Company
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <StatCard label="Total Items" value={stats?.totalItems || 0} icon={<Boxes className="w-4 h-4" />} />
                    <StatCard label="In Stock" value={stats?.inStockItems || 0} color="text-emerald-600" icon={<Package className="w-4 h-4" />} />
                    <StatCard label="Zero Stock" value={stats?.zeroStockItems || 0} color="text-red-600" icon={<AlertTriangle className="w-4 h-4" />} />
                    <StatCard label="Stock Weight" value={`${((stats?.totalStockKg || 0) / 1000).toFixed(1)}T`} icon={<Weight className="w-4 h-4" />} />
                    <StatCard label="Companies" value={stats?.uniqueCustomers || 0} icon={<Users className="w-4 h-4" />} />
                </div>
            </div>

            <div className="p-6">
                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Pie Chart */}
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-4 h-4 text-indigo-500" />
                            <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">Top Companies by Stock Weight</h3>
                        </div>
                        <PieChart data={stats?.topCompanies || []} />
                    </div>

                    {/* Bar Chart */}
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 className="w-4 h-4 text-purple-500" />
                            <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">Items by Material Type</h3>
                        </div>
                        <BarChart data={stats?.materialBreakdown || []} />
                    </div>
                </div>

                {/* Stock Alerts */}
                {(stats?.stockAlerts?.length > 0) && (
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden mb-6">
                        <div className="px-5 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">Low Stock Alerts</h3>
                            <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                {stats.stockAlerts.length} items
                            </span>
                        </div>
                        <StockAlerts alerts={stats.stockAlerts} />
                    </div>
                )}

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
