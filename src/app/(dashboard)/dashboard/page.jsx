/**
 * World-Class Sales Dashboard
 * 
 * Manager/Director View: Team analytics, leaderboards, funnels, top customers
 * ASM View: Personal stats and quick actions only
 * 
 * Inspired by SAP, Zoho CRM, and Odoo Sales dashboards
 */

'use client';

export const dynamic = 'force-dynamic';

import { useAuth } from '@/providers/auth-provider';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    IndianRupee,
    FileText,
    ShoppingCart,
    Plus,
    ArrowRight,
    ArrowUpRight,
    ArrowDownRight,
    Target,
    TrendingUp,
    Users,
    BarChart3,
    Award,
    Clock,
    Building2,
    Filter,
    RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { startOfMonth, endOfMonth, startOfYear, subDays, format } from 'date-fns';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    Legend,
    AreaChart,
    Area,
} from 'recharts';

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

function formatNumber(value) {
    if (!value) return '0';
    return value.toLocaleString('en-IN');
}

const CHART_COLORS = {
    primary: '#3b82f6',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    cyan: '#06b6d4',
    gray: '#6b7280',
};

const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

// ============================================================================
// REUSABLE COMPONENTS
// ============================================================================

function MetricCard({ title, value, subtitle, icon: Icon, trend, trendLabel, color = 'primary' }) {
    const colorClasses = {
        primary: 'bg-blue-500/10 text-blue-600',
        success: 'bg-green-500/10 text-green-600',
        warning: 'bg-amber-500/10 text-amber-600',
        danger: 'bg-red-500/10 text-red-600',
    };

    return (
        <Card className="relative overflow-hidden">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-3xl font-bold mt-2 tracking-tight">{value}</p>
                        {subtitle && (
                            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                        )}
                        {trend !== undefined && (
                            <div className={`flex items-center gap-1 mt-2 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {trend >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                <span className="font-medium">{Math.abs(trend)}%</span>
                                <span className="text-muted-foreground">{trendLabel || 'vs last period'}</span>
                            </div>
                        )}
                    </div>
                    {Icon && (
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
                            <Icon className="h-6 w-6" />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function LeaderboardCard({ title, members, showBadge = true }) {
    const badges = ['🥇', '🥈', '🥉'];

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-500" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-4">
                    {members.slice(0, 5).map((member, index) => (
                        <div key={member.id || index} className="flex items-center gap-3">
                            <div className="w-8 text-center">
                                {showBadge && index < 3 ? (
                                    <span className="text-xl">{badges[index]}</span>
                                ) : (
                                    <span className="text-sm font-bold text-muted-foreground">{index + 1}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{member.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {member.orders || 0} orders • {member.conversionRate || 0}% conv.
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-sm">{formatCurrency(member.revenue || 0)}</p>
                            </div>
                        </div>
                    ))}
                    {members.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">No data available</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function TopCustomersCard({ customers }) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-500" />
                    Top Customers
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-3">
                    {customers.slice(0, 5).map((customer, index) => (
                        <div key={index} className="flex items-center gap-3 py-2 border-b last:border-0">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                {customer.name?.charAt(0) || 'C'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{customer.name}</p>
                                <p className="text-xs text-muted-foreground">{customer.orders} orders</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-sm">{formatCurrency(customer.revenue)}</p>
                                {customer.growth !== undefined && (
                                    <p className={`text-xs ${customer.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {customer.growth >= 0 ? '+' : ''}{customer.growth}%
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                    {customers.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">No customer data</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function SalesFunnelCard({ data }) {
    const funnelSteps = [
        { key: 'quotations', label: 'Quotations', color: 'bg-blue-500' },
        { key: 'sent', label: 'Sent to Customer', color: 'bg-indigo-500' },
        { key: 'won', label: 'Won / Converted', color: 'bg-green-500' },
    ];

    const maxValue = Math.max(data.quotations || 1, 1);

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Sales Funnel
                </CardTitle>
                <CardDescription>Quote to Order Conversion</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
                {funnelSteps.map((step, index) => {
                    const value = data[step.key] || 0;
                    const width = (value / maxValue) * 100;
                    return (
                        <div key={step.key}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-muted-foreground">{step.label}</span>
                                <span className="font-bold">{value}</span>
                            </div>
                            <div className="h-8 bg-muted rounded-lg overflow-hidden">
                                <div
                                    className={`h-full ${step.color} transition-all duration-500`}
                                    style={{ width: `${Math.max(width, 5)}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
                <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Overall Conversion</span>
                        <Badge variant={data.conversionRate >= 30 ? 'default' : 'secondary'}>
                            {data.conversionRate || 0}%
                        </Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function RecentActivityCard({ documents }) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5 text-purple-500" />
                        Recent Activity
                    </CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/documents">View All</Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-3">
                    {documents.slice(0, 6).map((doc, index) => (
                        <div key={index} className="flex items-center gap-3 py-2 hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors">
                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${doc.type === 'quotation' ? 'bg-blue-500/10 text-blue-600' : 'bg-green-500/10 text-green-600'
                                }`}>
                                {doc.type === 'quotation' ? <FileText className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{doc.customer}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{doc.docNumber}</span>
                                    <span>•</span>
                                    <span>{doc.salesperson}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-sm">{formatCurrency(doc.value)}</p>
                                <p className="text-xs text-muted-foreground">{doc.date}</p>
                            </div>
                        </div>
                    ))}
                    {documents.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">No recent documents</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function DateFilter({ value, onChange }) {
    const presets = [
        { label: 'This Month', getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
        { label: 'This Year', getValue: () => ({ from: startOfYear(new Date()), to: new Date() }) },
        { label: 'Last 30 Days', getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
        { label: 'Last 90 Days', getValue: () => ({ from: subDays(new Date(), 90), to: new Date() }) },
    ];

    return (
        <div className="flex gap-2 flex-wrap">
            {presets.map(preset => (
                <Button
                    key={preset.label}
                    size="sm"
                    variant={format(value.from, 'yyyy-MM-dd') === format(preset.getValue().from, 'yyyy-MM-dd') ? 'default' : 'outline'}
                    onClick={() => onChange(preset.getValue())}
                >
                    {preset.label}
                </Button>
            ))}
        </div>
    );
}

function UserFilter({ users, selectedUsers, onChange }) {
    if (!users || users.length === 0) return null;

    return (
        <div className="flex gap-2 flex-wrap items-center">
            <span className="text-sm text-muted-foreground">View:</span>
            <Button
                size="sm"
                variant={selectedUsers.length === 0 ? 'default' : 'outline'}
                onClick={() => onChange([])}
            >
                All Team
            </Button>
            {users.filter(u => u.role === 'asm').map(user => (
                <Button
                    key={user.id}
                    size="sm"
                    variant={selectedUsers.includes(user.id) ? 'default' : 'outline'}
                    onClick={() => {
                        if (selectedUsers.includes(user.id)) {
                            onChange(selectedUsers.filter(id => id !== user.id));
                        } else {
                            onChange([...selectedUsers, user.id]);
                        }
                    }}
                >
                    {user.name?.split(' ')[0] || 'User'}
                </Button>
            ))}
        </div>
    );
}

// ============================================================================
// ASM DASHBOARD (Simple Personal View)
// ============================================================================

function ASMDashboard({ userName, stats, recentDocs }) {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Welcome, {userName}</h1>
                    <p className="text-muted-foreground">Your sales performance at a glance</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/documents/new?type=quotation">
                            <FileText className="h-4 w-4 mr-2" /> New Quotation
                        </Link>
                    </Button>
                    <Button size="sm" asChild>
                        <Link href="/documents/new?type=sales_order">
                            <Plus className="h-4 w-4 mr-2" /> New Sales Order
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                    title="My Quotations"
                    value={stats.quotations || 0}
                    subtitle="Created this period"
                    icon={FileText}
                    color="primary"
                />
                <MetricCard
                    title="My Sales Orders"
                    value={stats.salesOrders || 0}
                    subtitle="Confirmed deals"
                    icon={ShoppingCart}
                    color="success"
                />
                <MetricCard
                    title="My Revenue"
                    value={formatCurrency(stats.totalValue || 0)}
                    subtitle="Total value"
                    icon={IndianRupee}
                    trend={stats.trend}
                    color="warning"
                />
            </div>

            {/* Recent Documents */}
            <RecentActivityCard documents={recentDocs} />
        </div>
    );
}

// ============================================================================
// MANAGER DASHBOARD (Team Analytics)
// ============================================================================

function ManagerDashboard({ userName, data, availableUsers, selectedUsers, setSelectedUsers, dateRange, setDateRange, loading }) {
    // Calculate stats from data
    const stats = useMemo(() => {
        if (!data) return { totalRevenue: 0, totalQuotations: 0, totalOrders: 0, conversionRate: 0, avgDealSize: 0 };

        const totalRevenue = data.teamMembers?.reduce((sum, m) => sum + (m.revenue || 0), 0) || 0;
        const totalQuotations = data.teamMembers?.reduce((sum, m) => sum + (m.quotations || 0), 0) || 0;
        const totalOrders = data.teamMembers?.reduce((sum, m) => sum + (m.orders || 0), 0) || 0;
        const conversionRate = totalQuotations > 0 ? Math.round((totalOrders / totalQuotations) * 100) : 0;
        const avgDealSize = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        return { totalRevenue, totalQuotations, totalOrders, conversionRate, avgDealSize };
    }, [data]);

    // Chart data for revenue by salesperson
    const revenueChartData = useMemo(() => {
        if (!data?.teamMembers) return [];
        return data.teamMembers.slice(0, 6).map(m => ({
            name: m.name?.split(' ')[0] || 'Unknown',
            revenue: m.revenue || 0,
            orders: m.orders || 0,
        }));
    }, [data]);

    // Trend data (mock monthly for now)
    const trendData = useMemo(() => {
        // In a real implementation, this would come from the API
        // For now, generating demo data
        const months = ['Oct', 'Nov', 'Dec', 'Jan'];
        return months.map((month, i) => ({
            name: month,
            revenue: Math.floor(Math.random() * 500000) + 100000,
            target: 400000,
        }));
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Team Dashboard</h1>
                        <p className="text-muted-foreground">
                            Track and analyze your team's sales performance
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                        </Button>
                        <Button size="sm" asChild>
                            <Link href="/documents">
                                <BarChart3 className="h-4 w-4 mr-2" /> View Documents
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col lg:flex-row gap-4 p-4 bg-muted/30 rounded-lg border">
                    <div className="flex-1">
                        <p className="text-sm font-medium mb-2 text-muted-foreground">Time Period</p>
                        <DateFilter value={dateRange} onChange={setDateRange} />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium mb-2 text-muted-foreground">Team Members</p>
                        <UserFilter
                            users={availableUsers}
                            selectedUsers={selectedUsers}
                            onChange={setSelectedUsers}
                        />
                    </div>
                </div>
            </div>

            {loading && (
                <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
            )}

            {!loading && (
                <>
                    {/* KPI Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <MetricCard
                            title="Total Revenue"
                            value={formatCurrency(stats.totalRevenue)}
                            subtitle="From confirmed orders"
                            icon={IndianRupee}
                            trend={12}
                            color="success"
                        />
                        <MetricCard
                            title="Quotations"
                            value={stats.totalQuotations}
                            subtitle="Created this period"
                            icon={FileText}
                            color="primary"
                        />
                        <MetricCard
                            title="Sales Orders"
                            value={stats.totalOrders}
                            subtitle="Confirmed deals"
                            icon={ShoppingCart}
                            color="success"
                        />
                        <MetricCard
                            title="Conversion Rate"
                            value={`${stats.conversionRate}%`}
                            subtitle="Quote to Order"
                            icon={Target}
                            color={stats.conversionRate >= 30 ? 'success' : 'warning'}
                        />
                        <MetricCard
                            title="Avg Deal Size"
                            value={formatCurrency(stats.avgDealSize)}
                            subtitle="Per order"
                            icon={TrendingUp}
                            color="primary"
                        />
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Revenue by Salesperson */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Revenue by Salesperson
                                </CardTitle>
                                <CardDescription>Performance comparison across team</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[280px]">
                                    {revenueChartData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={revenueChartData} layout="vertical" margin={{ left: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                                <XAxis type="number" tickFormatter={(v) => `₹${v / 1000}k`} />
                                                <YAxis type="category" dataKey="name" width={60} />
                                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                                <Bar dataKey="revenue" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} barSize={24} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-muted-foreground">
                                            No data available for selected filters
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Sales Funnel */}
                        <SalesFunnelCard data={{
                            quotations: stats.totalQuotations,
                            sent: Math.floor(stats.totalQuotations * 0.7),
                            won: stats.totalOrders,
                            conversionRate: stats.conversionRate,
                        }} />
                    </div>

                    {/* Secondary Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Top Performers */}
                        <LeaderboardCard
                            title="Top Performers"
                            members={data?.teamMembers?.sort((a, b) => (b.revenue || 0) - (a.revenue || 0)) || []}
                        />

                        {/* Top Customers */}
                        <TopCustomersCard customers={data?.topCustomers || []} />

                        {/* Revenue Trend */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Revenue Trend</CardTitle>
                                <CardDescription>Monthly performance</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[220px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={trendData}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                                            <Tooltip formatter={(value) => formatCurrency(value)} />
                                            <Area type="monotone" dataKey="revenue" stroke={CHART_COLORS.primary} fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                                            <Line type="monotone" dataKey="target" stroke={CHART_COLORS.gray} strokeDasharray="5 5" strokeWidth={2} dot={false} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Activity */}
                    <RecentActivityCard documents={data?.recentDocuments || []} />
                </>
            )}
        </div>
    );
}

// ============================================================================
// MAIN DASHBOARD PAGE
// ============================================================================

export default function DashboardPage() {
    const { profile, user } = useAuth();

    // Robust role detection - check multiple sources
    const userRole = profile?.role?.toLowerCase() || 'asm';
    const isManager = userRole === 'vp' || userRole === 'director' || userRole === 'head_of_sales';
    const userName = profile?.fullName || profile?.full_name || user?.email?.split('@')[0] || 'User';

    // State
    const [dateRange, setDateRange] = useState({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });
    const [availableUsers, setAvailableUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);

    // Fetch users for manager filter
    useEffect(() => {
        async function loadUsers() {
            if (isManager) {
                try {
                    const res = await fetch('/api/users');
                    const data = await res.json();
                    setAvailableUsers(data.users || []);
                } catch (e) {
                    console.error("Failed to load users", e);
                }
            }
        }
        loadUsers();
    }, [isManager]);

    // Fetch dashboard data
    useEffect(() => {
        if (!profile) return;

        async function fetchData() {
            setLoading(true);
            try {
                // Fetch documents
                const docsRes = await fetch('/api/documents?limit=200');
                const docsData = await docsRes.json();
                const allDocs = docsData.documents || [];

                // Filter by date range
                const docs = allDocs.filter(d => {
                    const docDate = new Date(d.doc_date);
                    return docDate >= dateRange.from && docDate <= dateRange.to;
                });

                // Filter by selected users if applicable
                let filteredDocs = docs;
                if (isManager && selectedUsers.length > 0) {
                    filteredDocs = docs.filter(d => selectedUsers.includes(d.salesperson_user_id));
                }

                if (isManager) {
                    // Aggregate team data
                    const byPerson = {};
                    const byCustomer = {};

                    filteredDocs.forEach(doc => {
                        // Group by salesperson
                        const personId = doc.salesperson_user_id;
                        const personName = doc.salesperson_name || 'Unknown';

                        if (personName !== 'Unknown' && personId) {
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
                        }

                        // Group by customer
                        const customerName = doc.customer_display_name || doc.customer_name_raw || doc.customer?.name || 'Unknown';
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

                    // Calculate conversion rates
                    const teamMembers = Object.values(byPerson).map(p => ({
                        ...p,
                        conversionRate: p.quotations > 0 ? Math.round((p.orders / p.quotations) * 100) : 0,
                    })).sort((a, b) => b.revenue - a.revenue);

                    const topCustomers = Object.values(byCustomer)
                        .sort((a, b) => b.revenue - a.revenue)
                        .slice(0, 5);

                    const recentDocuments = filteredDocs.slice(0, 10).map(d => ({
                        type: d.doc_type,
                        customer: d.customer_display_name || d.customer_name_raw || 'Unknown',
                        docNumber: d.doc_number,
                        salesperson: d.salesperson_name || 'Unknown',
                        value: d.total_value || 0,
                        date: format(new Date(d.doc_date), 'MMM dd'),
                    }));

                    setDashboardData({ teamMembers, topCustomers, recentDocuments });
                } else {
                    // ASM: personal stats only
                    const myDocs = filteredDocs.filter(d => d.salesperson_user_id === profile.user_id);
                    const quotations = myDocs.filter(d => d.doc_type === 'quotation').length;
                    const salesOrders = myDocs.filter(d => d.doc_type === 'sales_order').length;
                    const totalValue = myDocs
                        .filter(d => d.doc_type === 'sales_order')
                        .reduce((sum, d) => sum + (d.total_value || 0), 0);

                    const recentDocs = myDocs.slice(0, 8).map(d => ({
                        type: d.doc_type,
                        customer: d.customer_display_name || d.customer_name_raw || 'Unknown',
                        docNumber: d.doc_number,
                        salesperson: d.salesperson_name,
                        value: d.total_value || 0,
                        date: format(new Date(d.doc_date), 'MMM dd'),
                    }));

                    setDashboardData({
                        stats: { quotations, salesOrders, totalValue },
                        recentDocs,
                    });
                }
            } catch (error) {
                console.error('Dashboard fetch error:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [profile, dateRange, selectedUsers, isManager]);

    // Loading state
    if (!profile) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                    <p className="text-muted-foreground">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    // Render based on role
    if (isManager) {
        return (
            <ManagerDashboard
                userName={userName}
                data={dashboardData}
                availableUsers={availableUsers}
                selectedUsers={selectedUsers}
                setSelectedUsers={setSelectedUsers}
                dateRange={dateRange}
                setDateRange={setDateRange}
                loading={loading}
            />
        );
    }

    return (
        <ASMDashboard
            userName={userName}
            stats={dashboardData?.stats || {}}
            recentDocs={dashboardData?.recentDocs || []}
        />
    );
}
