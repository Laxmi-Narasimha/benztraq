'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/formatting';

export function FunnelChart({ data, className }) {
    // Data expected: [{ name: 'Quotations', value: 100 }, { name: 'Orders', value: 40 }]
    // We can compute conversion rate for tooltip

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const dataPoint = payload[0].payload;
            return (
                <div className="bg-white border border-slate-100 shadow-md rounded-lg p-2 text-xs">
                    <p className="font-semibold text-slate-800">{dataPoint.name}</p>
                    <p className="text-slate-600">{dataPoint.value} Documents</p>
                    {dataPoint.conversion && (
                        <p className="text-emerald-600 font-medium">
                            {dataPoint.conversion}% of previous
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <Card className={cn("border-slate-100 shadow-sm", className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Sales Funnel</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={data}
                            margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
                            barSize={30}
                        >
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={80}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={index === 0 ? '#d97706' : '#059669'}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500 px-2">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-600" />
                        <span>Quotations</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-600" />
                        <span>Orders</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function ProductList({ data, className }) {
    // Data expected: [{ name: 'Product A', value: 50000, quantity: 100 }]
    const sorted = [...(data || [])].sort((a, b) => b.value - a.value).slice(0, 5);
    const maxVal = sorted[0]?.value || 1;

    return (
        <Card className={cn("border-slate-100 shadow-sm", className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Top Products (Revenue)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {sorted.map((item, i) => (
                        <div key={i} className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <p className="text-sm font-medium text-slate-800 truncate" title={item.name}>
                                        {item.name}
                                    </p>
                                    <p className="text-xs font-semibold text-slate-900">
                                        {formatCurrency(item.value, { compact: true })}
                                    </p>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-600 rounded-full"
                                        style={{ width: `${(item.value / maxVal) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    {sorted.length === 0 && (
                        <p className="text-xs text-slate-400">No product data available.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
