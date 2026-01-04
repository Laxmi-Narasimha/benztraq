"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#ef4444', '#8b5cf6'];

export function StatusPieChart({ data }) {
    if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-muted-foreground">No data available</div>;

    const renderLegend = (props) => {
        const { payload } = props;
        return (
            <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs">
                {payload.map((entry, index) => (
                    <div key={`item-${index}`} className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-zinc-400 font-medium">
                            {entry.value} ({data.find(d => d.name === entry.value)?.value})
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                />
                <Legend content={renderLegend} />
            </PieChart>
        </ResponsiveContainer>
    );
}
