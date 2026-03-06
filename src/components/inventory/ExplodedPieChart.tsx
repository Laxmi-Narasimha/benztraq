'use client';

import React, { useState, useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { Scale, Package, Star, ClipboardList, Trophy, Truck } from 'lucide-react';

const PIE_COLORS = [
    '#8b5cf6', '#ec4899', '#6366f1', '#a855f7', '#f43f5e',
    '#d946ef', '#f97316', '#22c55e', '#06b6d4', '#eab308'
];

interface ExplodedPieChartProps {
    data: any[];
    stats: any;
}

export default function ExplodedPieChart({ data, stats }: ExplodedPieChartProps) {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const chartRef = useRef<any>(null);

    const total = data?.reduce((sum, d) => sum + d.weight, 0) || 0;

    const option = useMemo(() => {
        if (!data || data.length === 0) return {};

        const seriesData = data.map((d, i) => ({
            name: d.name,
            value: Math.pow(d.weight, 0.4), // Use non-linear exponent to heavily scale down giant chunks so visual radius is balanced
            trueWeight: d.weight,
            itemStyle: {
                color: PIE_COLORS[i % PIE_COLORS.length]
            }
        }));

        return {
            tooltip: {
                show: true,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: '#e5e7eb',
                textStyle: { color: '#000', fontWeight: 'bold' },
                padding: [8, 14],
                formatter: '{b}' // Specifically requested to only show company name on chart hover
            },
            series: [
                {
                    type: 'pie',
                    radius: ['0%', '85%'],
                    center: ['50%', '50%'],
                    roseType: 'radius',
                    label: {
                        show: false
                    },
                    data: seriesData,
                    emphasis: {
                        scale: true,
                        scaleSize: 12, // Distinct pull-out exactly on hover
                        itemStyle: {
                            shadowBlur: 20,
                            shadowColor: 'rgba(0, 0, 0, 0.3)',
                            shadowOffsetX: 0,
                            shadowOffsetY: 10
                        }
                    }
                }
            ]
        };
    }, [data]);

    const onEvents = {
        mouseover: (params: any) => {
            if (params.dataIndex !== undefined) {
                setHoveredIdx(params.dataIndex);
            }
        },
        mouseout: () => {
            setHoveredIdx(null);
        },

    };

    if (!data || data.length === 0) {
        return <div className="text-sm text-neutral-400 text-center py-12">No data</div>;
    }

    const hovered = hoveredIdx !== null ? data[hoveredIdx] : null;

    return (
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
            {/* Left: ECharts Pie */}
            <div className="flex flex-col items-center flex-shrink-0 w-full max-w-[320px]">
                <div className="w-full h-[280px]">
                    <ReactECharts
                        ref={chartRef}
                        option={option}
                        style={{ height: '100%', width: '100%' }}
                        onEvents={onEvents}
                        opts={{ renderer: 'svg' }}
                    />
                </div>
                {/* Custom Legend */}
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-[-10px] pb-4">
                    {data.map((s, i) => (
                        <div key={i}
                            className="flex items-center gap-1.5 cursor-pointer group"
                            onMouseEnter={() => {
                                setHoveredIdx(i);
                                chartRef.current?.getEchartsInstance().dispatchAction({
                                    type: 'highlight',
                                    seriesIndex: 0,
                                    dataIndex: i
                                });
                            }}
                            onMouseLeave={() => {
                                setHoveredIdx(null);
                                chartRef.current?.getEchartsInstance().dispatchAction({
                                    type: 'downplay',
                                    seriesIndex: 0,
                                    dataIndex: i
                                });
                            }}
                            style={{ opacity: hoveredIdx !== null && hoveredIdx !== i ? 0.3 : 1, transition: 'opacity 0.2s' }}>
                            <span className="w-2.5 h-2.5 rounded-[3px] flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-[10px] text-neutral-500 group-hover:text-neutral-800 transition-colors font-medium">{s.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Info Panel (Premium Redesign) */}
            <div className="flex-1 min-w-0 w-full">
                {hovered ? (
                    <div key={hoveredIdx} className="animate-in fade-in duration-200">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="w-6 h-6 rounded-lg shadow-sm" style={{ backgroundColor: PIE_COLORS[hoveredIdx % PIE_COLORS.length] }} />
                            <h4 className="font-extrabold text-2xl text-neutral-900 dark:text-white tracking-tight">{hovered.name}</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <InfoTile label="Stock Weight" value={`${(hovered.weight / 1000).toFixed(2)}T`} sub={`${((hovered.weight / total) * 100).toFixed(1)}% of inventory limit`} color={PIE_COLORS[hoveredIdx % PIE_COLORS.length]} Icon={Package} />
                            <InfoTile label="Rank" value={`#${hoveredIdx + 1}`} sub={`of ${data.length} top companies`} color={PIE_COLORS[hoveredIdx % PIE_COLORS.length]} Icon={Trophy} />
                            <InfoTile label="#1 Product" value={hovered.topProduct || '—'} sub={`${(hovered.topBalance || 0).toLocaleString()} pcs in warehouse`} color={PIE_COLORS[hoveredIdx % PIE_COLORS.length]} Icon={Star} small />
                            <InfoTile label="Total SKUs" value={hovered.itemCount || 0} sub="active product variants" color={PIE_COLORS[hoveredIdx % PIE_COLORS.length]} Icon={ClipboardList} />
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-1.5 h-6 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                            <h4 className="font-bold text-sm text-neutral-400 uppercase tracking-[0.2em]">Overall Stock Overview</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <InfoTile label="Total Weight" value={`${((stats?.totalStockKg || 0) / 1000).toFixed(1)}T`} sub={`${Math.round(stats?.totalStockKg || 0).toLocaleString()} KG aggregate`} color="#6366f1" Icon={Scale} />
                            <InfoTile label="Active Items" value={stats?.inStockItems || 0} sub={`out of ${stats?.totalItems || 0} cataloged`} color="#22c55e" Icon={Package} />
                            <InfoTile label="#1 Product Overall" value={stats?.overallTopProduct || '—'} sub={`${(stats?.overallTopBalance || 0).toLocaleString()} pcs balance`} color="#8b5cf6" Icon={Star} small />
                            <InfoTile label="Most Dispatched" value={stats?.mostDispatched || '—'} sub={`${(stats?.mostDispatchedQty || 0).toLocaleString()} pcs moved`} color="#f43f5e" Icon={Truck} small />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function InfoTile({ label, value, sub, color, Icon, small }: { label: string, value: string | number, sub?: string, color: string, Icon?: any, small?: boolean }) {
    return (
        <div className="relative overflow-hidden rounded-2xl px-5 py-4 border border-white/60 dark:border-white/5 bg-gradient-to-br from-white/80 to-neutral-50/50 dark:from-neutral-900/80 dark:to-neutral-900/40 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all group">
            <div className="flex items-center gap-2 mb-2">
                {Icon && <Icon className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-colors" strokeWidth={2.5} />}
                <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em]">{label}</p>
            </div>
            <p className={`font-black text-neutral-900 dark:text-white tracking-tight ${small ? 'text-lg leading-tight' : 'text-3xl'}`} style={{ color }}>
                {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {sub && <p className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 mt-1">{sub}</p>}
        </div>
    );
}
