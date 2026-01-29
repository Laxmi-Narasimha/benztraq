'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatCurrencyCompact(value) {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
    return `₹${value}`;
}

/**
 * RevenueTrendChart - Pure B/W with green/red for performance
 */
export function RevenueTrendChart({ targets, year }) {
    const currentMonth = new Date().getMonth() + 1;

    // Calculate monthly data
    const chartData = useMemo(() => {
        const monthlyTarget = targets.reduce((sum, t) => sum + (t.annualTarget || 0), 0) / 12;

        const monthlyActual = {};
        targets.forEach(t => {
            Object.entries(t.achieved || {}).forEach(([month, value]) => {
                const m = parseInt(month);
                monthlyActual[m] = (monthlyActual[m] || 0) + value;
            });
        });

        let cumulativeTarget = 0;
        let cumulativeActual = 0;

        return MONTHS.map((month, idx) => {
            const monthNum = idx + 1;
            const target = monthlyTarget;
            const actual = monthlyActual[monthNum] || 0;

            cumulativeTarget += target;
            cumulativeActual += actual;

            return {
                month,
                monthNum,
                target: Math.round(target),
                actual: Math.round(actual),
                cumulativeTarget: Math.round(cumulativeTarget),
                cumulativeActual: Math.round(cumulativeActual),
                isPast: monthNum <= currentMonth,
            };
        });
    }, [targets, currentMonth]);

    // Calculate YTD stats
    const ytdStats = useMemo(() => {
        const ytdActual = chartData
            .filter(d => d.isPast)
            .reduce((sum, d) => sum + d.actual, 0);
        const ytdTarget = chartData
            .filter(d => d.isPast)
            .reduce((sum, d) => sum + d.target, 0);
        const performance = ytdTarget > 0 ? ((ytdActual - ytdTarget) / ytdTarget) * 100 : 0;

        return { ytdActual, ytdTarget, performance };
    }, [chartData]);

    // Find max value for scaling
    const maxValue = useMemo(() => {
        const max = Math.max(
            ...chartData.map(d => Math.max(d.actual, d.target))
        );
        const magnitude = Math.pow(10, Math.floor(Math.log10(max || 1)));
        return Math.ceil(max / magnitude) * magnitude || 1000000;
    }, [chartData]);

    // Generate Y-axis labels
    const yLabels = [0, maxValue * 0.25, maxValue * 0.5, maxValue * 0.75, maxValue];

    // SVG dimensions
    const width = 800;
    const height = 300;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Calculate point positions
    const getX = (idx) => padding.left + (idx / (MONTHS.length - 1)) * chartWidth;
    const getY = (value) => padding.top + chartHeight - (value / maxValue) * chartHeight;

    // Generate path for line
    const generatePath = (dataKey) => {
        return chartData
            .map((d, i) => {
                const x = getX(i);
                const y = getY(d[dataKey]);
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            })
            .join(' ');
    };

    return (
        <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-semibold text-neutral-900 dark:text-white">Revenue Trend</CardTitle>
                        <p className="text-sm text-neutral-500">Monthly revenue vs target for {year}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-0.5 bg-neutral-900 dark:bg-white rounded"></span>
                            <span className="text-neutral-500">Actual Revenue</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-0.5 bg-neutral-400 rounded" style={{ borderBottom: '2px dashed' }}></span>
                            <span className="text-neutral-500">Target Revenue</span>
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                {/* SVG Chart */}
                <div className="relative w-full overflow-x-auto">
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[600px]" preserveAspectRatio="xMidYMid meet">
                        {/* Grid lines */}
                        {yLabels.map((label, i) => (
                            <g key={i}>
                                <line
                                    x1={padding.left}
                                    y1={getY(label)}
                                    x2={width - padding.right}
                                    y2={getY(label)}
                                    stroke="#e5e5e5"
                                    strokeWidth="1"
                                    strokeDasharray={i === 0 ? "0" : "4,4"}
                                />
                                <text
                                    x={padding.left - 10}
                                    y={getY(label)}
                                    textAnchor="end"
                                    alignmentBaseline="middle"
                                    className="fill-neutral-400 text-xs"
                                    fontSize="11"
                                >
                                    {formatCurrencyCompact(label)}
                                </text>
                            </g>
                        ))}

                        {/* Target line (dashed gray) */}
                        <path
                            d={generatePath('target')}
                            fill="none"
                            stroke="#a3a3a3"
                            strokeWidth="2"
                            strokeDasharray="6,4"
                        />

                        {/* Actual line (solid black) */}
                        <path
                            d={generatePath('actual')}
                            fill="none"
                            stroke="#171717"
                            strokeWidth="2.5"
                        />

                        {/* Data points - Actual */}
                        {chartData.map((d, i) => (
                            <g key={`actual-${i}`}>
                                <circle
                                    cx={getX(i)}
                                    cy={getY(d.actual)}
                                    r="4"
                                    fill={d.isPast ? "#171717" : "#d4d4d4"}
                                    stroke="#fff"
                                    strokeWidth="2"
                                />
                            </g>
                        ))}

                        {/* Data points - Target */}
                        {chartData.map((d, i) => (
                            <circle
                                key={`target-${i}`}
                                cx={getX(i)}
                                cy={getY(d.target)}
                                r="3"
                                fill="#a3a3a3"
                                stroke="#fff"
                                strokeWidth="2"
                            />
                        ))}

                        {/* X-axis labels */}
                        {MONTHS.map((month, i) => (
                            <text
                                key={month}
                                x={getX(i)}
                                y={height - 10}
                                textAnchor="middle"
                                className="fill-neutral-500 text-xs"
                                fontSize="11"
                            >
                                {month}
                            </text>
                        ))}
                    </svg>
                </div>

                {/* YTD Stats */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                    <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider">YTD Revenue</p>
                        <p className="text-xl font-bold text-neutral-900 dark:text-white">{formatCurrencyCompact(ytdStats.ytdActual)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-neutral-500 uppercase tracking-wider">YTD Target</p>
                        <p className="text-xl font-bold text-neutral-500">{formatCurrencyCompact(ytdStats.ytdTarget)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-neutral-500 uppercase tracking-wider">Performance</p>
                        <p className={cn(
                            "text-xl font-bold",
                            ytdStats.performance >= 0 ? "text-emerald-600" : "text-red-600"
                        )}>
                            {ytdStats.performance >= 0 ? '+' : ''}{ytdStats.performance.toFixed(1)}%
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
