/**
 * Role-Based Dashboard Page with Advanced Analytics & Filtering
 * 
 * Supports:
 * - Date Range Filtering
 * - Multi-User Selection (Comparison)
 * - Revenue Trend vs Target
 * - Pipeline Status Mix
 */

'use client';

export const dynamic = 'force-dynamic';

import { useAuth } from '@/providers/auth-provider';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    IndianRupee,
    FileText,
    ShoppingCart,
    Plus,
    ArrowRight,
    Target,
    Percent,
    BarChart3,
    Filter,
} from 'lucide-react';
import Link from 'next/link';
import { startOfMonth, endOfMonth, format } from 'date-fns';

// Components
import { DashboardFilters } from '@/components/dashboard/dashboard-filters';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { StatusPieChart } from '@/components/dashboard/status-pie-chart';

// --- Helper Functions & Components ---

function formatCurrency(value) {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)} K`;
    return `₹${value}`;
}

function StatCard({ title, value, subtitle, icon: Icon, trend, href }) {
    const cardContent = (
        <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className="text-2xl font-bold mt-1 max-w-[150px] truncate" title={value}>{value}</p>
                    {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
                    {trend !== undefined && trend !== null && (
                        <p className={`text-xs mt-1 ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-zinc-500'}`}>
                            {trend > 0 ? '↑' : trend < 0 ? '↓' : '-'} {Math.abs(trend)}% target
                        </p>
                    )}
                </div>
                {Icon && (
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary" />
                    </div>
                )}
            </div>
        </CardContent>
    );

    if (href) {
        return (
            <Link href={href}>
                <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-primary/20">
                    {cardContent}
                </Card>
            </Link>
        );
    }

    return <Card className="border-l-4 border-l-primary/20 bg-card/50">{cardContent}</Card>;
}

