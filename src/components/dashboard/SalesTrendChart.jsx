/**
 * Sales Trend Chart Component
 * 
 * Interactive line chart showing sales trends over time.
 * Uses Recharts for data visualization.
 * 
 * @module components/dashboard/SalesTrendChart
 */

'use client';

import { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCompactCurrency, formatCurrency } from '@/lib/utils/formatting';
import { CHART_COLORS } from '@/lib/constants';

/**
 * Custom tooltip component for the chart.
 */
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) {
        return null;
    }

    return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[150px]">
            <p className="font-medium text-sm mb-2">{label}</p>
            {payload.map((entry, index) => (
                <div key={index} className="flex items-center justify-between gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-muted-foreground">{entry.name}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(entry.value, { compact: true })}</span>
                </div>
            ))}
        </div>
    );
}

/**
 * SalesTrendChart component.
 * 
 * @param {Object} props - Component props
 * @param {Array<Object>} props.data - Chart data with month/year and values
 * @param {string} [props.title='Sales Trend'] - Chart title
 * @param {string} [props.description] - Chart description
 * @param {Array<{key: string, name: string, color?: string}>} [props.lines] - Line configurations
 * @param {boolean} [props.loading=false] - Show loading state
 * @param {number} [props.height=350] - Chart height in pixels
 * @param {string} [props.className] - Additional CSS classes
 */
export function SalesTrendChart({
    data = [],
    title = 'Sales Trend',
    description,
    lines = [{ key: 'value', name: 'Sales' }],
    loading = false,
    height = 350,
    className,
}) {
    // Format data for chart
    const chartData = useMemo(() => {
        return data.map((item) => ({
            ...item,
            label: item.label || item.month || '',
        }));
    }, [data]);

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

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={height}>
                    <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                            tickLine={false}
                            axisLine={{ stroke: 'hsl(var(--border))' }}
                        />
                        <YAxis
                            tickFormatter={(value) => formatCompactCurrency(value)}
                            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                            tickLine={false}
                            axisLine={{ stroke: 'hsl(var(--border))' }}
                            width={60}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{ paddingTop: 20 }}
                            iconType="circle"
                            iconSize={8}
                        />
                        {lines.map((line, index) => (
                            <Line
                                key={line.key}
                                type="monotone"
                                dataKey={line.key}
                                name={line.name}
                                stroke={line.color || CHART_COLORS[index % CHART_COLORS.length]}
                                strokeWidth={2}
                                dot={{ r: 4, strokeWidth: 2, fill: 'white' }}
                                activeDot={{ r: 6, strokeWidth: 2 }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
