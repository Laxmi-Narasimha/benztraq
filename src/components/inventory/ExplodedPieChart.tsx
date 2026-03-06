'use client';

import React, { useRef, useCallback } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { PieChart } from 'echarts/charts';
import {
    TooltipComponent,
    LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer]);

// Premium color palette
const COLORS = [
    '#7c3aed', '#ec4899', '#6366f1', '#a855f7', '#f43f5e',
    '#d946ef', '#f97316', '#10b981', '#06b6d4', '#eab308',
];

interface CompanyData {
    name: string;
    weight: number;
    itemCount?: number;
    topProduct?: string;
    topBalance?: number;
}

interface ExplodedPieChartProps {
    data: CompanyData[];
    onHover?: (company: CompanyData | null, index: number | null) => void;
}

export default function ExplodedPieChart({ data, onHover }: ExplodedPieChartProps) {
    const chartRef = useRef<ReactEChartsCore | null>(null);

    const seriesData = data.map((item, i) => ({
        name: item.name,
        value: item.weight,
        selected: true,  // All slices exploded by default
        itemStyle: {
            color: COLORS[i % COLORS.length],
            borderWidth: 0,
        },
        emphasis: {
            scaleSize: 12,
        },
    }));

    const option: echarts.EChartsCoreOption = {
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(15, 15, 15, 0.95)',
            borderColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            padding: [12, 16],
            textStyle: {
                color: '#fff',
                fontSize: 13,
                fontFamily: 'Inter, system-ui, sans-serif',
            },
            formatter: (params: any) => {
                const idx = data.findIndex(d => d.name === params.name);
                const company = idx >= 0 ? data[idx] : null;
                const weight = (params.value / 1000).toFixed(2);
                return `
                    <div style="font-weight:700;font-size:15px;margin-bottom:6px">${params.name}</div>
                    <div style="color:rgba(255,255,255,0.7);font-size:12px">
                        ${params.percent}% of total weight<br/>
                        <span style="font-weight:600;color:${params.color}">${weight}T</span> (${Math.round(params.value).toLocaleString()} KG)
                        ${company?.topProduct ? `<br/>#1 Product: <b>${company.topProduct}</b>` : ''}
                    </div>
                `;
            },
        },
        legend: {
            show: false,
        },
        series: [
            {
                type: 'pie',
                radius: '85%',
                center: ['50%', '50%'],
                selectedMode: 'multiple',
                selectedOffset: 14,
                avoidLabelOverlap: true,
                itemStyle: {
                    borderRadius: 4,
                    borderColor: 'transparent',
                    borderWidth: 0,
                },
                label: {
                    show: false,
                },
                labelLine: {
                    show: false,
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 20,
                        shadowColor: 'rgba(0, 0, 0, 0.25)',
                        shadowOffsetY: 4,
                    },
                    scale: true,
                    scaleSize: 8,
                },
                animationType: 'scale',
                animationEasing: 'cubicOut',
                animationDuration: 800,
                data: seriesData,
            },
        ],
    };

    const onEvents = {
        mouseover: useCallback((params: any) => {
            const idx = data.findIndex(d => d.name === params.name);
            onHover?.(idx >= 0 ? data[idx] : null, idx >= 0 ? idx : null);
        }, [data, onHover]),
        mouseout: useCallback(() => {
            onHover?.(null, null);
        }, [onHover]),
    };

    return (
        <ReactEChartsCore
            ref={chartRef}
            echarts={echarts}
            option={option}
            onEvents={onEvents}
            style={{ width: '100%', height: '280px' }}
            opts={{ renderer: 'canvas' }}
            notMerge
        />
    );
}
