'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Trophy, TrendingUp, TrendingDown, Users, Target, Activity,
    BarChart3, Eye, ArrowUpRight, ArrowDownRight, AlertTriangle,
    CheckCircle, XCircle, Minus, Calendar, RefreshCw, ChevronUp,
    ChevronDown, Zap, Heart, Brain, Loader2
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ComposedChart, Tooltip, Legend, XAxis, YAxis, CartesianGrid,
    ResponsiveContainer, FunnelChart, Funnel, LabelList, ScatterChart,
    Scatter
} from 'recharts';

// ============================================================================
// CONSTANTS & HELPERS
// ============================================================================

const COLORS = {
    primary: '#4f46e5',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#0ea5e9',
    muted: '#94a3b8',
    pink: '#ec4899',
    teal: '#14b8a6',
    orange: '#f97316',
};

const CHART_COLORS = ['#4f46e5', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9'];

const fmt = (n) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
    return `₹${Math.round(n)}`;
};

const fmtNum = (n) => n?.toLocaleString('en-IN') ?? '0';

const getStatusColor = (value, thresholds) => {
    if (value >= thresholds[0]) return COLORS.success;
    if (value >= thresholds[1]) return COLORS.warning;
    return COLORS.danger;
};

const getStatusBadge = (priority) => {
    switch (priority) {
        case 'on_track': return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">On Track</Badge>;
        case 'monitor': return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30">Monitor</Badge>;
        case 'needs_attention': return <Badge className="bg-red-500/15 text-red-600 border-red-500/30">Needs Attention</Badge>;
        default: return <Badge variant="outline">-</Badge>;
    }
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white/90 backdrop-blur-md dark:bg-neutral-900/90 p-3 rounded-xl shadow-2xl border border-white/20 dark:border-white/10 text-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
            <p className="font-semibold mb-2 text-neutral-800 dark:text-neutral-200">{label}</p>
            <div className="space-y-1.5">
                {payload.map((p, i) => (
                    <div key={i} className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                            <span className="text-neutral-600 dark:text-neutral-400 capitalize">{p.name}:</span>
                        </div>
                        <span className="font-mono font-medium text-neutral-900 dark:text-neutral-100">
                            {typeof p.value === 'number' && p.value > 1000 ? fmt(p.value) : fmtNum(p.value)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ============================================================================
// KPI CARD
// ============================================================================

function KpiCard({ title, value, subtitle, icon: Icon, trend, trendLabel, color = COLORS.primary }) {
    return (
        <Card className="relative overflow-hidden group border-0 shadow-sm hover:shadow-xl transition-all duration-300 bg-white dark:bg-neutral-900 ring-1 ring-neutral-200/50 dark:ring-neutral-800/50">
            {/* Soft gradient background */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ background: `linear-gradient(135deg, ${color} 0%, transparent 100%)` }} />

            <CardContent className="p-5 relative z-10">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">{title}</p>
                        <p className="text-3xl font-black tracking-tighter text-neutral-900 dark:text-white" style={{ textShadow: `0 2px 10px ${color}15` }}>{value}</p>
                        {subtitle && <p className="text-xs text-neutral-400 font-medium">{subtitle}</p>}
                    </div>
                    <div className="p-3 rounded-2xl shadow-sm transition-transform group-hover:scale-110" style={{ backgroundColor: `${color}15`, color }}>
                        <Icon className="w-5 h-5" />
                    </div>
                </div>
                {trend !== undefined && (
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-medium">
                        <div className={`flex items-center justify-center p-0.5 rounded-full ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                            {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        </div>
                        <span className={trend >= 0 ? 'text-emerald-600' : 'text-red-600'}>{Math.abs(trend)}%</span>
                        {trendLabel && <span className="text-neutral-400">{trendLabel}</span>}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ============================================================================
// TAB 1: EXECUTIVE SCORECARD
// ============================================================================

function ScorecardTab({ asmData, totals }) {
    const sorted = [...asmData].sort((a, b) => b.revenue - a.revenue);
    return (
        <div className="space-y-6">
            {/* KPI Summary Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <KpiCard title="Total Visits" value={fmtNum(totals.totalVisits)} icon={Eye} color={COLORS.info} />
                <KpiCard title="Quotations" value={fmtNum(totals.totalQuotations)} icon={BarChart3} color={COLORS.secondary} />
                <KpiCard title="Orders Won" value={fmtNum(totals.totalOrders)} icon={CheckCircle} color={COLORS.success} />
                <KpiCard title="Revenue" value={fmt(totals.totalRevenue)} icon={TrendingUp} color={COLORS.primary} />
                <KpiCard title="Target" value={fmt(totals.totalTarget)} icon={Target} color={COLORS.warning} />
                <KpiCard title="Avg Activity" value={totals.avgActivityScore} subtitle="out of 100" icon={Zap} color={COLORS.pink} />
            </div>

            {/* Leaderboard Table */}
            <Card className="border-0 shadow-lg ring-1 ring-neutral-200/50 dark:ring-neutral-800/50 overflow-hidden bg-white/50 dark:bg-neutral-900/50 backdrop-blur-3xl">
                <CardHeader className="pb-4 bg-white dark:bg-neutral-900">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600"><Trophy className="w-5 h-5" /></div>
                        ASM Leaderboard
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 bg-white dark:bg-neutral-900">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-100 dark:border-neutral-800 text-neutral-500 uppercase text-xs font-bold tracking-wider">
                                    <th className="text-left p-3 font-semibold">#</th>
                                    <th className="text-left p-3 font-semibold">ASM</th>
                                    <th className="text-right p-3 font-semibold">Visits</th>
                                    <th className="text-right p-3 font-semibold">Quotes</th>
                                    <th className="text-right p-3 font-semibold">Orders</th>
                                    <th className="text-right p-3 font-semibold">Revenue</th>
                                    <th className="text-right p-3 font-semibold">Target</th>
                                    <th className="text-right p-3 font-semibold">Attainment</th>
                                    <th className="text-right p-3 font-semibold">Activity</th>
                                    <th className="text-right p-3 font-semibold">Pipeline Health</th>
                                    <th className="text-center p-3 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map((asm, i) => (
                                    <tr key={asm.id} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                                        <td className="p-3 font-bold text-neutral-400">{i + 1}</td>
                                        <td className="p-3 font-medium">{asm.name}</td>
                                        <td className="p-3 text-right font-mono">{asm.totalVisits}</td>
                                        <td className="p-3 text-right font-mono">{asm.totalQuotations}</td>
                                        <td className="p-3 text-right font-mono">{asm.totalOrders}</td>
                                        <td className="p-3 text-right font-mono font-medium">{fmt(asm.revenue)}</td>
                                        <td className="p-3 text-right font-mono text-neutral-500">{fmt(asm.annualTarget)}</td>
                                        <td className="p-3 text-right">
                                            <span className="font-mono font-medium" style={{ color: getStatusColor(asm.quotaAttainment, [80, 60]) }}>
                                                {asm.quotaAttainment}%
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="w-16 h-2 rounded-full bg-neutral-200 dark:bg-neutral-700">
                                                    <div className="h-full rounded-full transition-all" style={{
                                                        width: `${Math.min(asm.activityScore, 100)}%`,
                                                        backgroundColor: getStatusColor(asm.activityScore, [60, 35]),
                                                    }} />
                                                </div>
                                                <span className="font-mono text-xs">{asm.activityScore}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-right">
                                            <span className="font-mono text-xs px-2 py-1 rounded-full" style={{
                                                backgroundColor: `${getStatusColor(asm.pipelineHealthScore, [60, 35])}20`,
                                                color: getStatusColor(asm.pipelineHealthScore, [60, 35]),
                                            }}>
                                                {asm.pipelineHealthScore}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center">{getStatusBadge(asm.coachingPriority)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Revenue Sparklines */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sorted.map((asm, i) => (
                    <Card key={asm.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <p className="font-medium text-sm">{asm.name}</p>
                                    <p className="text-lg font-bold">{fmt(asm.revenue)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-neutral-500">Win Rate</p>
                                    <p className="font-medium">{asm.winRate}%</p>
                                </div>
                            </div>
                            <ResponsiveContainer width="100%" height={60}>
                                <AreaChart data={asm.monthlyTrend}>
                                    <defs>
                                        <linearGradient id={`sparkGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={CHART_COLORS[i % 6]} stopOpacity={0.3} />
                                            <stop offset="100%" stopColor={CHART_COLORS[i % 6]} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="revenue" stroke={CHART_COLORS[i % 6]} fill={`url(#sparkGrad${i})`} strokeWidth={2} dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

// ============================================================================
// TAB 2: REVENUE PROJECTIONS
// ============================================================================

function ProjectionsTab({ asmData, currentMonth }) {
    const [selectedAsm, setSelectedAsm] = useState('all');
    const data = selectedAsm === 'all' ? asmData : asmData.filter(a => a.id === selectedAsm);

    // Aggregate monthly trend
    const aggregatedTrend = useMemo(() => {
        return Array(12).fill(null).map((_, i) => {
            const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i];
            return {
                month,
                actual: data.reduce((s, a) => s + (a.monthlyTrend[i]?.revenue || 0), 0),
                projected: data.reduce((s, a) => s + (a.monthlyTrend[i]?.projected || 0), 0),
                target: data.reduce((s, a) => s + (a.monthlyTrend[i]?.target || 0), 0),
            };
        });
    }, [data]);

    // Gap to target waterfall
    const waterfallData = data.map(a => ({
        name: a.name.split(' ')[0],
        gap: -a.gapToTarget,
        fill: a.gapToTarget <= 0 ? COLORS.success : COLORS.danger,
    }));

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Select value={selectedAsm} onValueChange={setSelectedAsm}>
                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="All ASMs" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All ASMs</SelectItem>
                        {asmData.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {/* Projection Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.length === 1 && (
                    <>
                        <KpiCard title="Run Rate" value={fmt(data[0].runRateProjection)} subtitle="at current pace" icon={TrendingUp} color={COLORS.info} />
                        <KpiCard title="Linear Trend" value={fmt(data[0].linearProjection)} subtitle="regression based" icon={BarChart3} color={COLORS.secondary} />
                        <KpiCard title="Weighted Avg" value={fmt(data[0].wmaProjection)} subtitle="recent weighted" icon={Activity} color={COLORS.teal} />
                        <KpiCard title="Hit Probability" value={`${data[0].targetHitProbability}%`} subtitle={data[0].gapToTarget > 0 ? `Gap: ${fmt(data[0].gapToTarget)}` : 'Exceeds target!'} icon={Target} color={data[0].targetHitProbability >= 70 ? COLORS.success : COLORS.warning} />
                    </>
                )}
            </div>

            {/* Main Projection Chart */}
            <Card className="border-0 shadow-lg ring-1 ring-neutral-200/50 dark:ring-neutral-800/50">
                <CardHeader className="pb-4 border-b border-neutral-100 dark:border-neutral-800">
                    <CardTitle className="text-lg font-bold">Revenue: Actual vs Projected vs Target</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={400}>
                        <ComposedChart data={aggregatedTrend}>
                            <defs>
                                <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.8} />
                                    <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.2} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmt(v)} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: `${COLORS.primary}10` }} />
                            <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                            <Area type="monotone" dataKey="projected" name="Projected Curve" stroke={COLORS.secondary} fill={`${COLORS.secondary}15`} strokeWidth={2} strokeDasharray="5 5" />
                            <Bar dataKey="actual" name="Actual Revenue" fill="url(#actualGrad)" radius={[6, 6, 0, 0]} maxBarSize={60} />
                            <Line type="monotone" dataKey="target" name="Target Curve" stroke={COLORS.danger} strokeWidth={3} strokeDasharray="8 4" dot={{ r: 4, fill: COLORS.danger, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Gap to Target Waterfall */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Gap to Target by ASM</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={waterfallData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="gap" name="Surplus / Gap" radius={[4, 4, 0, 0]}>
                                {waterfallData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Forecast Categories */}
            {data.length === 1 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Forecast Categories (Salesforce-style)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-4 gap-4">
                            {[
                                { label: 'Closed', value: data[0].forecastCategories.closed, color: COLORS.success },
                                { label: 'Commit', value: data[0].forecastCategories.commit, color: COLORS.info },
                                { label: 'Best Case', value: data[0].forecastCategories.bestCase, color: COLORS.warning },
                                { label: 'Pipeline', value: data[0].forecastCategories.pipeline, color: COLORS.muted },
                            ].map(cat => (
                                <div key={cat.label} className="text-center p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                                    <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ backgroundColor: cat.color }} />
                                    <p className="text-xs text-neutral-500 mb-1">{cat.label}</p>
                                    <p className="text-lg font-bold">{fmt(Math.max(0, cat.value))}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// ============================================================================
// TAB 3: VISIT ANALYTICS
// ============================================================================

function VisitsTab({ asmData }) {
    // Aggregate funnel
    const funnelData = [
        { name: 'Visits', value: asmData.reduce((s, a) => s + a.totalVisits, 0), fill: COLORS.info },
        { name: 'Quotations', value: asmData.reduce((s, a) => s + a.totalQuotations, 0), fill: COLORS.secondary },
        { name: 'Orders', value: asmData.reduce((s, a) => s + a.totalOrders, 0), fill: COLORS.success },
    ];

    // Visit type distribution
    const typeData = useMemo(() => {
        const agg = {};
        asmData.forEach(a => {
            Object.entries(a.visitsByType || {}).forEach(([k, v]) => { agg[k] = (agg[k] || 0) + v; });
        });
        return Object.entries(agg).map(([name, value]) => ({ name, value }));
    }, [asmData]);

    // Outcome distribution
    const outcomeData = useMemo(() => {
        const agg = {};
        asmData.forEach(a => {
            Object.entries(a.visitsByOutcome || {}).forEach(([k, v]) => { agg[k] = (agg[k] || 0) + v; });
        });
        return Object.entries(agg).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));
    }, [asmData]);

    // Monthly visits per ASM
    const monthlyVisitData = useMemo(() => {
        return Array(12).fill(null).map((_, i) => {
            const row = { month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i] };
            asmData.forEach(a => { row[a.name] = a.monthlyTrend[i]?.visits || 0; });
            return row;
        });
    }, [asmData]);

    return (
        <div className="space-y-6">
            {/* Visit KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <KpiCard title="Total Visits" value={fmtNum(asmData.reduce((s, a) => s + a.totalVisits, 0))} icon={Eye} color={COLORS.info} />
                <KpiCard title="Unique Customers" value={fmtNum(asmData.reduce((s, a) => s + a.uniqueCustomersVisited, 0))} icon={Users} color={COLORS.secondary} />
                <KpiCard title="Avg Visit→Quote" value={`${asmData.length ? (asmData.reduce((s, a) => s + a.visitToQuoteRate, 0) / asmData.length).toFixed(1) : 0}%`} icon={BarChart3} color={COLORS.warning} />
                <KpiCard title="Avg Quote→Order" value={`${asmData.length ? (asmData.reduce((s, a) => s + a.quoteToOrderRate, 0) / asmData.length).toFixed(1) : 0}%`} icon={CheckCircle} color={COLORS.success} />
                <KpiCard title="Revenue/Visit" value={fmt(asmData.length ? asmData.reduce((s, a) => s + a.revenuePerVisit, 0) / asmData.length : 0)} icon={TrendingUp} color={COLORS.primary} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Conversion Funnel */}
                <Card className="border-0 shadow-lg ring-1 ring-neutral-200/50 dark:ring-neutral-800/50">
                    <CardHeader className="pb-4 border-b border-neutral-100 dark:border-neutral-800">
                        <CardTitle className="text-lg font-bold">Visit → Quote → Order Funnel</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            {funnelData.map((stage, i) => {
                                const maxVal = funnelData[0].value || 1;
                                const pct = ((stage.value / maxVal) * 100).toFixed(0);
                                return (
                                    <div key={stage.name}>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium">{stage.name}</span>
                                            <span className="text-sm font-mono">{fmtNum(stage.value)} ({pct}%)</span>
                                        </div>
                                        <div className="w-full h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                                            <div className="h-full rounded-lg transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: stage.fill }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Visit Type Pie */}
                <Card className="border-0 shadow-lg ring-1 ring-neutral-200/50 dark:ring-neutral-800/50">
                    <CardHeader className="pb-4 border-b border-neutral-100 dark:border-neutral-800">
                        <CardTitle className="text-lg font-bold">Visit Type Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie
                                    data={typeData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={90}
                                    innerRadius={60}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {typeData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % 6]} />)}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Monthly Visits by ASM */}
            <Card className="border-0 shadow-lg ring-1 ring-neutral-200/50 dark:ring-neutral-800/50">
                <CardHeader className="pb-4 border-b border-neutral-100 dark:border-neutral-800">
                    <CardTitle className="text-lg font-bold">Monthly Visits by ASM</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={monthlyVisitData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: `${COLORS.primary}10` }} />
                            <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                            {asmData.map((a, i) => (
                                <Bar key={a.id} dataKey={a.name} fill={CHART_COLORS[i % 6]} radius={[4, 4, 0, 0]} stackId="visits" maxBarSize={40} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Visit Outcome */}
            <Card className="border-0 shadow-lg ring-1 ring-neutral-200/50 dark:ring-neutral-800/50">
                <CardHeader className="pb-4 border-b border-neutral-100 dark:border-neutral-800">
                    <CardTitle className="text-lg font-bold">Visit Outcomes</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={outcomeData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={120} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: `${COLORS.primary}10` }} />
                            <Bar dataKey="value" name="Count" fill={COLORS.primary} radius={[0, 6, 6, 0]} maxBarSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}

// ============================================================================
// TAB 4: PIPELINE HEALTH
// ============================================================================

function PipelineTab({ asmData }) {
    const sorted = [...asmData].sort((a, b) => b.weightedPipeline - a.weightedPipeline);

    // Pipeline coverage data
    const coverageData = sorted.map(a => ({
        name: a.name.split(' ')[0],
        coverage: a.pipelineCoverage,
        ideal: 3,
    }));

    // Deal aging aggregate
    const agingData = useMemo(() => {
        const agg = { '0-7d': 0, '7-14d': 0, '14-30d': 0, '30d+': 0 };
        asmData.forEach(a => {
            Object.entries(a.dealAging || {}).forEach(([k, v]) => { agg[k] += v; });
        });
        return Object.entries(agg).map(([name, value]) => ({ name, value }));
    }, [asmData]);

    return (
        <div className="space-y-6">
            {/* Pipeline KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard title="Weighted Pipeline" value={fmt(asmData.reduce((s, a) => s + a.weightedPipeline, 0))} icon={BarChart3} color={COLORS.primary} />
                <KpiCard title="Stale Deals" value={asmData.reduce((s, a) => s + a.staleDealCount, 0)} subtitle="14+ days no activity" icon={AlertTriangle} color={COLORS.danger} />
                <KpiCard title="Avg Days to Close" value={`${(asmData.reduce((s, a) => s + a.avgDaysToClose, 0) / Math.max(1, asmData.length)).toFixed(0)}d`} icon={Calendar} color={COLORS.warning} />
                <KpiCard title="Avg Health Score" value={`${Math.round(asmData.reduce((s, a) => s + a.pipelineHealthScore, 0) / Math.max(1, asmData.length))}`} subtitle="out of 100" icon={Heart} color={COLORS.success} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weighted Pipeline by ASM */}
                <Card className="border-0 shadow-lg ring-1 ring-neutral-200/50 dark:ring-neutral-800/50">
                    <CardHeader className="pb-4 border-b border-neutral-100 dark:border-neutral-800">
                        <CardTitle className="text-lg font-bold">Weighted Pipeline by ASM</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={sorted.map(a => ({ name: a.name.split(' ')[0], pipeline: a.weightedPipeline, revenue: a.revenue }))} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                                <XAxis type="number" tickFormatter={v => fmt(v)} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: `${COLORS.primary}10` }} />
                                <Legend iconType="circle" />
                                <Bar dataKey="pipeline" name="Weighted Pipeline" fill={COLORS.secondary} radius={[0, 6, 6, 0]} barSize={12} />
                                <Bar dataKey="revenue" name="Closed Revenue" fill={COLORS.success} radius={[0, 6, 6, 0]} barSize={12} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Pipeline Coverage Gauge */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Pipeline Coverage Ratio</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <ComposedChart data={coverageData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar dataKey="coverage" name="Coverage Ratio" radius={[4, 4, 0, 0]}>
                                    {coverageData.map((entry, i) => (
                                        <Cell key={i} fill={entry.coverage >= 3 ? COLORS.success : entry.coverage >= 1 ? COLORS.warning : COLORS.danger} />
                                    ))}
                                </Bar>
                                <Line type="monotone" dataKey="ideal" name="Ideal (3×)" stroke={COLORS.danger} strokeDasharray="5 5" dot={false} strokeWidth={2} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Deal Aging */}
                <Card className="border-0 shadow-lg ring-1 ring-neutral-200/50 dark:ring-neutral-800/50">
                    <CardHeader className="pb-4 border-b border-neutral-100 dark:border-neutral-800">
                        <CardTitle className="text-lg font-bold">Deal Aging Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={agingData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: `${COLORS.primary}10` }} />
                                <Bar dataKey="value" name="Deals" radius={[6, 6, 0, 0]} maxBarSize={50}>
                                    {agingData.map((_, i) => <Cell key={i} fill={[COLORS.success, COLORS.info, COLORS.warning, COLORS.danger][i]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Sales Velocity */}
                <Card className="border-0 shadow-lg ring-1 ring-neutral-200/50 dark:ring-neutral-800/50">
                    <CardHeader className="pb-4 border-b border-neutral-100 dark:border-neutral-800">
                        <CardTitle className="text-lg font-bold">Sales Velocity &amp; Health</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-5">
                            {sorted.map(asm => (
                                <div key={asm.id} className="flex items-center gap-4">
                                    <span className="text-sm font-semibold w-24 truncate">{asm.name.split(' ')[0]}</span>
                                    <div className="flex-1 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden relative shadow-inner">
                                        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{
                                            width: `${Math.min(asm.pipelineHealthScore, 100)}%`,
                                            background: `linear-gradient(90deg, ${getStatusColor(asm.pipelineHealthScore, [60, 35])}, ${getStatusColor(asm.pipelineHealthScore, [60, 35])}dd)`,
                                            boxShadow: `0 0 10px ${getStatusColor(asm.pipelineHealthScore, [60, 35])}40`
                                        }} />
                                        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-neutral-900 drop-shadow-md mix-blend-overlay">
                                            {asm.pipelineHealthScore}/100
                                        </span>
                                    </div>
                                    <span className="text-xs font-mono font-medium text-neutral-500 w-24 text-right bg-neutral-100 dark:bg-neutral-800 py-1.5 px-2 rounded-md">{fmt(asm.salesVelocity)}/d</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// ============================================================================
// TAB 5: COMPARATIVE ANALYSIS
// ============================================================================

function ComparativeTab({ asmData }) {
    const [asm1, setAsm1] = useState(asmData[0]?.id || '');
    const [asm2, setAsm2] = useState(asmData[1]?.id || '');

    const a1 = asmData.find(a => a.id === asm1);
    const a2 = asmData.find(a => a.id === asm2);

    const radarData = useMemo(() => {
        if (!a1 || !a2) return [];
        const maxVisits = Math.max(a1.totalVisits, a2.totalVisits, 1);
        const maxQuotes = Math.max(a1.totalQuotations, a2.totalQuotations, 1);
        const maxOrders = Math.max(a1.totalOrders, a2.totalOrders, 1);
        return [
            { metric: 'Visits', A: (a1.totalVisits / maxVisits) * 100, B: (a2.totalVisits / maxVisits) * 100 },
            { metric: 'Quotes', A: (a1.totalQuotations / maxQuotes) * 100, B: (a2.totalQuotations / maxQuotes) * 100 },
            { metric: 'Orders', A: (a1.totalOrders / maxOrders) * 100, B: (a2.totalOrders / maxOrders) * 100 },
            { metric: 'Conversion', A: a1.quoteToOrderRate * 2, B: a2.quoteToOrderRate * 2 },
            { metric: 'Velocity', A: Math.min(a1.pipelineHealthScore, 100), B: Math.min(a2.pipelineHealthScore, 100) },
            { metric: 'Activity', A: a1.activityScore, B: a2.activityScore },
        ];
    }, [a1, a2]);

    // Scatter: visits vs revenue
    const scatterData = asmData.map(a => ({ name: a.name, visits: a.totalVisits, revenue: a.revenue, conversion: a.quoteToOrderRate }));

    // Rankings
    const rankings = [...asmData].sort((a, b) => b.revenue - a.revenue).map((a, i) => ({ ...a, rank: i + 1 }));

    return (
        <div className="space-y-6">
            {/* ASM Selector */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">ASM A:</span>
                    <Select value={asm1} onValueChange={setAsm1}>
                        <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {asmData.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <span className="text-neutral-400 font-bold">VS</span>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">ASM B:</span>
                    <Select value={asm2} onValueChange={setAsm2}>
                        <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {asmData.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Radar Chart */}
                <Card className="border-0 shadow-lg ring-1 ring-neutral-200/50 dark:ring-neutral-800/50">
                    <CardHeader className="pb-4 border-b border-neutral-100 dark:border-neutral-800">
                        <CardTitle className="text-lg font-bold">Performance Radar</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <ResponsiveContainer width="100%" height={350}>
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="#e5e7eb" />
                                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: COLORS.muted }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} />
                                <Radar name={a1?.name || 'A'} dataKey="A" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.3} strokeWidth={2} />
                                <Radar name={a2?.name || 'B'} dataKey="B" stroke={COLORS.pink} fill={COLORS.pink} fillOpacity={0.3} strokeWidth={2} />
                                <Legend iconType="circle" />
                                <Tooltip content={<CustomTooltip />} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Efficiency Scatter */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Visits vs Revenue (Efficiency)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <ScatterChart>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis type="number" dataKey="visits" name="Visits" tick={{ fontSize: 11 }} />
                                <YAxis type="number" dataKey="revenue" name="Revenue" tickFormatter={v => fmt(v)} tick={{ fontSize: 11 }} />
                                <Tooltip content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null;
                                    const d = payload[0]?.payload;
                                    return (
                                        <div className="bg-white dark:bg-neutral-800 p-3 rounded-lg shadow-xl border text-sm">
                                            <p className="font-semibold">{d?.name}</p>
                                            <p>Visits: {d?.visits}</p>
                                            <p>Revenue: {fmt(d?.revenue)}</p>
                                            <p>Conversion: {d?.conversion}%</p>
                                        </div>
                                    );
                                }} />
                                <Scatter data={scatterData} fill={COLORS.primary}>
                                    {scatterData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % 6]} />)}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Rankings Table */}
            <Card className="border-0 shadow-lg ring-1 ring-neutral-200/50 dark:ring-neutral-800/50 overflow-hidden">
                <CardHeader className="pb-4 bg-white dark:bg-neutral-900">
                    <CardTitle className="text-lg font-bold">Performance Rankings</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-y border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 text-neutral-500 uppercase text-xs font-bold tracking-wider">
                                    <th className="p-4 text-left font-semibold">Rank</th>
                                    <th className="p-4 text-left font-semibold">ASM</th>
                                    <th className="p-4 text-right font-semibold">Revenue</th>
                                    <th className="p-4 text-right font-semibold">Win Rate</th>
                                    <th className="p-4 text-right font-semibold">Activity</th>
                                    <th className="p-4 text-right font-semibold">Avg Deal</th>
                                    <th className="p-4 text-right font-semibold">Velocity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rankings.map(r => (
                                    <tr key={r.id} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                                        <td className="p-4 font-bold text-lg">{r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : <span className="text-neutral-400 pl-2">{r.rank}</span>}</td>
                                        <td className="p-4 font-medium">{r.name}</td>
                                        <td className="p-4 text-right font-mono font-medium">{fmt(r.revenue)}</td>
                                        <td className="p-4 text-right font-mono">{r.winRate}%</td>
                                        <td className="p-4 text-right font-mono">
                                            <span className="px-2 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800">{r.activityScore}</span>
                                        </td>
                                        <td className="p-4 text-right font-mono text-neutral-500">{fmt(r.avgDealSize)}</td>
                                        <td className="p-4 text-right font-mono">{fmt(r.salesVelocity)}<span className="text-neutral-400">/d</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ============================================================================
// TAB 6: COACHING INSIGHTS
// ============================================================================

function CoachingTab({ asmData }) {
    // Effort vs Results quadrant
    const quadrantData = asmData.map(a => ({
        name: a.name,
        effort: a.activityScore,
        results: a.quotaAttainment,
    }));

    return (
        <div className="space-y-6">
            {/* Coaching Priority Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['needs_attention', 'monitor', 'on_track'].map(priority => {
                    const count = asmData.filter(a => a.coachingPriority === priority).length;
                    const colors = { needs_attention: COLORS.danger, monitor: COLORS.warning, on_track: COLORS.success };
                    const labels = { needs_attention: 'Needs Attention', monitor: 'Monitor', on_track: 'On Track' };
                    return (
                        <Card key={priority} className="border-l-4" style={{ borderLeftColor: colors[priority] }}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-neutral-500">{labels[priority]}</p>
                                    <p className="text-3xl font-bold">{count}</p>
                                </div>
                                <div className="text-4xl opacity-20">
                                    {priority === 'needs_attention' ? '⚠️' : priority === 'monitor' ? '👀' : '✅'}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Effort vs Results Scatter */}
            <Card className="border-0 shadow-lg ring-1 ring-neutral-200/50 dark:ring-neutral-800/50">
                <CardHeader className="pb-4 border-b border-neutral-100 dark:border-neutral-800">
                    <CardTitle className="text-lg font-bold">Effort vs Results Quadrant</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 bg-gradient-to-br from-neutral-50/50 to-white dark:from-neutral-900/50 dark:to-neutral-900">
                    <ResponsiveContainer width="100%" height={400}>
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis type="number" dataKey="effort" name="Activity Score" domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'Activity Score (Effort)', position: 'bottom', offset: 0, fontSize: 12, fill: COLORS.muted }} />
                            <YAxis type="number" dataKey="results" name="Quota Attainment %" domain={[0, 'auto']} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'Quota Attainment %', angle: -90, position: 'left', fontSize: 12, fill: COLORS.muted }} />
                            <Tooltip content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const d = payload[0]?.payload;
                                return (
                                    <div className="bg-white dark:bg-neutral-800 p-3 rounded-lg shadow-xl border text-sm">
                                        <p className="font-semibold">{d?.name}</p>
                                        <p>Activity: {d?.effort}</p>
                                        <p>Attainment: {d?.results}%</p>
                                    </div>
                                );
                            }} />
                            {/* Reference lines for quadrants */}
                            <Scatter data={quadrantData} fill={COLORS.primary}>
                                {quadrantData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % 6]} r={8} />)}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-4 mt-4 text-xs text-neutral-500">
                        <div className="text-right border-r border-b p-2">⬆️ Low Effort, High Results<br /><em className="text-emerald-600">Natural Talent</em></div>
                        <div className="border-b p-2">⬆️ High Effort, High Results<br /><em className="text-emerald-600">Star Performers</em></div>
                        <div className="text-right border-r p-2">⬇️ Low Effort, Low Results<br /><em className="text-red-600">Needs Attention</em></div>
                        <div className="p-2">⬇️ High Effort, Low Results<br /><em className="text-amber-600">Needs Coaching</em></div>
                    </div>
                </CardContent>
            </Card>

            {/* Per-ASM Coaching Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {asmData.map(asm => (
                    <Card key={asm.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">{asm.name}</CardTitle>
                                {getStatusBadge(asm.coachingPriority)}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-3 mb-4 text-center text-sm">
                                <div><p className="text-neutral-500">Activity</p><p className="font-bold text-lg">{asm.activityScore}</p></div>
                                <div><p className="text-neutral-500">Win Rate</p><p className="font-bold text-lg">{asm.winRate}%</p></div>
                                <div><p className="text-neutral-500">Attainment</p><p className="font-bold text-lg" style={{ color: getStatusColor(asm.quotaAttainment, [80, 60]) }}>{asm.quotaAttainment}%</p></div>
                            </div>
                            {asm.coachingInsights.length > 0 ? (
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-neutral-500 uppercase">Recommended Actions</p>
                                    {asm.coachingInsights.map((insight, i) => (
                                        <div key={i} className="flex items-start gap-2 text-sm">
                                            <span className="mt-0.5 text-amber-500">•</span>
                                            <span>{insight}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-emerald-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Performing well — no action items</p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function PerformancePage() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [year, setYear] = useState(new Date().getFullYear());
    const [activeTab, setActiveTab] = useState('scorecard');

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/sales-performance?year=${year}`);
            const json = await res.json();
            if (json.success) {
                setData(json);
            } else {
                setError(json.error || 'Failed to load data');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [year]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                    <p className="text-neutral-500">Loading performance data...</p>
                </div>
            </div>
        );
    }

    if (error || !data?.asmData?.length) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="max-w-md">
                    <CardContent className="p-8 text-center">
                        <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-3" />
                        <h3 className="font-semibold text-lg mb-2">{error ? 'Error Loading Data' : 'No Data Available'}</h3>
                        <p className="text-neutral-500 text-sm mb-4">{error || 'No ASM performance data found for this year. Ensure visits and documents are logged.'}</p>
                        <Button onClick={fetchData} variant="outline"><RefreshCw className="w-4 h-4 mr-2" /> Retry</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-1">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Trophy className="w-7 h-7 text-amber-500" />
                        Sales Performance
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">ASM activity, pipeline health, projections &amp; coaching insights</p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
                        <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {[2024, 2025, 2026].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="w-4 h-4" /></Button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl">
                    <TabsTrigger value="scorecard" className="flex-1 min-w-[100px] text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 rounded-lg">📊 Scorecard</TabsTrigger>
                    <TabsTrigger value="projections" className="flex-1 min-w-[100px] text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 rounded-lg">📈 Projections</TabsTrigger>
                    <TabsTrigger value="visits" className="flex-1 min-w-[100px] text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 rounded-lg">👁 Visits</TabsTrigger>
                    <TabsTrigger value="pipeline" className="flex-1 min-w-[100px] text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 rounded-lg">🔧 Pipeline</TabsTrigger>
                    <TabsTrigger value="comparative" className="flex-1 min-w-[100px] text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 rounded-lg">⚔️ Compare</TabsTrigger>
                    <TabsTrigger value="coaching" className="flex-1 min-w-[100px] text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 rounded-lg">🧠 Coaching</TabsTrigger>
                </TabsList>

                <TabsContent value="scorecard" className="mt-6">
                    <ScorecardTab asmData={data.asmData} totals={data.totals} />
                </TabsContent>
                <TabsContent value="projections" className="mt-6">
                    <ProjectionsTab asmData={data.asmData} currentMonth={data.currentMonth} />
                </TabsContent>
                <TabsContent value="visits" className="mt-6">
                    <VisitsTab asmData={data.asmData} />
                </TabsContent>
                <TabsContent value="pipeline" className="mt-6">
                    <PipelineTab asmData={data.asmData} />
                </TabsContent>
                <TabsContent value="comparative" className="mt-6">
                    {data.asmData.length >= 2
                        ? <ComparativeTab asmData={data.asmData} />
                        : <p className="text-neutral-500 text-center py-8">Need at least 2 ASMs for comparison</p>}
                </TabsContent>
                <TabsContent value="coaching" className="mt-6">
                    <CoachingTab asmData={data.asmData} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