function ActionCard({ title, description, icon: Icon, href, color = 'bg-primary' }) {
    return (
        <Link href={href}>
            <Card className="hover:shadow-lg transition-all cursor-pointer group hover:border-primary/50">
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className={`h-14 w-14 rounded-xl ${color} flex items-center justify-center shadow-md`}>
                            <Icon className="h-7 w-7 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg">{title}</h3>
                            <p className="text-sm text-muted-foreground">{description}</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

// --- Main Dashboard Component ---

export default function DashboardPage() {
    const { profile } = useAuth();
    const userRole = profile?.role || 'asm';
    const isManager = userRole === 'vp' || userRole === 'director';
    const userName = profile?.fullName || profile?.full_name || 'User';

    // State: Filters
    const [dateRange, setDateRange] = useState({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });
    const [availableUsers, setAvailableUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);

    // State: Data
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);
    const [teamContribution, setTeamContribution] = useState([]);

    // 1. Fetch Users (Manager only needs choice, ASM fixed to self)
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

    // 2. Fetch Analytics Data
    useEffect(() => {
        if (!profile || !dateRange?.from) return;

        async function fetchAnalytics() {
            setLoading(true);
            try {
                // Construct Query Params
                const params = new URLSearchParams({
                    from: dateRange.from.toISOString(),
                    to: dateRange.to.toISOString(),
                });

                if (isManager && selectedUsers.length > 0) {
                    params.append('users', selectedUsers.join(','));
                } else if (!isManager) {
                    params.append('users', profile.user_id); // ASM sees self
                }

                const res = await fetch(`/api/dashboard/analytics?${params.toString()}`);
                const data = await res.json();

                if (data.error) throw new Error(data.error);

                setAnalytics(data);

                // For Team Table (still fetch general logic or derive?)
                // API analytics is time-series focused. 
                // Let's rely on standard document fetch for the contribution table or use analytics data?
                // The analytics endpoint aggregates trend. 
                // To display the "Team Contribution" table properly, we might need the aggregate totals per user.
                // We can compute this from the trend data IF it has granular user columns?
                // Trend data has `uid` keys. We can sum them up.

                if (data.revenueTrend && data.userMap) {
                    const contribution = {};

                    data.revenueTrend.forEach(point => {
                        Object.keys(point).forEach(key => {
                            // key is either 'revenue', 'target', or UUIDs
                            if (key !== 'name' && key !== 'date' && !key.startsWith('target')) {
                                const uid = key.replace('revenue_', '');
                                if (key === 'revenue') return; // Skip aggregate key if present alongside users? 
                                // Actually API returns:
                                // If specific users: keys are UUIDs.
                                // If all users (manager default): key is 'revenue'.

                                // Handling Team Table when "All" selected is tricky with just trend data.
                                // We probably still want the dedicated Team stats logic from before or enhance API.

                                // For now, let's keep the dashboard 'Overview' focused on Charts.
                                // And use a simplified contribution list derived if possible, or fetch separate stats if needed.

                                if (data.meta?.isComparison) {
                                    if (!contribution[uid]) contribution[uid] = 0;
                                    contribution[uid] += (point[key] || 0);
                                }
                            }
                        });
                    });

                    if (data.meta?.isComparison) {
                        // Build table from trend sums
                        const team = Object.entries(contribution).map(([uid, val]) => ({
                            id: uid,
                            name: data.userMap[uid] || 'Unknown',
                            totalValue: val,
                            // quotations/orders count not in trend data...
                        })).sort((a, b) => b.totalValue - a.totalValue);
                        setTeamContribution(team);
                    } else {
                        // If "All" view, we don't have per-user breakdown in trend.
                        // Maybe hidden or we fetch the "Team Stats" separately like before?
                        // Or just hide the granular table in "All" view and show Top Performers?
                    }
                }

            } catch (error) {
                console.error("Analytics Error", error);
            } finally {
                setLoading(false);
            }
        }

        fetchAnalytics();
    }, [dateRange, selectedUsers, profile, isManager]);


    // KPI Calculations
    const totalRev = analytics?.revenueTrend?.reduce((sum, p) => {
        // If comparison, sum all user keys? No, API returns 'revenue' aggregate if !comparison ??
        // API Logic: 
        // If effectiveUserIds > 0 (Comparison or Filter): point[uid] = val. point['revenue'] NOT set.
        // If effectiveUserIds == 0 (All): point['revenue'] set.

        if (analytics.meta?.effectiveUserIds?.length > 0) {
            // Sum all UUID keys
            let daySum = 0;
            analytics.meta.effectiveUserIds.forEach(uid => daySum += (p[uid] || 0));
            return sum + daySum;
        }
        return sum + (p.revenue || 0);
    }, 0) || 0;

    const totalTarget = analytics?.revenueTrend?.reduce((sum, p) => {
        if (analytics.meta?.effectiveUserIds?.length > 0) {
            let daySum = 0;
            analytics.meta.effectiveUserIds.forEach(uid => daySum += (p[`target_${uid}`] || 0));
            return sum + daySum;
        }
        return sum + (p.target || 0);
    }, 0) || 0;

    const pipelineCount = analytics?.pieData?.reduce((sum, p) => sum + p.value, 0) || 0;
    const targetProgress = totalTarget > 0 ? Math.round((totalRev / totalTarget) * 100) : 0;

    // Sort Pie data for consistency
    const pieData = analytics?.pieData?.sort((a, b) => b.value - a.value) || [];

    if (loading && !analytics) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground animate-pulse">Loading Analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header & Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {isManager ? 'Executive Dashboard' : 'My Performance'}
                    </h1>
                    <p className="text-muted-foreground">
                        {isManager ? 'Overview of team performance and targets.' : `Track your progress, ${userName}.`}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                            <BarChart3 className="h-4 w-4 mr-2" /> Refresh
                        </Button>
                        <Button size="sm" asChild>
                            <Link href="/documents/new">
                                <Plus className="h-4 w-4 mr-2" /> New Entry
                            </Link>
                        </Button>
                    </div>
                    <DashboardFilters
                        availableUsers={isManager ? availableUsers : []}
                        selectedUsers={selectedUsers}
                        onUserChange={setSelectedUsers}
                        dateRange={dateRange}
                        onDateChange={setDateRange}
                    />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Revenue"
                    value={formatCurrency(totalRev)}
                    subtitle={isManager && selectedUsers.length === 0 ? "Total Team Revenue" : "Selected Period"}
                    icon={IndianRupee}
                    // trend calc vs target?
                    trend={targetProgress}
                />
                <StatCard
                    title="Target Achievement"
                    value={`${targetProgress}%`}
                    subtitle={`Goal: ${formatCurrency(totalTarget)}`}
                    icon={Target}
                    trend={targetProgress - 100} // Mock diff
                />
                <StatCard
                    title="Pipeline Volume"
                    value={pipelineCount}
                    subtitle="Total Documents"
                    icon={FileText}
                />
                <StatCard
                    title="Active Orders"
                    value={pieData.find(d => d.name === 'Confirmed' || d.name === 'Open')?.value || 0}
                    subtitle="In Progress"
                    icon={ShoppingCart}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
                {/* Revenue Trend - Main Chart */}
                <Card className="lg:col-span-2 shadow-md border-zinc-200 dark:border-zinc-800 bg-card">
                    <CardHeader>
                        <CardTitle>Revenue Trend</CardTitle>
                        <CardDescription>
                            {selectedUsers.length > 1
                                ? 'Comparative Performance Analysis'
                                : 'Revenue vs Monthly Target'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[320px] w-full pt-0">
                        <RevenueChart
                            data={analytics?.revenueTrend || []}
                            userMap={analytics?.userMap || {}}
                        />
                    </CardContent>
                </Card>

                {/* Status Mix - Pie */}
                <Card className="shadow-md border-zinc-200 dark:border-zinc-800 bg-card">
                    <CardHeader>
                        <CardTitle>Status Mix</CardTitle>
                        <CardDescription>Document Distribution</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[320px] w-full pt-0">
                        <StatusPieChart data={pieData} />
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions (ASM Only) */}
            {!isManager && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ActionCard
                        title="Create Quotation"
                        description="Start a new proposal"
                        icon={FileText}
                        href="/documents/new?type=quotation"
                        color="bg-blue-600"
                    />
                    <ActionCard
                        title="Draft Sales Order"
                        description="Record a confirmed deal"
                        icon={ShoppingCart}
                        href="/documents/new?type=sales_order"
                        color="bg-green-600"
                    />
                </div>
            )}

            {/* Note: Team Contribution table is omitted in simplified visual view, 
               Manager can rely on "Comparison" mode in Chart to see breakdown, 
               or go to a dedicated "Reports" page for tabular data. 
               This keeps the dashboard clean as requested. */}
        </div>
    );
}
