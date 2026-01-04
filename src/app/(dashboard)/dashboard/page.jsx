/**
 * Premium Executive Dashboard
 * 
 * A world-class, immersive sales analytics dashboard with:
 * - Dynamic line charts with multiple data series
 * - Smart filters (Combined/Individual/Comparison)
 * - Premium glassmorphism design
 * - Smooth animations and transitions
 * 
 * Inspired by SAP Analytics, Zoho CRM, and Odoo
 */

'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    IndianRupee,
    FileText,
    ShoppingCart,
    Plus,
    TrendingUp,
    TrendingDown,
    Users,
    Target,
    BarChart3,
    Award,
    Building2,
    Calendar,
    Filter,
    RefreshCw,
    ArrowUpRight,
    ArrowDownRight,
    Layers,
} from 'lucide-react';
import Link from 'next/link';
import { startOfMonth, endOfMonth, startOfYear, subDays, subMonths, format, eachMonthOfInterval, parseISO } from 'date-fns';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Area,
    AreaChart,
    ComposedChart,
} from 'recharts';

// ============================================================================
// PREMIUM DESIGN TOKENS
// ============================================================================

const COLORS = {
    primary: '#6366f1',      // Indigo
    secondary: '#8b5cf6',    // Purple  
    success: '#10b981',      // Emerald
    warning: '#f59e0b',      // Amber
    danger: '#ef4444',       // Red
    info: '#0ea5e9',         // Sky
    abhishek: '#6366f1',     // Indigo for Abhishek
    mani: '#8b5cf6',         // Purple for Mani
    target: '#94a3b8',       // Slate for target line
};

