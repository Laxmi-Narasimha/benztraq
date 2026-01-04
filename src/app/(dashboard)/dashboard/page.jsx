'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers/auth-provider';
import { DashboardFilters } from '@/components/dashboard/dashboard-filters';
import { HeroChart } from '@/components/dashboard/hero-chart';
import { FunnelChart, ProductList } from '@/components/dashboard/insights';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Users, ArrowUpRight, ArrowDownRight, Activity, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatting';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

/**
 * Premium Metric Card
 * Minimalist, high-contrast, professional.
 */
function MetricCard({ title, value, subtext, trend, icon: Icon, trendUp }) {
    return (
        <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
                        <Icon className="h-5 w-5" />
                    </div>
                    {trend && (
                        <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            {trendUp ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                            {trend}
                        </div>
                    )}
                </div>
                <div className="space-y-1">
                    <h3 className="text-sm font-medium text-slate-500">{title}</h3>
                    <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
                </div>
                {subtext && <p className="text-xs text-slate-400 mt-2">{subtext}</p>}
            </CardContent>
        </Card>
    );
}

/**
 * Top Performers List (Clean Table)
 */
function TopPerformers({ data }) {
    if (!data || data.length === 0) return <div className="text-sm text-slate-400 p-4">No data available</div>;

    // Sort by revenue
    const sorted = [...data].sort((a, b) => (b.revenue || 0) - (a.revenue || 0)).slice(0, 5);

    return (
        <div className="space-y-4">
            {sorted.map((user, index) => (
                <div key={user.uid || index} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors group">
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs ${index === 0 ? 'bg-amber-100 text-amber-700' :
                            index === 1 ? 'bg-slate-200 text-slate-700' :
                                index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-slate-50 text-slate-500'
                            }`}>
                            {index + 1}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-900">{user.name}</p>
                            <p className="text-xs text-slate-500">{user.orders || 0} orders</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{formatCurrency(user.revenue)}</p>
                        <p className="text-xs text-emerald-600 font-medium">{user.conversion}% conv</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function DashboardPage() {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [filters, setFilters] = useState({
        dateRange: {
            from: startOfMonth(new Date()),
            to: endOfMonth(new Date())
        },
        selectedUsers: []
    });

    const supabase = createClient();

    // Fetch Analytics Data
    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                from: filters.dateRange.from.toISOString(),
                to: filters.dateRange.to.toISOString(),
                users: filters.selectedUsers.join(',')
            });

            const res = await fetch(`/api/dashboard/analytics?${queryParams}`);
            if (!res.ok) throw new Error('Failed to fetch analytics');
            const data = await res.json();

            setStats(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [filters]);

    // Role Logic
    const isManager = profile?.role === 'vp' || profile?.role === 'director' || profile?.role === 'head_of_sales';

    // Calculate Summary Metrics from Chart Data
    // We strictly use the aggregated fields from the trend data
    const summary = stats?.revenueTrend?.reduce((acc, curr) => ({
        revenue: acc.revenue + (curr.revenue || 0),
        quotations_value: acc.quotations_value + (curr.quotations_value || 0),
        orders: acc.orders + (curr.orders || 0),
        quotations: acc.quotations + (curr.quotations || 0),
    }), { revenue: 0, quotations_value: 0, orders: 0, quotations: 0 }) || { revenue: 0, quotations_value: 0, orders: 0, quotations: 0 };

    const conversionRate = summary.quotations > 0
        ? Math.round((summary.orders / summary.quotations) * 100)
        : 0;

    // Leaderboard Data Calculation
    const leaderboardData = [];
    if (stats?.userMap) {
        Object.entries(stats.userMap).forEach(([uid, name]) => {
            let userRev = 0;
            let userOrders = 0;
            let userQuotes = 0;

            stats.revenueTrend.forEach(point => {
                userRev += (point[`revenue_${uid}`] || 0);
                userOrders += (point[`orders_${uid}`] || 0);
                userQuotes += (point[`quotes_${uid}`] || 0);
            });

            leaderboardData.push({
                uid,
                name,
                revenue: userRev,
                orders: userOrders,
                conversion: userQuotes > 0 ? Math.round((userOrders / userQuotes) * 100) : 0
            });
        });
    }

    // Prepare Insight Data
    // Funnel: Quotes vs Orders (Count)
    const funnelData = [
        { name: 'Quotations', value: summary.quotations },
        { name: 'Orders', value: summary.orders, conversion: conversionRate }
    ];

    // Placeholder Product Data (Ideally API would return this, hardcoding for now if missing or mocking)
    // Assuming API adds it, or we fallback to empty
    const productData = stats?.topProducts || [];

    return (
        <div className="space-y-6 p-6 max-w-[1800px] mx-auto bg-slate-50/50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Overview
                    </h1>
                    <p className="text-sm text-slate-500">
                        {isManager ? "Performance across your sales team." : "Your personal performance metrics."}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <DashboardFilters
                        onChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
                        showUserSelect={isManager}
                        defaultDateRange={{ from: subMonths(new Date(), 6), to: endOfMonth(new Date()) }}
                    />
                </div>
            </div>

            {/* Row 1: KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Revenue"
                    value={formatCurrency(summary.revenue)}
                    subtext={`${summary.orders} confirmed orders`}
                    icon={Activity}
                    trend="12.5%"
                    trendUp={true}
                />
                <MetricCard
                    title="Quoted Value"
                    value={formatCurrency(summary.quotations_value)}
                    subtext={`${summary.quotations} active quotes`}
                    icon={Calendar}
                />
                <MetricCard
                    title="Avg Order Value"
                    value={summary.orders > 0 ? formatCurrency(summary.revenue / summary.orders, { compact: true }) : '₹0'}
                    subtext="Per confirmed order"
                    icon={Users}
                />
                <MetricCard
                    title="Conversion Rate"
                    value={`${conversionRate}%`}
                    subtext="Quotes to Orders"
                    icon={Trophy}
                    trend="2.1%"
                    trendUp={true}
                />
            </div>

            {/* Row 2: Hero Chart (Dominant) */}
            <HeroChart
                data={stats?.revenueTrend || []}
                userMap={stats?.userMap}
                className="col-span-1 border-slate-200/60 shadow-sm bg-white"
            />

            {/* Row 3: Connected Insights (Grid) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Funnel */}
                <FunnelChart data={funnelData} className="bg-white" />

                {/* 2. Top Products (Mock/Placeholder until API finalized or empty) */}
                <ProductList data={productData} className="bg-white" />

                {/* 3. Status Distribution (Existing Pie Logic or new) */}
                <Card className="border-slate-100 shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Pipeline Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 pt-2">
                            {(stats?.pieData || []).map((item, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-red-500'][i % 4]}`} />
                                        <span className="text-sm text-slate-600 capitalize">{item.name.replace('_', ' ')}</span>
                                    </div>
                                    <span className="text-sm font-semibold text-slate-900">{item.value}</span>
                                </div>
                            ))}
                            {(!stats?.pieData || stats.pieData.length === 0) && (
                                <p className="text-sm text-slate-400">No status data available.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Row 4: Leaderboard (Manager Only) */}
            {isManager && (
                <div className="grid grid-cols-1 gap-6">
                    <Card className="border-slate-100 shadow-sm bg-white">
                        <CardHeader>
                            <CardTitle className="text-lg">Top Performers</CardTitle>
                            <CardDescription>Revenue contribution by team member</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TopPerformers data={leaderboardData} />
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
