'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { DashboardFilters } from '@/components/dashboard/dashboard-filters';
import { HeroChart } from '@/components/dashboard/hero-chart';
import { FunnelChart, ProductList } from '@/components/dashboard/insights';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    TrendingUp, TrendingDown, DollarSign, FileText, ShoppingCart,
    Target, Users, RefreshCw, AlertCircle, BarChart3, Building2
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatting';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { cn } from '@/lib/utils';

// ============================================================================
// METRIC CARD COMPONENT
// ============================================================================
function MetricCard({ title, value, subtext, trend, trendDirection, icon: Icon, loading }) {
    if (loading) {
        return (
            <Card className="border-slate-100 shadow-sm">
                <CardContent className="p-6">
                    <Skeleton className="h-4 w-20 mb-4" />
                    <Skeleton className="h-8 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                </CardContent>
            </Card>
        );
    }

    const TrendIcon = trendDirection === 'up' ? TrendingUp : TrendingDown;
    const trendColor = trendDirection === 'up' ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50';

    return (
        <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                    <div className="p-2.5 bg-slate-50 rounded-xl text-slate-600">
                        <Icon className="h-5 w-5" />
                    </div>
                    {trend !== null && trend !== undefined && (
                        <div className={cn("flex items-center text-xs font-medium px-2 py-1 rounded-full", trendColor)}>
                            <TrendIcon className="h-3 w-3 mr-1" />
                            {Math.abs(trend)}%
                        </div>
                    )}
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
                </div>
                {subtext && <p className="text-xs text-slate-400 mt-2">{subtext}</p>}
            </CardContent>
        </Card>
    );
}

