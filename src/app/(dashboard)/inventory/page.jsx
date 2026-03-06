'use client';

/**
 * Inventory Dashboard — Pyle-Inspired
 * Features: Stat cards, solid pie chart, today's transactions, stock alerts with toggle
 */

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Search, Package, Clock, ChevronRight, BarChart3, AlertTriangle,
    Boxes, Plus, Table2, TrendingUp, Users, Weight, ArrowDownCircle,
    ArrowUpCircle, Ban
} from 'lucide-react';
import AddProductModal from '@/components/inventory/AddProductModal';

// ============================================================
// Exploded Pie Chart — slices pulled outward from center
// ============================================================
const PIE_COLORS = [
    '#8b5cf6', '#ec4899', '#6366f1', '#a855f7', '#f43f5e',
    '#d946ef', '#f97316', '#22c55e', '#06b6d4', '#eab308'
];

function PieChart({ data }) {
    if (!data || data.length === 0) return <div className="text-sm text-neutral-400 text-center py-12">No data</div>;

    const total = data.reduce((sum, d) => sum + d.weight, 0);
    if (total === 0) return <div className="text-sm text-neutral-400 text-center py-12">No weight data</div>;

    let cumAngle = 0;
    const slices = data.map((d, i) => {
        const pct = d.weight / total;
        const startAngle = cumAngle;
        cumAngle += pct * 360;
        const endAngle = cumAngle;
        return { ...d, pct, startAngle, endAngle, color: PIE_COLORS[i % PIE_COLORS.length] };
    });

    const cx = 150, cy = 150, r = 120;
    const explodeDistance = 8;
    const toRad = (deg) => (deg - 90) * Math.PI / 180;

    const getSlicePath = (start, end) => {
        // Calculate midpoint angle for explosion direction
        const midAngle = (start + end) / 2;
        const dx = explodeDistance * Math.cos(toRad(midAngle));
        const dy = explodeDistance * Math.sin(toRad(midAngle));
        const scx = cx + dx;
        const scy = cy + dy;

        if (end - start >= 359.99) {
            return `M ${scx} ${scy - r} A ${r} ${r} 0 1 1 ${scx - 0.001} ${scy - r} A ${r} ${r} 0 1 1 ${scx} ${scy - r}`;
        }
        const x1 = scx + r * Math.cos(toRad(start));
        const y1 = scy + r * Math.sin(toRad(start));
        const x2 = scx + r * Math.cos(toRad(end));
        const y2 = scy + r * Math.sin(toRad(end));
        const large = end - start > 180 ? 1 : 0;
        return `M ${scx} ${scy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    };

    return (
        <div className="flex flex-col items-center">
            <svg viewBox="0 0 300 300" className="w-60 h-60 mb-5" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }}>
                {slices.map((s, i) => (
                    <path key={i} d={getSlicePath(s.startAngle, s.endAngle)} fill={s.color}
                        className="transition-all duration-200 cursor-pointer"
                        style={{ filter: 'brightness(1)' }}
                        onMouseEnter={e => e.target.style.filter = 'brightness(0.85)'}
                        onMouseLeave={e => e.target.style.filter = 'brightness(1)'}
                    />
                ))}
            </svg>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
                {slices.map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px]">
                        <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="text-neutral-600">{s.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================================
// Today's Transactions Panel
// ============================================================
function TodayTransactions({ transactions, count }) {
    if (!transactions || transactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
                <Clock className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">No transactions today</p>
                <p className="text-xs mt-1">Transactions will appear here as they happen</p>
            </div>
        );
    }

    const inwardCount = transactions.filter(t => t.type === 'inward').length;
    const outwardCount = transactions.filter(t => t.type === 'outward').length;
    const inwardQty = transactions.filter(t => t.type === 'inward').reduce((s, t) => s + (parseFloat(t.quantity) || 0), 0);
    const outwardQty = transactions.filter(t => t.type === 'outward').reduce((s, t) => s + (parseFloat(t.quantity) || 0), 0);

    return (
        <div>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                        <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[11px] font-semibold text-emerald-700 uppercase">Inward</span>
                    </div>
                    <p className="text-lg font-bold text-emerald-800">{inwardCount}<span className="text-xs font-normal text-emerald-600 ml-1">({inwardQty.toLocaleString()} qty)</span></p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                        <ArrowUpCircle className="w-3.5 h-3.5 text-orange-600" />
                        <span className="text-[11px] font-semibold text-orange-700 uppercase">Outward</span>
                    </div>
                    <p className="text-lg font-bold text-orange-800">{outwardCount}<span className="text-xs font-normal text-orange-600 ml-1">({outwardQty.toLocaleString()} qty)</span></p>
                </div>
            </div>

            {/* Transaction list */}
            <div className="max-h-[240px] overflow-y-auto divide-y divide-neutral-100">
                {transactions.map((t, i) => (
                    <div key={t.id || i} className="flex items-center gap-3 py-2 px-1">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold
                            ${t.type === 'inward' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                            {t.type === 'inward' ? '▼' : '▲'}
                        </span>
                        <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold text-neutral-800 truncate">{t.customer_name}</p>
                            <p className="text-[10px] text-neutral-400 truncate">{t.material_type}{t.part_size ? ` • ${t.part_size}` : ''}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <p className={`text-sm font-bold font-mono ${t.type === 'inward' ? 'text-emerald-700' : 'text-orange-700'}`}>
                                {t.type === 'inward' ? '+' : '−'}{parseFloat(t.quantity).toLocaleString()}
                            </p>
                            <p className="text-[9px] text-neutral-400">
                                {new Date(t.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================================
// Stock Alerts Table (with toggle for Low Stock / Zero Stock)
// ============================================================
function StockAlertsPanel({ lowStockAlerts, zeroStockList }) {
    const [tab, setTab] = useState('low');
    const router = useRouter();

    const alerts = tab === 'low' ? lowStockAlerts : zeroStockList;

    const handleRowClick = (item) => {
        const company = encodeURIComponent(item.customer_name);
        router.push(`/inventory/sheet?company=${company}`);
    };

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            {/* Header with toggle */}
            <div className="px-5 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">Stock Alerts</h3>

                {/* Toggle buttons */}
                <div className="ml-auto flex items-center bg-neutral-100 rounded-lg p-0.5 gap-0.5">
                    <button onClick={() => setTab('low')}
                        className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all ${tab === 'low'
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'text-neutral-500 hover:text-neutral-700'
                            }`}>
                        ⚠️ Low Stock
                        <span className="ml-1 text-[10px]">({(lowStockAlerts || []).length})</span>
                    </button>
                    <button onClick={() => setTab('zero')}
                        className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all ${tab === 'zero'
                            ? 'bg-red-500 text-white shadow-sm'
                            : 'text-neutral-500 hover:text-neutral-700'
                            }`}>
                        🚫 Zero Stock
                        <span className="ml-1 text-[10px]">({(zeroStockList || []).length})</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            {(!alerts || alerts.length === 0) ? (
                <div className="text-center py-8 text-neutral-400 text-sm">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    {tab === 'low' ? 'All items have healthy stock levels' : 'No zero stock items'}
                </div>
            ) : (
                <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-white dark:bg-neutral-900">
                            <tr className="border-b border-neutral-200">
                                <th className="text-left py-2 px-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">Customer</th>
                                <th className="text-left py-2 px-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">Material</th>
                                <th className="text-left py-2 px-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">Part Size</th>
                                <th className="text-center py-2 px-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">UOM</th>
                                <th className="text-right py-2 px-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">
                                    {tab === 'low' ? 'Balance' : 'Last Received'}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {alerts.map((item, i) => {
                                const bal = parseFloat(item.balance_qty) || 0;
                                const isLow = tab === 'low';
                                const isCritical = isLow && bal <= 10;
                                const rowBg = isLow
                                    ? (isCritical ? 'bg-red-50' : 'bg-amber-50/40')
                                    : (i % 2 === 0 ? 'bg-red-50/30' : 'bg-white');

                                return (
                                    <tr key={item.id || i}
                                        onClick={() => handleRowClick(item)}
                                        className={`border-b border-neutral-100 ${rowBg} cursor-pointer hover:bg-blue-50 transition-colors`}
                                        title={`View ${item.customer_name} in Sheet View`}>
                                        <td className="py-2 px-3 font-medium text-neutral-800 text-[13px] hover:text-blue-600 transition-colors">{item.customer_name}</td>
                                        <td className="py-2 px-3 text-neutral-600 text-[13px]">{item.material_type || '—'}</td>
                                        <td className="py-2 px-3 text-neutral-500 text-[13px]">{item.part_size || '—'}</td>
                                        <td className="py-2 px-3 text-center text-neutral-500 text-[12px]">{item.uom}</td>
                                        <td className={`py-2 px-3 text-right font-bold font-mono text-[13px] ${isLow
                                            ? (isCritical ? 'text-red-600' : 'text-amber-600')
                                            : 'text-red-500'
                                            }`}>
                                            {isLow
                                                ? bal.toLocaleString()
                                                : (item.total_dispatched || 0).toLocaleString()
                                            }
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
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
                        <Link href="/inventory/sheet"
                            className="flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-3 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap border border-neutral-200 dark:border-neutral-700">
                            <Table2 className="w-4 h-4" /> Sheet View
                        </Link>
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
                {/* Charts Row: Pie + Today's Transactions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Pie Chart */}
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-4 h-4 text-indigo-500" />
                            <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">Top Companies by Stock Weight</h3>
                        </div>
                        <PieChart data={stats?.topCompanies || []} />
                    </div>

                    {/* Today's Transactions */}
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="w-4 h-4 text-blue-500" />
                            <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">Today's Transactions</h3>
                            {(stats?.todayTransactions || 0) > 0 && (
                                <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                    {stats.todayTransactions} total
                                </span>
                            )}
                        </div>
                        <TodayTransactions
                            transactions={stats?.todayActivity || []}
                            count={stats?.todayTransactions || 0}
                        />
                    </div>
                </div>

                {/* Stock Alerts (Low + Zero toggle) */}
                <div className="mb-6">
                    <StockAlertsPanel
                        lowStockAlerts={stats?.stockAlerts || []}
                        zeroStockList={stats?.zeroStockList || []}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Left: Company Grid */}
                    <div className="lg:col-span-3">
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
                                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${a.type === 'inward' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
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
                onSuccess={() => window.location.reload()}
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
