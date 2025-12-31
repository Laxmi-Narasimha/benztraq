/**
 * Sales By Bar Chart Component
 * 
 * Reusable bar chart for displaying sales by different dimensions.
 * (salesperson, region, customer, product)
 * 
 * @module components/dashboard/SalesByBarChart
 */

'use client';

import { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCompactCurrency, formatCurrency, truncateText } from '@/lib/utils/formatting';
import { CHART_COLORS } from '@/lib/constants';

/**
 * Custom tooltip component for the bar chart.
 */
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) {
        return null;
    }

    return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[150px]">
            <p className="font-medium text-sm mb-1">{label}</p>
            <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">Sales</span>
                <span className="font-semibold">{formatCurrency(payload[0].value, { compact: true })}</span>
            </div>
            {payload[0].payload.count !== undefined && (
                <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-muted-foreground">Count</span>
                    <span className="font-medium">{payload[0].payload.count} orders</span>
                </div>
            )}
        </div>
    );
}

/**
 * Custom Y-axis tick that truncates long labels.
 */
function CustomYAxisTick({ x, y, payload }) {
    return (
        <g transform={`translate(${x},${y})`}>
            <text
                x={-5}
                y={0}
                dy={4}
                textAnchor="end"
                fill="hsl(var(--muted-foreground))"
                fontSize={12}
            >
                {truncateText(payload.value, 15)}
            </text>
        </g>
    );
}

/**
 * SalesByBarChart component.
 * 
 * @param {Object} props - Component props
 * @param {Array<{name: string, value: number, count?: number}>} props.data - Chart data
 * @param {string} [props.title='Sales Breakdown'] - Chart title
 * @param {string} [props.description] - Chart description
 * @param {'horizontal' | 'vertical'} [props.layout='horizontal'] - Bar orientation
 * @param {number} [props.maxItems=10] - Maximum items to display
 * @param {boolean} [props.loading=false] - Show loading state
 * @param {number} [props.height=350] - Chart height in pixels
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.colorByValue=false] - Color bars by value ranking
 */
export function SalesByBarChart({
    data = [],
    title = 'Sales Breakdown',
    description,
    layout = 'horizontal',
    maxItems = 10,
    loading = false,
    height = 350,
    className,
    colorByValue = true,
}) {
    // Sort and limit data
    const chartData = useMemo(() => {
        const sorted = [...data].sort((a, b) => b.value - a.value);
        return sorted.slice(0, maxItems);
    }, [data, maxItems]);

    if (loading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[350px] w-full" />
                </CardContent>
            </Card>
        );
    }

    const isHorizontal = layout === 'horizontal';

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={height}>
                    <BarChart
                        data={chartData}
                        layout={isHorizontal ? 'vertical' : 'horizontal'}
                        margin={isHorizontal
                            ? { top: 5, right: 30, left: 100, bottom: 5 }
                            : { top: 5, right: 30, left: 20, bottom: 60 }
                        }
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />

                        {isHorizontal ? (
                            <>
                                <XAxis
                                    type="number"
                                    tickFormatter={(value) => formatCompactCurrency(value)}
                                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                    tickLine={false}
                                    axisLine={{ stroke: 'hsl(var(--border))' }}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    tick={<CustomYAxisTick />}
                                    tickLine={false}
                                    axisLine={{ stroke: 'hsl(var(--border))' }}
                                    width={95}
                                />
                            </>
                        ) : (
                            <>
                                <XAxis
                                    type="category"
                                    dataKey="name"
                                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                    tickLine={false}
                                    axisLine={{ stroke: 'hsl(var(--border))' }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={60}
                                    interval={0}
                                />
                                <YAxis
                                    type="number"
                                    tickFormatter={(value) => formatCompactCurrency(value)}
                                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                    tickLine={false}
                                    axisLine={{ stroke: 'hsl(var(--border))' }}
                                    width={60}
                                />
                            </>
                        )}

                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />

                        <Bar
                            dataKey="value"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={colorByValue
                                        ? CHART_COLORS[Math.min(index, CHART_COLORS.length - 1)]
                                        : CHART_COLORS[0]
                                    }
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
