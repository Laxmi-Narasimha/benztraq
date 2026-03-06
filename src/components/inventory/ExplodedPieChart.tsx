'use client';

import React, { useState, useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';

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
            value: d.weight,
            itemStyle: {
                color: PIE_COLORS[i % PIE_COLORS.length]
            }
        }));

        return {
            tooltip: {
                show: false // Custom right panel handles info
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
                        <div className="flex items-center gap-2.5 mb-4">
                            <span className="w-5 h-5 rounded-md shadow-sm" style={{ backgroundColor: PIE_COLORS[hoveredIdx % PIE_COLORS.length] }} />
                            <h4 className="font-bold text-xl text-neutral-900 dark:text-white tracking-tight">{hovered.name}</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <InfoTile label="Stock Weight" value={`${(hovered.weight / 1000).toFixed(2)}T`} sub={`${((hovered.weight / total) * 100).toFixed(1)}% of total weight`} color={PIE_COLORS[hoveredIdx % PIE_COLORS.length]} icon="📦" />
                            <InfoTile label="Rank" value={`#${hoveredIdx + 1}`} sub={`of ${data.length} top companies`} color={PIE_COLORS[hoveredIdx % PIE_COLORS.length]} icon="🏆" />
                            <InfoTile label="#1 Product" value={hovered.topProduct || '—'} sub={`${(hovered.topBalance || 0).toLocaleString()} pcs in stock`} color={PIE_COLORS[hoveredIdx % PIE_COLORS.length]} icon="⭐" small />
                            <InfoTile label="Total SKUs" value={hovered.itemCount || 0} sub="product variants" color={PIE_COLORS[hoveredIdx % PIE_COLORS.length]} icon="📋" />
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-200">
                        <h4 className="font-semibold text-xs text-neutral-400 uppercase tracking-widest mb-4">Stock Overview</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <InfoTile label="Total Weight" value={`${((stats?.totalStockKg || 0) / 1000).toFixed(1)}T`} sub={`${Math.round(stats?.totalStockKg || 0).toLocaleString()} KG across all`} color="#6366f1" icon="⚖️" />
                            <InfoTile label="Active Items" value={stats?.inStockItems || 0} sub={`of ${stats?.totalItems || 0} total in system`} color="#22c55e" icon="📦" />
                            <InfoTile label="#1 Product Overall" value={stats?.overallTopProduct || '—'} sub={`${(stats?.overallTopBalance || 0).toLocaleString()} pcs balance`} color="#8b5cf6" icon="⭐" small />
                            <InfoTile label="Most Dispatched" value={stats?.mostDispatched || '—'} sub={`${(stats?.mostDispatchedQty || 0).toLocaleString()} pcs total`} color="#f43f5e" icon="🚚" small />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function InfoTile({ label, value, sub, color, icon, small }: { label: string, value: string | number, sub?: string, color: string, icon?: string, small?: boolean }) {
    return (
        <div className="rounded-xl px-3.5 py-3 border border-neutral-100 dark:border-neutral-700/50 bg-gradient-to-br from-white to-neutral-50/80 dark:from-neutral-800 dark:to-neutral-800/50 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-1.5 mb-1">
                {icon && <span className="text-[11px]">{icon}</span>}
                <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">{label}</p>
            </div>
            <p className={`font-bold text-neutral-900 dark:text-white ${small ? 'text-[13px] leading-tight' : 'text-lg'}`} style={{ color }}>
                {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {sub && <p className="text-[10px] text-neutral-400 mt-0.5 leading-tight">{sub}</p>}
        </div>
    );
}
