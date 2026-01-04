'use client';

import { useState } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/formatting';
import { cn } from '@/lib/utils';
import {
    ArrowUpRight,
    ArrowDownRight,
    TrendingUp,
    FileText,
    ShoppingCart,
    Target
} from 'lucide-react';

const METRICS = {
    REVENUE: { label: 'Revenue (Orders)', key: 'revenue', color: '#111827', icon: TrendingUp },    // Slate-900
    QUOTED_VALUE: { label: 'Quoted Value', key: 'quotations_value', color: '#d97706', icon: FileText }, // Amber-600
    CONVERSION: { label: 'Conversion Rate', key: 'conversion', color: '#7c3aed', icon: Target }, // Violet-600 
};

const VIEW_MODES = {
    TREND: 'trend',
    COMPARE: 'compare',
};

// Premium Tooltip Component
const CustomTooltip = ({ active, payload, label, metric, userMap }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-slate-100 shadow-xl rounded-lg p-3 min-w-[200px]">
                <p className="text-sm font-semibold text-slate-800 mb-2">{label}</p>
                <div className="space-y-1">
                    {payload.map((entry, index) => {
                        const isTarget = entry.dataKey.toString().includes('target');
                        let value = entry.value;
                        let name = entry.name;

                        // Formatting
                        if (metric === 'revenue' || metric === 'quotations_value' || isTarget || metric.includes('val')) {
                            value = formatCurrency(value);
                        } else if (metric === 'conversion') {
                            value = `${value}%`;
                        }

                        // Name Resolution for Comparison Mode
                        if (name === 'value') name = 'Total'; // Fallback
                        // Try to resolve name from userMap if we have IDs in dataKey? 
                        // Actually Recharts passes the `name` prop from the Line/Area component.

                        return (
                            <div key={index} className="flex items-center justify-between gap-4 text-xs">
                                <span className="flex items-center gap-1.5 text-slate-500">
                                    <span
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: entry.color }}
                                    />
                                    {name}
                                </span>
                                <span className="font-semibold tabular-nums text-slate-700">
                                    {value}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
    return null;
};

export function HeroChart({ data, userMap, className }) {
    const [activeMetric, setActiveMetric] = useState('REVENUE');
    const [viewMode, setViewMode] = useState(VIEW_MODES.TREND);

    // Filter available comparison users from data keys
    // We look at the first data point to see which keys exist
    const comparisonKeys = data && data.length > 0
        ? Object.keys(data[0]).filter(k => k.startsWith('revenue_')) // Just grab IDs from revenue keys
            .map(k => k.replace('revenue_', ''))
        : [];

    const getCurrentMetricKey = () => {
        if (activeMetric === 'REVENUE') return 'revenue';
        if (activeMetric === 'QUOTED_VALUE') return 'quotations_value';
        if (activeMetric === 'CONVERSION') return 'conversion';
        return 'revenue';
    };

    const getComparisonKey = (uid) => {
        if (activeMetric === 'REVENUE') return `revenue_${uid}`;
        if (activeMetric === 'QUOTED_VALUE') return `quotes_val_${uid}`;
        if (activeMetric === 'CONVERSION') return null;
        return `revenue_${uid}`;
    };

    const currentConfig = METRICS[activeMetric];

    // Calculate total/avg for the header
    const totalValue = data.reduce((sum, item) => sum + (item[getCurrentMetricKey()] || 0), 0);
    const avgValue = data.length > 0 ? totalValue / data.length : 0;

    // Previous period formatting (dumb simple for now, just comparing last month vs avg)
    // Real comparison would need previous period data passed in.

    return (
        <Card className={cn("border-slate-100 shadow-sm", className)}>
            <CardHeader className="pl-6 pr-6 pt-6 pb-2 border-b border-slate-50/50">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Header Left: Title & Big Stat */}
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            {/* Icon */}
                            <div className="p-1.5 rounded-md bg-slate-50 text-slate-500">
                                <currentConfig.icon className="h-4 w-4" />
                            </div>
                            <p className="text-sm font-medium text-slate-500">
                                {currentConfig.label} Overview
                            </p>
                        </div>
                        <div className="flex items-baseline gap-3">
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                                {(activeMetric === 'REVENUE' || activeMetric === 'QUOTED_VALUE') ? formatCurrency(totalValue) :
                                    (activeMetric === 'CONVERSION') ? `${Math.round(avgValue)}%` :
                                        totalValue.toLocaleString()}
                            </h2>
                            {data.length > 1 && (
                                <div className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                    <ArrowUpRight className="h-3 w-3 mr-1" />
                                    <span>Last {data.length} months</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Metric Segments */}
                        <div className="flex bg-slate-50/80 p-1 rounded-lg border border-slate-100">
                            {Object.entries(METRICS).map(([key, config]) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveMetric(key)}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
                                        activeMetric === key
                                            ? "bg-white text-slate-900 shadow-sm border border-slate-100/50"
                                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
                                    )}
                                >
                                    {config.label}
                                </button>
                            ))}
                        </div>

                        {/* View Toggle */}
                        {comparisonKeys.length > 0 && activeMetric !== 'CONVERSION' && (
                            <div className="flex bg-slate-50/80 p-1 rounded-lg border border-slate-100">
                                <button
                                    onClick={() => setViewMode(VIEW_MODES.TREND)}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
                                        viewMode === VIEW_MODES.TREND
                                            ? "bg-white text-slate-900 shadow-sm border border-slate-100/50"
                                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
                                    )}
                                >
                                    Team Trend (Combined)
                                </button>
                                <button
                                    onClick={() => setViewMode(VIEW_MODES.COMPARE)}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
                                        viewMode === VIEW_MODES.COMPARE
                                            ? "bg-white text-slate-900 shadow-sm border border-slate-100/50"
                                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
                                    )}
                                >
                                    Compare Members
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        {viewMode === VIEW_MODES.TREND ? (
                            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id={`gradient-${activeMetric}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={currentConfig.color} stopOpacity={0.1} />
                                        <stop offset="95%" stopColor={currentConfig.color} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    tickFormatter={(v) => {
                                        if (activeMetric === 'REVENUE' || activeMetric === 'QUOTED_VALUE') return `₹${v / 1000}k`;
                                        if (activeMetric === 'CONVERSION') return `${v}%`;
                                        return v;
                                    }}
                                />
                                <Tooltip content={<CustomTooltip metric={getCurrentMetricKey()} />} />
                                <Area
                                    type="monotone"
                                    dataKey={getCurrentMetricKey()}
                                    stroke={currentConfig.color}
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill={`url(#gradient-${activeMetric})`}
                                    name={currentConfig.label}
                                    activeDot={{ r: 4, strokeWidth: 0, fill: currentConfig.color }}
                                />
                                {/* Optional: Target Line for Trend? */}
                                {activeMetric === 'REVENUE' && (
                                    <Line
                                        type="step"
                                        dataKey="target"
                                        stroke="#cbd5e1"
                                        strokeDasharray="4 4"
                                        strokeWidth={1.5}
                                        dot={false}
                                        name="Target"
                                    />
                                )}
                            </AreaChart>
                        ) : (
                            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    tickFormatter={(v) => {
                                        if (activeMetric === 'REVENUE') return `₹${v / 1000}k`;
                                        return v;
                                    }}
                                />
                                <Tooltip content={<CustomTooltip metric={getCurrentMetricKey()} userMap={userMap} />} />
                                {comparisonKeys.map((uid, index) => {
                                    // Generate distinct but harmonious colors for lines (max 5-6 usually)
                                    const colors = ['#0f172a', '#4338ca', '#059669', '#d97706', '#dc2626', '#7c3aed'];
                                    const color = colors[index % colors.length];
                                    const userName = userMap?.[uid]?.split(' ')[0] || uid; // User First Name

                                    return (
                                        <Line
                                            key={uid}
                                            type="monotone"
                                            dataKey={getComparisonKey(uid)}
                                            name={userName}
                                            stroke={color}
                                            strokeWidth={2}
                                            dot={{ r: 3, fill: color, strokeWidth: 0 }}
                                            activeDot={{ r: 5, strokeWidth: 0 }}
                                        />
                                    );
                                })}
                                {/* Comparison Targets? Might clutter, maybe skip for now or make very subtle */}
                            </LineChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
