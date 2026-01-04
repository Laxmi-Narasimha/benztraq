"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function RevenueChart({ data, userMap }) {
    // Determine keys to plot
    // If data[0] has 'revenue_UUID', we are in comparison mode
    // If data[0] has 'revenue', we are in aggregate mode

    if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-muted-foreground">No data available</div>;

    const firstPoint = data[0];
    const comparisonKeys = Object.keys(firstPoint).filter(k => k.startsWith('revenue_'));
    const isComparison = comparisonKeys.length > 0;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${value / 1000}k`}
                />
                <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value) => [`₹${value.toLocaleString()}`, '']}
                />
                <Legend iconType="circle" />

                {isComparison ? (
                    // Comparison Mode: Plot each user
                    comparisonKeys.map((key, index) => {
                        const uid = key.replace('revenue_', '');
                        const name = userMap[uid] || 'User';
                        const color = COLORS[index % COLORS.length];

                        return (
                            <React.Fragment key={uid}>
                                {/* Actual Line */}
                                <Line
                                    type="monotone"
                                    dataKey={key}
                                    name={`${name} (Actual)`}
                                    stroke={color}
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                                {/* Target Line (Dashed, lighter) */}
                                <Line
                                    type="monotone"
                                    dataKey={`target_${uid}`}
                                    name={`${name} (Target)`}
                                    stroke={color}
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={false}
                                    opacity={0.5}
                                />
                            </React.Fragment>
                        );
                    })
                ) : (
                    // Aggregate Mode
                    <>
                        <Line
                            type="monotone"
                            dataKey="revenue"
                            name="Actual Revenue"
                            stroke="#22c55e"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="target"
                            name="Target"
                            stroke="#ffffff"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                            opacity={0.5}
                        />
                    </>
                )}
            </LineChart>
        </ResponsiveContainer>
    );
}

import React from 'react';
