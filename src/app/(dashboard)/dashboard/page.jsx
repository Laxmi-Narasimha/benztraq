'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { DashboardFilters } from '@/components/dashboard/dashboard-filters';
import { HeroChart } from '@/components/dashboard/hero-chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    TrendingUp, TrendingDown, DollarSign, FileText, ShoppingCart,
    Target, Users, RefreshCw, AlertCircle, BarChart3, Building2,
    ArrowUpRight, ArrowDownRight, Package, Percent, IndianRupee
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatting';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { cn } from '@/lib/utils';

// ============================================================================
// METRIC CARD — Glassmorphism style with trend indicator
// ============================================================================

function MetricCard({ title, value, subtext, trend, trendDirection, icon: Icon, loading, accent = 'neutral' }) {
    if (loading) {
        return (
            <Card className="overflow-hidden">
                <CardContent className="p-5">
                    <Skeleton className="h-9 w-9 rounded-lg mb-4" />
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-7 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                </CardContent>
            </Card>
        );
    }

    const accentStyles = {
        green: 'from-emerald-500/10 to-transparent border-emerald-200/50',
        blue: 'from-blue-500/10 to-transparent border-blue-200/50',
        sky: 'from-sky-500/10 to-transparent border-sky-200/50',
        amber: 'from-amber-500/10 to-transparent border-amber-200/50',
        rose: 'from-rose-500/10 to-transparent border-rose-200/50',
        neutral: 'from-neutral-100/50 to-transparent border-neutral-200/80',
    };

    const iconStyles = {
        green: 'bg-emerald-100 text-emerald-600',
        blue: 'bg-blue-100 text-blue-600',
        sky: 'bg-sky-100 text-sky-600',
        amber: 'bg-amber-100 text-amber-600',
        rose: 'bg-rose-100 text-rose-600',
        neutral: 'bg-neutral-100 text-neutral-500',
    };

    const TrendIcon = trendDirection === 'up' ? ArrowUpRight : ArrowDownRight;
    const hasTrend = trend !== null && trend !== undefined && trend !== 0;

    return (
        <Card className={cn(
            "overflow-hidden bg-gradient-to-br transition-all duration-200 hover:shadow-md",
            accentStyles[accent]
        )}>
            <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconStyles[accent])}>
                        <Icon className="h-5 w-5" />
                    </div>
                    {hasTrend && (
                        <div className={cn(
                            "flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full",
                            trendDirection === 'up'
                                ? 'text-emerald-700 bg-emerald-100'
                                : 'text-red-600 bg-red-100'
                        )}>
                            <TrendIcon className="h-3 w-3" />
                            {Math.abs(trend)}%
                        </div>
                    )}
                </div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">{title}</p>
                <p className="text-2xl font-bold text-neutral-900 tracking-tight">{value}</p>
                {subtext && <p className="text-xs text-neutral-400 mt-1">{subtext}</p>}
            </CardContent>
        </Card>
    );
}