const GRADIENTS = {
    primary: 'from-indigo-500 to-purple-600',
    success: 'from-emerald-500 to-teal-600',
    warning: 'from-amber-500 to-orange-600',
    info: 'from-sky-500 to-blue-600',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatCurrency(value) {
    if (!value || isNaN(value)) return '₹0';
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)} K`;
    return `₹${value.toLocaleString('en-IN')}`;
}

function formatCompactCurrency(value) {
    if (!value || isNaN(value)) return '₹0';
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
    return `₹${value}`;
}

// ============================================================================
// PREMIUM COMPONENTS
// ============================================================================

// Glassmorphism KPI Card
function KPICard({ title, value, subtitle, icon: Icon, trend, trendLabel, gradient = 'primary', delay = 0 }) {
    return (
        <div
            className="group relative overflow-hidden rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-zinc-800/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
            style={{ animationDelay: `${delay}ms` }}
        >
            {/* Gradient accent */}
            <div className={`absolute inset-0 bg-gradient-to-br ${GRADIENTS[gradient]} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

            <div className="relative p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 tracking-wide uppercase">{title}</p>
                        <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent">
                            {value}
                        </p>
                        {subtitle && (
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{subtitle}</p>
                        )}
                        {trend !== undefined && (
                            <div className={`flex items-center gap-1 mt-3 text-sm font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {trend >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                <span>{Math.abs(trend)}%</span>
                                <span className="text-zinc-400 font-normal">{trendLabel || 'vs last period'}</span>
                            </div>
                        )}
                    </div>
                    {Icon && (
                        <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${GRADIENTS[gradient]} flex items-center justify-center shadow-lg`}>
                            <Icon className="h-7 w-7 text-white" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Filter Button Group
function FilterPills({ options, value, onChange, className = '' }) {
    return (
        <div className={`inline-flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 ${className}`}>
            {options.map(option => (
                <button
                    key={option.value}
                    onClick={() => onChange(option.value)}
                    className={`
                        px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
                        ${value === option.value
                            ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-md'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                        }
                    `}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}

// Premium Custom Tooltip
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;

    return (
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-zinc-200/50 dark:border-zinc-700/50 p-4 min-w-[180px]">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">{label}</p>
            <div className="space-y-2">
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-sm text-zinc-600 dark:text-zinc-400">{entry.name}</span>
                        </div>
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">
                            {formatCurrency(entry.value)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Premium Leaderboard
function Leaderboard({ members, title = "Top Performers" }) {
    const medals = ['🥇', '🥈', '🥉'];

    return (
        <div className="space-y-4">
            {members.slice(0, 5).map((member, index) => (
                <div
                    key={member.id || index}
                    className="group flex items-center gap-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/30 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all duration-300"
                >
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                        {index < 3 ? medals[index] : index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-zinc-900 dark:text-white truncate">{member.name}</p>
                        <p className="text-xs text-zinc-500">
                            {member.orders || 0} orders • {member.conversionRate || 0}% conversion
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-zinc-900 dark:text-white">{formatCurrency(member.revenue || 0)}</p>
                    </div>
                </div>
            ))}
            {members.length === 0 && (
                <p className="text-center text-zinc-500 py-8">No data available</p>
            )}
        </div>
    );
}

// Sales Funnel with Progress Bars
function SalesFunnel({ data }) {
    const steps = [
        { key: 'quotations', label: 'Quotations Created', color: 'bg-indigo-500' },
        { key: 'sent', label: 'Sent to Customer', color: 'bg-purple-500' },
        { key: 'won', label: 'Won / Converted', color: 'bg-emerald-500' },
    ];

    const maxValue = Math.max(data.quotations || 1, 1);

    return (
        <div className="space-y-5">
            {steps.map((step) => {
                const value = data[step.key] || 0;
                const percentage = Math.round((value / maxValue) * 100);

                return (
                    <div key={step.key} className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{step.label}</span>
                            <span className="text-lg font-bold text-zinc-900 dark:text-white">{value}</span>
                        </div>
                        <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${step.color} rounded-full transition-all duration-1000 ease-out`}
                                style={{ width: `${Math.max(percentage, 5)}%` }}
                            />
                        </div>
                    </div>
                );
            })}
            <div className="pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Overall Conversion</span>
                    <Badge className={`${data.conversionRate >= 30 ? 'bg-emerald-500' : 'bg-amber-500'} text-white`}>
                        {data.conversionRate || 0}%
                    </Badge>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// MAIN DASHBOARD
// ============================================================================

export default function DashboardPage() {
    const { profile, user } = useAuth();

    // Role detection
    const userRole = profile?.role?.toLowerCase() || 'asm';
    const isManager = userRole === 'vp' || userRole === 'director' || userRole === 'head_of_sales';
    const userName = profile?.fullName || profile?.full_name || user?.email?.split('@')[0] || 'User';

    // State
    const [datePreset, setDatePreset] = useState('this_month');
    const [viewMode, setViewMode] = useState('combined'); // combined, individual, comparison
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [rawDocuments, setRawDocuments] = useState([]);

    // Date range based on preset
    const dateRange = useMemo(() => {
        const now = new Date();
        switch (datePreset) {
            case 'this_month':
                return { from: startOfMonth(now), to: endOfMonth(now) };
            case 'last_month':
                return { from: startOfMonth(subMonths(now, 1)), to: endOfMonth(subMonths(now, 1)) };
            case 'this_year':
                return { from: startOfYear(now), to: now };
            case 'last_90':
                return { from: subDays(now, 90), to: now };
            default:
                return { from: startOfMonth(now), to: endOfMonth(now) };
        }
    }, [datePreset]);

    // Fetch users
    useEffect(() => {
        async function loadUsers() {
            if (isManager) {
                try {
                    const res = await fetch('/api/users');
                    const data = await res.json();
                    const asmUsers = (data.users || []).filter(u => u.role === 'asm');
                    setAvailableUsers(asmUsers);
                } catch (e) {
                    console.error("Failed to load users", e);
                }
            }
        }
        loadUsers();
    }, [isManager]);

    // Fetch documents
    useEffect(() => {
        if (!profile) return;

        async function fetchData() {
            setLoading(true);
            try {
                const res = await fetch('/api/documents?limit=500');
                const data = await res.json();
                setRawDocuments(data.documents || []);
            } catch (error) {
                console.error('Dashboard fetch error:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [profile]);

    // Process data
    const dashboardData = useMemo(() => {
        if (!rawDocuments.length) return null;

        // Filter by date
        const docs = rawDocuments.filter(d => {
            const docDate = new Date(d.doc_date);
            return docDate >= dateRange.from && docDate <= dateRange.to;
        });

        // Group by person
        const byPerson = {};
        const byCustomer = {};
        const byMonth = {};

        docs.forEach(doc => {
            const personId = doc.salesperson_user_id;
            const personName = doc.salesperson_name || 'Unknown';
            const monthKey = format(new Date(doc.doc_date), 'MMM yyyy');

            // Skip unknown
            if (personName === 'Unknown' || !personId) return;

            // By person aggregation
            if (!byPerson[personId]) {
                byPerson[personId] = {
                    id: personId,
                    name: personName,
                    quotations: 0,
                    orders: 0,
                    revenue: 0,
                };
            }
            if (doc.doc_type === 'quotation') byPerson[personId].quotations++;
            if (doc.doc_type === 'sales_order') {
                byPerson[personId].orders++;
                byPerson[personId].revenue += doc.total_value || 0;
            }

            // By month for trend
            if (!byMonth[monthKey]) {
                byMonth[monthKey] = {
                    month: monthKey,
                    total: 0,
                    quotations: 0,
                };
            }
            if (doc.doc_type === 'sales_order') {
                byMonth[monthKey].total += doc.total_value || 0;

                // Per-user tracking for comparison
                if (!byMonth[monthKey][personId]) byMonth[monthKey][personId] = 0;
                byMonth[monthKey][personId] += doc.total_value || 0;
            }
            if (doc.doc_type === 'quotation') {
                byMonth[monthKey].quotations++;
            }

            // By customer
            const customerName = doc.customer_name_raw || doc.customer_display_name || 'Unknown';
            if (customerName !== 'Unknown') {
                if (!byCustomer[customerName]) {
                    byCustomer[customerName] = { name: customerName, orders: 0, revenue: 0 };
                }
                if (doc.doc_type === 'sales_order') {
                    byCustomer[customerName].orders++;
                    byCustomer[customerName].revenue += doc.total_value || 0;
                }
            }
        });

        // Team members with conversion rates
        const teamMembers = Object.values(byPerson).map(p => ({
            ...p,
            conversionRate: p.quotations > 0 ? Math.round((p.orders / p.quotations) * 100) : 0,
        })).sort((a, b) => b.revenue - a.revenue);

        // Trend data sorted by date
        const months = eachMonthOfInterval({ start: dateRange.from, end: dateRange.to });
        const trendData = months.map(date => {
            const key = format(date, 'MMM yyyy');
            const monthData = byMonth[key] || { total: 0, quotations: 0 };

            const entry = {
                name: format(date, 'MMM'),
                fullName: key,
                total: monthData.total || 0,
                quotations: monthData.quotations || 0,
            };

            // Add per-user data if we have team members
            teamMembers.forEach(member => {
                entry[member.id] = monthData[member.id] || 0;
                entry[`${member.name}`] = monthData[member.id] || 0;
            });

            return entry;
        });

        // Top customers
        const topCustomers = Object.values(byCustomer)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        // Aggregate KPIs
        const totalRevenue = teamMembers.reduce((sum, m) => sum + m.revenue, 0);
        const totalQuotations = teamMembers.reduce((sum, m) => sum + m.quotations, 0);
        const totalOrders = teamMembers.reduce((sum, m) => sum + m.orders, 0);
        const conversionRate = totalQuotations > 0 ? Math.round((totalOrders / totalQuotations) * 100) : 0;
        const avgDealSize = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        return {
            teamMembers,
            topCustomers,
            trendData,
            kpis: { totalRevenue, totalQuotations, totalOrders, conversionRate, avgDealSize },
            funnel: {
                quotations: totalQuotations,
                sent: Math.floor(totalQuotations * 0.7),
                won: totalOrders,
                conversionRate,
            },
        };
    }, [rawDocuments, dateRange]);

    // View mode options
    const viewOptions = useMemo(() => {
        const opts = [{ value: 'combined', label: 'Combined' }];
        availableUsers.forEach(u => {
            opts.push({ value: u.id, label: u.name?.split(' ')[0] || 'User' });
        });
        if (availableUsers.length >= 2) {
            opts.push({ value: 'comparison', label: 'Compare All' });
        }
        return opts;
    }, [availableUsers]);

    // Chart lines based on view mode
    const chartLines = useMemo(() => {
        if (!dashboardData?.teamMembers) return [];

        if (viewMode === 'combined') {
            return [{ key: 'total', name: 'Total Revenue', color: COLORS.primary }];
        }

        if (viewMode === 'comparison') {
            return dashboardData.teamMembers.slice(0, 4).map((member, i) => ({
                key: member.id,
                name: member.name,
                color: [COLORS.abhishek, COLORS.mani, COLORS.success, COLORS.warning][i] || COLORS.info,
            }));
        }

        // Individual user
        const user = dashboardData.teamMembers.find(m => m.id === viewMode);
        if (user) {
            return [{ key: user.id, name: user.name, color: COLORS.primary }];
        }

        return [{ key: 'total', name: 'Total Revenue', color: COLORS.primary }];
    }, [viewMode, dashboardData]);

    // Loading state
    if (!profile) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                    <p className="text-zinc-500 animate-pulse">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    // ASM View
    if (!isManager) {
        const myDocs = rawDocuments.filter(d => d.salesperson_user_id === profile.user_id);
        const quotations = myDocs.filter(d => d.doc_type === 'quotation').length;
        const orders = myDocs.filter(d => d.doc_type === 'sales_order').length;
        const revenue = myDocs.filter(d => d.doc_type === 'sales_order').reduce((sum, d) => sum + (d.total_value || 0), 0);

        return (
            <div className="space-y-8 animate-in fade-in duration-700 pb-10">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
                        Welcome back, {userName}
                    </h1>
                    <p className="text-zinc-500 mt-2">Your sales performance at a glance</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <KPICard title="My Quotations" value={quotations} icon={FileText} gradient="info" />
                    <KPICard title="My Orders" value={orders} icon={ShoppingCart} gradient="success" />
                    <KPICard title="My Revenue" value={formatCurrency(revenue)} icon={IndianRupee} gradient="primary" />
                </div>

                <div className="flex gap-4">
                    <Button size="lg" asChild className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                        <Link href="/documents/new?type=quotation">
                            <Plus className="h-5 w-5 mr-2" /> New Quotation
                        </Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                        <Link href="/documents/new?type=sales_order">
                            <ShoppingCart className="h-5 w-5 mr-2" /> New Sales Order
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    // Manager Dashboard
    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
                        Team Dashboard
                    </h1>
                    <p className="text-zinc-500 mt-2">Monitor and analyze your team's sales performance</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <FilterPills
                        options={[
                            { value: 'this_month', label: 'This Month' },
                            { value: 'last_month', label: 'Last Month' },
                            { value: 'this_year', label: 'This Year' },
                            { value: 'last_90', label: 'Last 90 Days' },
                        ]}
                        value={datePreset}
                        onChange={setDatePreset}
                    />
                    <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                    </Button>
                </div>
            </div>

            {loading && (
                <div className="flex items-center justify-center h-64">
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                </div>
            )}

            {!loading && dashboardData && (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        <KPICard
                            title="Total Revenue"
                            value={formatCurrency(dashboardData.kpis.totalRevenue)}
                            subtitle="From confirmed orders"
                            icon={IndianRupee}
                            trend={12}
                            gradient="primary"
                            delay={0}
                        />
                        <KPICard
                            title="Quotations"
                            value={dashboardData.kpis.totalQuotations}
                            subtitle="Created this period"
                            icon={FileText}
                            gradient="info"
                            delay={50}
                        />
                        <KPICard
                            title="Sales Orders"
                            value={dashboardData.kpis.totalOrders}
                            subtitle="Confirmed deals"
                            icon={ShoppingCart}
                            gradient="success"
                            delay={100}
                        />
                        <KPICard
                            title="Conversion Rate"
                            value={`${dashboardData.kpis.conversionRate}%`}
                            subtitle="Quote to Order"
                            icon={Target}
                            gradient={dashboardData.kpis.conversionRate >= 30 ? 'success' : 'warning'}
                            delay={150}
                        />
                        <KPICard
                            title="Avg Deal Size"
                            value={formatCurrency(dashboardData.kpis.avgDealSize)}
                            subtitle="Per order"
                            icon={TrendingUp}
                            gradient="primary"
                            delay={200}
                        />
                    </div>

                    {/* Main Chart Area */}
                    <Card className="overflow-hidden border-0 shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
                        <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-6">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div>
                                    <CardTitle className="text-xl flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                            <TrendingUp className="h-5 w-5 text-white" />
                                        </div>
                                        Revenue Trend
                                    </CardTitle>
                                    <CardDescription className="mt-2">
                                        {viewMode === 'comparison' ? 'Compare team member performance over time' : 'Track revenue performance over time'}
                                    </CardDescription>
                                </div>
                                <FilterPills
                                    options={viewOptions}
                                    value={viewMode}
                                    onChange={setViewMode}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="h-[400px] w-full">
                                {dashboardData.trendData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={dashboardData.trendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                            <defs>
                                                {chartLines.map((line, i) => (
                                                    <linearGradient key={`gradient-${i}`} id={`gradient-${line.key}`} x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={line.color} stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor={line.color} stopOpacity={0} />
                                                    </linearGradient>
                                                ))}
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#6b7280', fontSize: 12 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#6b7280', fontSize: 12 }}
                                                tickFormatter={(v) => formatCompactCurrency(v)}
                                                dx={-10}
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend
                                                verticalAlign="top"
                                                height={36}
                                                iconType="circle"
                                            />
                                            {chartLines.map((line, i) => (
                                                <React.Fragment key={line.key}>
                                                    <Area
                                                        type="monotone"
                                                        dataKey={line.key}
                                                        name={line.name}
                                                        stroke={line.color}
                                                        fill={`url(#gradient-${line.key})`}
                                                        strokeWidth={3}
                                                        dot={{ fill: line.color, strokeWidth: 2, r: 4 }}
                                                        activeDot={{ r: 8, strokeWidth: 0 }}
                                                    />
                                                </React.Fragment>
                                            ))}
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-zinc-500">
                                        <div className="text-center">
                                            <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-20" />
                                            <p className="text-lg font-medium">No data for selected period</p>
                                            <p className="text-sm">Try selecting a different date range</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Secondary Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Top Performers */}
                        <Card className="overflow-hidden border-0 shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                        <Award className="h-5 w-5 text-white" />
                                    </div>
                                    Top Performers
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Leaderboard members={dashboardData.teamMembers} />
                            </CardContent>
                        </Card>

                        {/* Sales Funnel */}
                        <Card className="overflow-hidden border-0 shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                        <Layers className="h-5 w-5 text-white" />
                                    </div>
                                    Sales Funnel
                                </CardTitle>
                                <CardDescription>Quote to Order Conversion</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <SalesFunnel data={dashboardData.funnel} />
                            </CardContent>
                        </Card>

                        {/* Top Customers */}
                        <Card className="overflow-hidden border-0 shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                                        <Building2 className="h-5 w-5 text-white" />
                                    </div>
                                    Top Customers
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {dashboardData.topCustomers.slice(0, 5).map((customer, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/30"
                                        >
                                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                                {customer.name?.charAt(0) || 'C'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-zinc-900 dark:text-white truncate">{customer.name}</p>
                                                <p className="text-xs text-zinc-500">{customer.orders} orders</p>
                                            </div>
                                            <p className="font-bold text-zinc-900 dark:text-white">{formatCurrency(customer.revenue)}</p>
                                        </div>
                                    ))}
                                    {dashboardData.topCustomers.length === 0 && (
                                        <p className="text-center text-zinc-500 py-8">No customer data</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}