// ============================================================================
// TOP PERFORMERS / LEADERBOARD
// ============================================================================
function TopPerformers({ data, loading }) {
    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1">
                            <Skeleton className="h-4 w-32 mb-2" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="h-4 w-24" />
                    </div>
                ))}
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-8 text-slate-400">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No team performance data available</p>
            </div>
        );
    }

    const sorted = [...data].sort((a, b) => (b.revenue || 0) - (a.revenue || 0)).slice(0, 5);
    const maxRevenue = sorted[0]?.revenue || 1;

    return (
        <div className="space-y-3">
            {sorted.map((user, index) => (
                <div key={user.uid || index} className="group">
                    <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "flex items-center justify-center w-9 h-9 rounded-full font-bold text-sm",
                                index === 0 ? 'bg-amber-100 text-amber-700' :
                                    index === 1 ? 'bg-slate-200 text-slate-700' :
                                        index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-slate-50 text-slate-500'
                            )}>
                                {index + 1}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-900">{user.name}</p>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span>{user.orders || 0} orders</span>
                                    <span>•</span>
                                    <span className={user.conversion >= 30 ? 'text-emerald-600' : 'text-slate-500'}>
                                        {user.conversion || 0}% conv
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-slate-900">{formatCurrency(user.revenue)}</p>
                        </div>
                    </div>
                    {/* Revenue Bar */}
                    <div className="mx-3 mb-1">
                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                style={{ width: `${(user.revenue / maxRevenue) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ============================================================================
// TOP CUSTOMERS LIST
// ============================================================================
function TopCustomers({ data, loading }) {
    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center justify-between">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                ))}
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-6 text-slate-400">
                <Building2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No customer data</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {data.slice(0, 5).map((customer, i) => (
                <div key={i} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{customer.name}</p>
                        <p className="text-xs text-slate-400">{customer.orders} orders</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 ml-4">
                        {formatCurrency(customer.revenue, { compact: true })}
                    </p>
                </div>
            ))}
        </div>
    );
}

// ============================================================================
// SALES FUNNEL VISUALIZATION
// ============================================================================
function SalesFunnel({ data, loading }) {
    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-4/5" />
                <Skeleton className="h-12 w-3/5" />
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-6 text-slate-400">
                <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No funnel data</p>
            </div>
        );
    }

    const maxValue = Math.max(...data.map(d => d.count));
    const colors = ['#3b82f6', '#8b5cf6', '#10b981'];

    return (
        <div className="space-y-3">
            {data.map((stage, index) => {
                const width = maxValue > 0 ? (stage.count / maxValue) * 100 : 0;
                const dropoff = index > 0 && data[index - 1].count > 0
                    ? Math.round((1 - stage.count / data[index - 1].count) * 100)
                    : 0;

                return (
                    <div key={index} className="relative">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-slate-600">{stage.stage}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-900">{stage.count}</span>
                                {index > 0 && dropoff > 0 && (
                                    <Badge variant="outline" className="text-xs text-red-500 border-red-200">
                                        -{dropoff}%
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <div className="h-8 bg-slate-100 rounded-lg overflow-hidden">
                            <div
                                className="h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-3"
                                style={{
                                    width: `${Math.max(width, 10)}%`,
                                    backgroundColor: colors[index % colors.length]
                                }}
                            >
                                <span className="text-xs font-medium text-white">
                                    {formatCurrency(stage.value, { compact: true })}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ============================================================================
// PIPELINE STATUS DISTRIBUTION
// ============================================================================
function PipelineStatus({ data, loading }) {
    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-12" />
                    </div>
                ))}
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-6 text-slate-400">
                <p className="text-sm">No status data</p>
            </div>
        );
    }

    const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-red-500', 'bg-purple-500', 'bg-slate-500'];
    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="space-y-3">
            {data.map((item, i) => (
                <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                        <div className={cn("w-3 h-3 rounded-full", colors[i % colors.length])} />
                        <span className="text-sm text-slate-600 capitalize">{item.name.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{item.value}</span>
                        <span className="text-xs text-slate-400">
                            ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ============================================================================
// MAIN DASHBOARD PAGE
// ============================================================================
export default function DashboardPage() {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);

    // Filter state
    const [dateRange, setDateRange] = useState({
        from: subMonths(new Date(), 6),
        to: endOfMonth(new Date())
    });
    const [selectedUsers, setSelectedUsers] = useState([]);

    // Fetch Analytics Data
    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const queryParams = new URLSearchParams({
                from: dateRange.from.toISOString(),
                to: dateRange.to.toISOString(),
                users: selectedUsers.join(',')
            });

            const res = await fetch(`/api/dashboard/analytics?${queryParams}`);

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to fetch analytics');
            }

            const data = await res.json();
            setStats(data);
        } catch (err) {
            console.error('Dashboard fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [dateRange, selectedUsers]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    // Derived data - use isManager from auth context
    const { isManager: authIsManager } = useAuth();
    const isManager = stats?.isManager ?? authIsManager;
    const summary = stats?.summaryMetrics || {};
    const kpis = stats?.kpis || {}; // New KPIs with real calculations
    const accessibleUsers = stats?.accessibleUsers || [];

    // Leaderboard calculation from trend data
    const leaderboardData = useMemo(() => {
        if (!stats?.userMap || !stats?.revenueTrend) return [];

        return Object.entries(stats.userMap).map(([uid, name]) => {
            let revenue = 0, orders = 0, quotes = 0;

            stats.revenueTrend.forEach(point => {
                revenue += (point[`revenue_${uid}`] || 0);
                orders += (point[`orders_${uid}`] || 0);
                quotes += (point[`quotes_${uid}`] || 0);
            });

            return {
                uid,
                name,
                revenue,
                orders,
                conversion: quotes > 0 ? Math.round((orders / quotes) * 100) : 0
            };
        });
    }, [stats?.userMap, stats?.revenueTrend]);

    // Error state
    if (error && !loading) {
        return (
            <div className="p-8 max-w-[1800px] mx-auto">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Dashboard</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                        <span>{error}</span>
                        <Button variant="outline" size="sm" onClick={fetchAnalytics}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6 max-w-[1800px] mx-auto bg-slate-50/50 min-h-screen">
            {/* ============================================
                HEADER WITH FILTERS
            ============================================ */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Sales Dashboard
                    </h1>
                    <p className="text-sm text-slate-500">
                        {isManager
                            ? `Team performance overview • ${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d, yyyy')}`
                            : `Your performance • ${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d, yyyy')}`
                        }
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <DashboardFilters
                        availableUsers={accessibleUsers}
                        selectedUsers={selectedUsers}
                        onUserChange={setSelectedUsers}
                        dateRange={dateRange}
                        onDateChange={setDateRange}
                    />
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={fetchAnalytics}
                        disabled={loading}
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* ============================================
                KPI SUMMARY CARDS (6 CARDS)
            ============================================ */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <MetricCard
                    title="Revenue"
                    value={formatCurrency(summary.totalRevenue || 0)}
                    subtext="From confirmed orders"
                    trend={kpis.revenueChange || 0}
                    trendDirection={(kpis.revenueChange || 0) >= 0 ? 'up' : 'down'}
                    icon={DollarSign}
                    loading={loading}
                />
                <MetricCard
                    title="Quoted Value"
                    value={formatCurrency(summary.totalQuotedValue || 0)}
                    subtext={`${summary.totalQuotations || 0} quotes`}
                    icon={FileText}
                    loading={loading}
                />
                <MetricCard
                    title="Orders"
                    value={summary.totalOrders?.toLocaleString() || '0'}
                    subtext="Confirmed orders"
                    trend={kpis.ordersChange || 0}
                    trendDirection={(kpis.ordersChange || 0) >= 0 ? 'up' : 'down'}
                    icon={ShoppingCart}
                    loading={loading}
                />
                <MetricCard
                    title="Conversion"
                    value={`${summary.conversionRate || 0}%`}
                    subtext="Quotes → Orders"
                    icon={Target}
                    loading={loading}
                />
                <MetricCard
                    title="Target"
                    value={kpis.targetAchievement ? `${kpis.targetAchievement}%` : '--'}
                    subtext={kpis.yearlyTarget ? `of ${formatCurrency(kpis.yearlyTarget, { compact: true })}` : 'Annual achievement'}
                    trend={kpis.targetAchievement >= 100 ? 10 : kpis.targetAchievement >= 80 ? 5 : null}
                    trendDirection={kpis.targetAchievement >= 80 ? 'up' : 'down'}
                    icon={BarChart3}
                    loading={loading}
                />
                <MetricCard
                    title="Customers"
                    value={(stats?.topCustomers?.length || 0).toString()}
                    subtext="Active in period"
                    icon={Users}
                    loading={loading}
                />
            </div>

            {/* ============================================
                HERO CHART (MAIN VISUALIZATION)
            ============================================ */}
            {loading ? (
                <Card className="border-slate-100 shadow-sm">
                    <CardContent className="p-6">
                        <Skeleton className="h-[350px] w-full" />
                    </CardContent>
                </Card>
            ) : (
                <HeroChart
                    data={stats?.revenueTrend || []}
                    userMap={stats?.userMap}
                    className="bg-white border-slate-100 shadow-sm"
                />
            )}

            {/* ============================================
                INSIGHTS ROW (3 COLUMN GRID)
            ============================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Funnel */}
                <Card className="border-slate-100 shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Sales Funnel
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SalesFunnel data={stats?.funnelData} loading={loading} />
                    </CardContent>
                </Card>

                {/* Top Products */}
                <Card className="border-slate-100 shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">
                            Top Products
                        </CardTitle>
                        <CardDescription className="text-xs">By revenue contribution</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ProductList data={stats?.topProducts} loading={loading} />
                    </CardContent>
                </Card>

                {/* Pipeline Status */}
                <Card className="border-slate-100 shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">
                            Pipeline Status
                        </CardTitle>
                        <CardDescription className="text-xs">Document distribution</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PipelineStatus data={stats?.pieData} loading={loading} />
                    </CardContent>
                </Card>
            </div>

            {/* ============================================
                BOTTOM ROW: LEADERBOARD + CUSTOMERS (MANAGER ONLY)
            ============================================ */}
            {isManager && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Performers */}
                    <Card className="border-slate-100 shadow-sm bg-white">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                🏆 Top Performers
                            </CardTitle>
                            <CardDescription>Revenue and conversion by team member</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TopPerformers data={leaderboardData} loading={loading} />
                        </CardContent>
                    </Card>

                    {/* Top Customers */}
                    <Card className="border-slate-100 shadow-sm bg-white">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Top Customers
                            </CardTitle>
                            <CardDescription>Highest revenue customers in period</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TopCustomers data={stats?.topCustomers} loading={loading} />
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
