'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import DirectorAppGrid from '@/components/dashboard/DirectorAppGrid';
import { DashboardFilters } from '@/components/dashboard/dashboard-filters';
import { HeroChart } from '@/components/dashboard/hero-chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    TrendingUp, TrendingDown, IndianRupee, FileText, ShoppingCart,
    Target, Users, RefreshCw, AlertCircle, BarChart3, Building2,
    ArrowUpRight, ArrowDownRight, Package, Percent, Trophy,
    MapPin, ChevronRight
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatting';
import { subMonths, endOfMonth, format } from 'date-fns';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// KPI CARD — clean, white, minimal
// ─────────────────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, trend, icon: Icon, loading }) {
    if (loading) return (
        <Card><CardContent className="p-5"><Skeleton className="h-4 w-16 mb-3" /><Skeleton className="h-7 w-28 mb-1" /><Skeleton className="h-3 w-20" /></CardContent></Card>
    );
    const up = trend > 0;
    return (
        <Card className="hover:shadow-sm transition-shadow">
            <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded bg-stone-100 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-stone-500" />
                    </div>
                    {trend !== undefined && trend !== null && trend !== 0 && (
                        <span className={cn("text-xs font-medium flex items-center gap-0.5",
                            up ? "text-emerald-600" : "text-red-500")}>
                            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {Math.abs(trend)}%
                        </span>
                    )}
                </div>
                <p className="text-xs text-stone-400 font-medium mb-1">{label}</p>
                <p className="text-xl font-bold text-stone-900 tracking-tight">{value}</p>
                {sub && <p className="text-xs text-stone-400 mt-1.5">{sub}</p>}
            </CardContent>
        </Card>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TARGET ACHIEVEMENT — per-region progress bars
// ─────────────────────────────────────────────────────────────────────────────
function RegionalTargets({ targets, loading }) {
    if (loading) return (
        <div className="space-y-4">{[1, 2, 3, 4].map(i => <div key={i}><Skeleton className="h-4 w-28 mb-2" /><Skeleton className="h-3 w-full" /></div>)}</div>
    );
    if (!targets || targets.length === 0) return (
        <div className="text-center py-10 text-stone-400">
            <Target className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No targets set for this year</p>
            <p className="text-xs mt-1">Go to Targets to set regional goals</p>
        </div>
    );

    const sorted = [...targets].sort((a, b) => {
        const aPct = a.annualTarget > 0 ? (a.totalAchieved / a.annualTarget) : 0;
        const bPct = b.annualTarget > 0 ? (b.totalAchieved / b.annualTarget) : 0;
        return bPct - aPct;
    });

    return (
        <div className="space-y-4">
            {sorted.map((t, i) => {
                const pct = t.annualTarget > 0 ? Math.min(Math.round((t.totalAchieved / t.annualTarget) * 100), 100) : 0;
                const overTarget = t.totalAchieved >= t.annualTarget && t.annualTarget > 0;
                return (
                    <div key={i}>
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                                <MapPin className="h-3.5 w-3.5 text-stone-400" />
                                <span className="text-sm font-medium text-stone-800">{t.salespersonName}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-stone-500">
                                <span>{formatCurrency(t.totalAchieved, { compact: true })}</span>
                                <span className="text-stone-300">/</span>
                                <span>{formatCurrency(t.annualTarget, { compact: true })}</span>
                                <span className={cn("font-bold min-w-[36px] text-right",
                                    pct >= 80 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-500"
                                )}>{pct}%</span>
                            </div>
                        </div>
                        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full transition-all duration-700",
                                overTarget ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400"
                            )} style={{ width: `${Math.max(pct, 2)}%` }} />
                        </div>
                    </div>
                );
            })}
            {/* Total summary */}
            {(() => {
                const totalTarget = sorted.reduce((s, t) => s + t.annualTarget, 0);
                const totalAchieved = sorted.reduce((s, t) => s + t.totalAchieved, 0);
                const totalPct = totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0;
                return (
                    <div className="pt-3 mt-3 border-t border-stone-100">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-stone-900">Total</span>
                            <div className="flex items-center gap-3 text-xs">
                                <span className="text-stone-600 font-medium">{formatCurrency(totalAchieved, { compact: true })}</span>
                                <span className="text-stone-300">/</span>
                                <span className="text-stone-500">{formatCurrency(totalTarget, { compact: true })}</span>
                                <span className={cn("font-bold",
                                    totalPct >= 80 ? "text-emerald-600" : "text-amber-600"
                                )}>{totalPct}%</span>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// REGIONAL PERFORMANCE TABLE — revenue, orders, avg per region
// ─────────────────────────────────────────────────────────────────────────────
function RegionalPerformance({ data, loading }) {
    if (loading) return (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
    );
    if (!data || data.length === 0) return (
        <div className="text-center py-10 text-stone-400">
            <MapPin className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No regional data</p>
        </div>
    );
    const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
    return (
        <div className="overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-stone-100">
                        <th className="text-left py-2 text-xs font-medium text-stone-400 uppercase">Region</th>
                        <th className="text-right py-2 text-xs font-medium text-stone-400 uppercase">Orders</th>
                        <th className="text-right py-2 text-xs font-medium text-stone-400 uppercase">Revenue</th>
                        <th className="text-right py-2 text-xs font-medium text-stone-400 uppercase w-28">Share</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((r, i) => {
                        const share = maxRevenue > 0 ? (r.revenue / maxRevenue) * 100 : 0;
                        return (
                            <tr key={i} className="border-b border-stone-50 hover:bg-stone-50 transition-colors">
                                <td className="py-2.5 font-medium text-stone-800">{r.region}</td>
                                <td className="py-2.5 text-right text-stone-600">{r.orders}</td>
                                <td className="py-2.5 text-right font-medium text-stone-900">
                                    {formatCurrency(r.revenue, { compact: true })}
                                </td>
                                <td className="py-2.5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <div className="w-16 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-stone-800 rounded-full" style={{ width: `${share}%` }} />
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOP PRODUCTS — list with bars
// ─────────────────────────────────────────────────────────────────────────────
function TopProducts({ data, loading }) {
    if (loading) return (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i}><Skeleton className="h-4 w-28 mb-1" /><Skeleton className="h-2 w-full" /></div>)}</div>
    );
    const sorted = [...(data || [])].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    const maxVal = sorted[0]?.revenue || 1;
    if (sorted.length === 0) return (
        <div className="text-center py-10 text-stone-400">
            <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No product data</p>
        </div>
    );
    return (
        <div className="space-y-3">
            {sorted.map((p, i) => (
                <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-stone-700 truncate max-w-[200px]" title={p.name}>{p.name}</span>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-xs text-stone-400">{p.orders || p.count || 0}</span>
                            <span className="text-xs font-bold text-stone-800">{formatCurrency(p.revenue, { compact: true })}</span>
                        </div>
                    </div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div className="h-full bg-stone-700 rounded-full transition-all duration-500"
                            style={{ width: `${(p.revenue / maxVal) * 100}%` }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOP CUSTOMERS
// ─────────────────────────────────────────────────────────────────────────────
function TopCustomers({ data, loading }) {
    if (loading) return (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="flex items-center justify-between"><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-16" /></div>)}</div>
    );
    if (!data || data.length === 0) return (
        <div className="text-center py-10 text-stone-400">
            <Building2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No customers yet</p>
        </div>
    );
    return (
        <div className="space-y-1">
            {data.slice(0, 5).map((c, i) => (
                <div key={i} className="flex items-center justify-between py-2 hover:bg-stone-50 rounded-lg px-2 transition-colors">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-500">
                            {(c.name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-stone-800 truncate max-w-[180px]">{c.name}</p>
                            <p className="text-xs text-stone-400">{c.orders} order{c.orders !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <span className="text-sm font-bold text-stone-800">{formatCurrency(c.revenue, { compact: true })}</span>
                </div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNNEL
// ─────────────────────────────────────────────────────────────────────────────
function SalesFunnel({ data, loading }) {
    if (loading) return <div className="space-y-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-8 w-full" />)}</div>;
    if (!data || data.length === 0) return (
        <div className="text-center py-10 text-stone-400">
            <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No pipeline data</p>
        </div>
    );
    const maxVal = Math.max(...data.map(d => d.value || 0), 1);
    return (
        <div className="space-y-3">
            {data.map((s, i) => {
                const w = (s.value / maxVal) * 100;
                return (
                    <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-stone-600">{s.name}</span>
                            <span className="text-sm font-bold text-stone-800">{s.value}</span>
                        </div>
                        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-stone-600 transition-all duration-500"
                                style={{ width: `${Math.max(w, 4)}%` }} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═════════════════════════════════════════════════════════════════════════════
function DashboardContent() {
    const { user, profile } = useAuth();
    const searchParams = useSearchParams();
    const viewMode = searchParams.get('view');

    // Directors see the app grid launcher unless they explicitly navigate to ?view=analytics
    const isDirector = profile?.role === 'director';
    const showAppGrid = isDirector && viewMode !== 'analytics';

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);
    const [targets, setTargets] = useState([]);
    const [targetsLoading, setTargetsLoading] = useState(true);

    // Filters
    const [dateRange, setDateRange] = useState({
        from: subMonths(new Date(), 6),
        to: endOfMonth(new Date())
    });
    const [selectedUsers, setSelectedUsers] = useState([]);

    // Fetch analytics
    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                from: dateRange.from.toISOString(),
                to: dateRange.to.toISOString(),
                users: selectedUsers.join(',')
            });
            const res = await fetch(`/api/dashboard/analytics?${params}`);
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch');
            setStats(await res.json());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [dateRange, selectedUsers]);

    // Fetch targets
    const fetchTargets = useCallback(async () => {
        setTargetsLoading(true);
        try {
            const res = await fetch(`/api/targets?year=${new Date().getFullYear()}`);
            if (res.ok) {
                const data = await res.json();
                setTargets(data.targets || []);
            }
        } catch (e) {
            console.error('Targets fetch error:', e);
        } finally {
            setTargetsLoading(false);
        }
    }, []);

    useEffect(() => { fetchAnalytics(); fetchTargets(); }, [fetchAnalytics, fetchTargets]);

    // Derived
    const { isManager: authIsManager } = useAuth();
    const isManager = stats?.isManager ?? authIsManager;
    const kpis = stats?.kpis || {};
    const summary = stats?.summaryMetrics || {};
    const accessibleUsers = stats?.accessibleUsers || [];

    // Error
    if (error && !loading) return (
        <div className="p-8 max-w-[1600px] mx-auto">
            <Alert variant="destructive"><AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                    <span>{error}</span>
                    <Button variant="outline" size="sm" onClick={fetchAnalytics}><RefreshCw className="h-4 w-4 mr-2" />Retry</Button>
                </AlertDescription>
            </Alert>
        </div>
    );

    // Directors: show app grid launcher
    if (showAppGrid) {
        return <DirectorAppGrid />;
    }

    return (
        <div className="space-y-6 p-6 max-w-[1600px] mx-auto">

            {/* ── HEADER ── */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-stone-900">Sales Dashboard</h1>
                    <p className="text-sm text-stone-400">
                        {isManager ? 'Team performance overview' : 'Your performance'} · {format(dateRange.from, 'MMM d')} – {format(dateRange.to, 'MMM d, yyyy')}
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
                    <Button variant="outline" size="icon" onClick={() => { fetchAnalytics(); fetchTargets(); }} disabled={loading} className="shrink-0">
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* ── KPI ROW ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <KpiCard label="Revenue" value={formatCurrency(summary.totalRevenue || 0, { compact: true })}
                    sub="Confirmed orders" trend={kpis.revenueChange} icon={IndianRupee} loading={loading} />
                <KpiCard label="Quoted Value" value={formatCurrency(summary.totalQuotedValue || 0, { compact: true })}
                    sub={`${summary.totalQuotations || 0} quotations`} icon={FileText} loading={loading} />
                <KpiCard label="Orders" value={String(summary.totalOrders || 0)}
                    sub="Confirmed" trend={kpis.ordersChange} icon={ShoppingCart} loading={loading} />
                <KpiCard label="Conversion" value={`${summary.conversionRate || 0}%`}
                    sub="Quotes → Orders" icon={Percent} loading={loading} />
                <KpiCard label="Target Ach." value={kpis.targetAchievement ? `${kpis.targetAchievement}%` : '–'}
                    sub={kpis.yearlyTarget ? `of ${formatCurrency(kpis.yearlyTarget, { compact: true })}` : 'Annual'} icon={Target} loading={loading} />
                <KpiCard label="Avg. Order" value={formatCurrency(summary.avgOrderValue || 0, { compact: true })}
                    sub="Per order" icon={BarChart3} loading={loading} />
            </div>

            {/* ── REVENUE CHART ── */}
            {loading ? (
                <Card><CardContent className="p-6"><Skeleton className="h-[320px] w-full" /></CardContent></Card>
            ) : (
                <HeroChart data={stats?.revenueTrend || []} userMap={stats?.userMap} />
            )}

            {/* ── TARGETS + REGIONAL (2-col) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">Target Achievement</CardTitle>
                                <CardDescription className="text-xs">Annual target vs. achieved by region · {new Date().getFullYear()}</CardDescription>
                            </div>
                            <a href="/targets" className="text-xs text-stone-400 hover:text-stone-600 flex items-center gap-1">
                                Manage <ChevronRight className="h-3 w-3" />
                            </a>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <RegionalTargets targets={targets} loading={targetsLoading} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">Regional Performance</CardTitle>
                        <CardDescription className="text-xs">Revenue and orders by sales region</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RegionalPerformance data={stats?.regionalData} loading={loading} />
                    </CardContent>
                </Card>
            </div>

            {/* ── FUNNEL + PRODUCTS + CUSTOMERS (3-col) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">Sales Funnel</CardTitle>
                        <CardDescription className="text-xs">Quote → Order pipeline</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SalesFunnel data={stats?.funnelData} loading={loading} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">Top Products</CardTitle>
                        <CardDescription className="text-xs">By revenue</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TopProducts data={stats?.topProducts} loading={loading} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">Top Customers</CardTitle>
                        <CardDescription className="text-xs">By revenue</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TopCustomers data={stats?.topCustomers} loading={loading} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}