// ============================================================================
// SALES FUNNEL — Real pipeline stages from document states  
// ============================================================================
function SalesFunnel({ data, loading }) {
    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-4/5 rounded-lg" />
                <Skeleton className="h-10 w-3/5 rounded-lg" />
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-8 text-neutral-400">
                <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No pipeline data yet</p>
            </div>
        );
    }

    const maxValue = Math.max(...data.map(d => d.value || 0), 1);
    const stageColors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981'];
    const stageIcons = ['📋', '📤', '🤝', '✅'];

    return (
        <div className="space-y-3">
            {data.map((stage, index) => {
                const width = (stage.value / maxValue) * 100;
                const dropoff = index > 0 && data[index - 1].value > 0
                    ? Math.round((1 - stage.value / data[index - 1].value) * 100)
                    : 0;

                return (
                    <div key={index}>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                                <span className="text-base">{stageIcons[index] || '📊'}</span>
                                {stage.name}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-neutral-900">{stage.value}</span>
                                {index > 0 && dropoff > 0 && (
                                    <span className="text-xs text-red-500 font-medium">-{dropoff}%</span>
                                )}
                            </div>
                        </div>
                        <div className="h-8 bg-neutral-100 rounded-lg overflow-hidden relative">
                            <div
                                className="h-full rounded-lg transition-all duration-700 ease-out"
                                style={{
                                    width: `${Math.max(width, 8)}%`,
                                    backgroundColor: stageColors[index] || '#6B7280',
                                }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ============================================================================
// PIPELINE STATUS — Donut-style visual  
// ============================================================================
function PipelineStatus({ data, loading }) {
    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
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
            <div className="text-center py-8 text-neutral-400">
                <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No documents yet</p>
            </div>
        );
    }

    const colors = [
        { bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-100' },
        { bg: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-100' },
        { bg: 'bg-amber-500', text: 'text-amber-700', light: 'bg-amber-100' },
        { bg: 'bg-red-500', text: 'text-red-700', light: 'bg-red-100' },
        { bg: 'bg-purple-500', text: 'text-purple-700', light: 'bg-purple-100' },
    ];
    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="space-y-4">
            {/* Stacked bar */}
            <div className="h-4 rounded-full overflow-hidden flex bg-neutral-100">
                {data.map((item, i) => (
                    <div
                        key={i}
                        className={cn("h-full transition-all duration-500", colors[i % colors.length].bg)}
                        style={{ width: total > 0 ? `${(item.value / total) * 100}%` : '0%' }}
                    />
                ))}
            </div>
            {/* Legend */}
            <div className="space-y-2">
                {data.map((item, i) => {
                    const c = colors[i % colors.length];
                    const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                    return (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={cn("w-2.5 h-2.5 rounded-full", c.bg)} />
                                <span className="text-sm text-neutral-600 capitalize">{item.name.replace('_', ' ')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded", c.light, c.text)}>
                                    {item.value}
                                </span>
                                <span className="text-xs text-neutral-400 w-8 text-right">{pct}%</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ============================================================================
// TOP PRODUCTS — with horizontal bars  
// ============================================================================
function TopProductsCard({ data, loading }) {
    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="space-y-1">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-2 w-full" />
                    </div>
                ))}
            </div>
        );
    }

    const sorted = [...(data || [])].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    const maxVal = sorted[0]?.revenue || 1;

    if (sorted.length === 0) {
        return (
            <div className="text-center py-8 text-neutral-400">
                <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No product data</p>
            </div>
        );
    }

    return (
        <div className="space-y-3.5">
            {sorted.map((item, i) => (
                <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-neutral-800 truncate max-w-[200px]" title={item.name}>
                            {item.name}
                        </span>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-xs text-neutral-400">{item.orders || item.count || 0} orders</span>
                            <span className="text-xs font-bold text-neutral-900">
                                {formatCurrency(item.revenue, { compact: true })}
                            </span>
                        </div>
                    </div>
                    <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                                width: `${(item.revenue / maxVal) * 100}%`,
                                background: `linear-gradient(90deg, #6366f1, #818cf8)`,
                            }}
                        />
                    </div>
                </div>
            ))}
        </div>
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
            <div className="text-center py-8 text-neutral-400">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No team performance data available</p>
            </div>
        );
    }

    const sorted = [...data].sort((a, b) => (b.revenue || 0) - (a.revenue || 0)).slice(0, 5);
    const maxRevenue = sorted[0]?.revenue || 1;
    const medals = ['🥇', '🥈', '🥉'];

    return (
        <div className="space-y-2">
            {sorted.map((user, index) => (
                <div key={user.uid || index} className="rounded-lg p-3 hover:bg-neutral-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold",
                                index === 0 ? 'bg-amber-100 text-amber-700' :
                                    index === 1 ? 'bg-neutral-200 text-neutral-700' :
                                        index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-neutral-50 text-neutral-500'
                            )}>
                                {index < 3 ? medals[index] : index + 1}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-neutral-900">{user.name}</p>
                                <div className="flex items-center gap-2 text-xs text-neutral-500">
                                    <span>{user.orders || 0} orders</span>
                                    <span>•</span>
                                    <span className={user.conversion >= 30 ? 'text-emerald-600 font-medium' : ''}>
                                        {user.conversion || 0}% conv
                                    </span>
                                </div>
                            </div>
                        </div>
                        <span className="text-sm font-bold text-neutral-900">
                            {formatCurrency(user.revenue, { compact: true })}
                        </span>
                    </div>
                    {/* Revenue bar */}
                    <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden ml-12">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${(user.revenue / maxRevenue) * 100}%`,
                                background: index === 0 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' :
                                    index === 1 ? 'linear-gradient(90deg, #9ca3af, #d1d5db)' :
                                        'linear-gradient(90deg, #6366f1, #a5b4fc)',
                            }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ============================================================================
// TOP CUSTOMERS
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
            <div className="text-center py-8 text-neutral-400">
                <Building2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No customer data</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {data.slice(0, 5).map((customer, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 hover:bg-neutral-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-500">
                            {(customer.name || '?')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-neutral-800 truncate">{customer.name}</p>
                            <p className="text-xs text-neutral-400">{customer.orders} orders</p>
                        </div>
                    </div>
                    <p className="text-sm font-bold text-neutral-900 ml-4">
                        {formatCurrency(customer.revenue, { compact: true })}
                    </p>
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

    // Derived data
    const { isManager: authIsManager } = useAuth();
    const isManager = stats?.isManager ?? authIsManager;
    const summary = stats?.summaryMetrics || {};
    const kpis = stats?.kpis || {};
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
        <div className="space-y-6 p-6 max-w-[1800px] mx-auto min-h-screen">
            {/* ============================================
                HEADER WITH FILTERS
            ============================================ */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                        Sales Dashboard
                    </h1>
                    <p className="text-sm text-neutral-500">
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
                        className="shrink-0"
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
                    value={formatCurrency(summary.totalRevenue || 0, { compact: true })}
                    subtext="From confirmed orders"
                    trend={kpis.revenueChange || null}
                    trendDirection={(kpis.revenueChange || 0) >= 0 ? 'up' : 'down'}
                    icon={IndianRupee}
                    accent="green"
                    loading={loading}
                />
                <MetricCard
                    title="Quoted Value"
                    value={formatCurrency(summary.totalQuotedValue || 0, { compact: true })}
                    subtext={`${summary.totalQuotations || 0} quotations`}
                    icon={FileText}
                    accent="blue"
                    loading={loading}
                />
                <MetricCard
                    title="Orders"
                    value={summary.totalOrders?.toLocaleString() || '0'}
                    subtext="Confirmed orders"
                    trend={kpis.ordersChange || null}
                    trendDirection={(kpis.ordersChange || 0) >= 0 ? 'up' : 'down'}
                    icon={ShoppingCart}
                    accent="sky"
                    loading={loading}
                />
                <MetricCard
                    title="Conversion"
                    value={`${summary.conversionRate || 0}%`}
                    subtext="Quotes → Orders"
                    icon={Percent}
                    accent="amber"
                    loading={loading}
                />
                <MetricCard
                    title="Target"
                    value={kpis.targetAchievement ? `${kpis.targetAchievement}%` : '--'}
                    subtext={kpis.yearlyTarget ? `of ${formatCurrency(kpis.yearlyTarget, { compact: true })}` : 'Annual achievement'}
                    trend={kpis.targetAchievement >= 100 ? 10 : kpis.targetAchievement >= 80 ? 5 : null}
                    trendDirection={kpis.targetAchievement >= 80 ? 'up' : 'down'}
                    icon={Target}
                    accent="rose"
                    loading={loading}
                />
                <MetricCard
                    title="Avg. Order"
                    value={formatCurrency(summary.avgOrderValue || 0, { compact: true })}
                    subtext="Per sales order"
                    icon={BarChart3}
                    accent="neutral"
                    loading={loading}
                />
            </div>

            {/* ============================================
                HERO CHART (MAIN VISUALIZATION)
            ============================================ */}
            {loading ? (
                <Card>
                    <CardContent className="p-6">
                        <Skeleton className="h-[350px] w-full" />
                    </CardContent>
                </Card>
            ) : (
                <HeroChart
                    data={stats?.revenueTrend || []}
                    userMap={stats?.userMap}
                    className="bg-white shadow-sm border-neutral-200/80"
                />
            )}

            {/* ============================================
                INSIGHTS ROW (3 COLUMN GRID)
            ============================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Funnel */}
                <Card className="shadow-sm border-neutral-200/80">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                                <BarChart3 className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-semibold">Sales Funnel</CardTitle>
                                <CardDescription className="text-xs">Quote to order progression</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <SalesFunnel data={stats?.funnelData} loading={loading} />
                    </CardContent>
                </Card>

                {/* Top Products */}
                <Card className="shadow-sm border-neutral-200/80">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
                                <Package className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-semibold">Top Products</CardTitle>
                                <CardDescription className="text-xs">By revenue contribution</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <TopProductsCard data={stats?.topProducts} loading={loading} />
                    </CardContent>
                </Card>

                {/* Pipeline Status */}
                <Card className="shadow-sm border-neutral-200/80">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                                <FileText className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-semibold">Pipeline Status</CardTitle>
                                <CardDescription className="text-xs">Document distribution</CardDescription>
                            </div>
                        </div>
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
                    <Card className="shadow-sm border-neutral-200/80">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                                    <span className="text-base">🏆</span>
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold">Top Performers</CardTitle>
                                    <CardDescription className="text-xs">Revenue and conversion by team member</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <TopPerformers data={leaderboardData} loading={loading} />
                        </CardContent>
                    </Card>

                    {/* Top Customers */}
                    <Card className="shadow-sm border-neutral-200/80">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center">
                                    <Building2 className="h-4 w-4 text-neutral-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold">Top Customers</CardTitle>
                                    <CardDescription className="text-xs">Highest revenue customers in period</CardDescription>
                                </div>
                            </div>
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
