/**
 * Funnel Chart Component
 * 
 * Displays quote to sales order conversion funnel.
 * 
 * @module components/dashboard/FunnelChart
 */

'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber, formatPercent } from '@/lib/utils/formatting';
import { cn } from '@/lib/utils';

/**
 * FunnelChart component.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.data - Funnel data
 * @param {number} props.data.quotes - Number of quotes
 * @param {number} props.data.salesOrders - Number of sales orders
 * @param {number} props.data.invoices - Number of invoices (optional)
 * @param {string} [props.title='Conversion Funnel'] - Chart title
 * @param {string} [props.description] - Chart description
 * @param {boolean} [props.loading=false] - Show loading state
 * @param {string} [props.className] - Additional CSS classes
 */
export function FunnelChart({
    data = { quotes: 0, salesOrders: 0, invoices: 0 },
    title = 'Conversion Funnel',
    description,
    loading = false,
    className,
}) {
    const funnelStages = useMemo(() => {
        const { quotes, salesOrders, invoices } = data;

        const quoteToSalesRate = quotes > 0 ? (salesOrders / quotes) * 100 : 0;
        const salesToInvoiceRate = salesOrders > 0 ? (invoices / salesOrders) * 100 : 0;

        return [
            {
                label: 'Quotations',
                value: quotes,
                color: 'bg-blue-500',
                width: 100,
            },
            {
                label: 'Sales Orders',
                value: salesOrders,
                color: 'bg-emerald-500',
                width: quotes > 0 ? (salesOrders / quotes) * 100 : 0,
                conversionRate: quoteToSalesRate,
                conversionLabel: 'Quote → SO',
            },
            {
                label: 'Invoices',
                value: invoices,
                color: 'bg-violet-500',
                width: quotes > 0 ? (invoices / quotes) * 100 : 0,
                conversionRate: salesToInvoiceRate,
                conversionLabel: 'SO → Invoice',
            },
        ];
    }, [data]);

    if (loading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-56" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ))}
                    </div>
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
                <div className="space-y-6">
                    {funnelStages.map((stage, index) => (
                        <div key={stage.label} className="space-y-2">
                            {/* Label and Value */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{stage.label}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold">{formatNumber(stage.value)}</span>
                                    {stage.conversionRate !== undefined && (
                                        <span className="text-xs text-muted-foreground">
                                            ({formatPercent(stage.conversionRate)} from {stage.conversionLabel})
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Bar */}
                            <div className="relative h-10 w-full bg-muted rounded-lg overflow-hidden">
                                <div
                                    className={cn(
                                        'absolute inset-y-0 left-0 rounded-lg transition-all duration-500',
                                        stage.color
                                    )}
                                    style={{ width: `${Math.max(stage.width, 2)}%` }}
                                />

                                {/* Percentage inside bar */}
                                <div className="absolute inset-0 flex items-center px-3">
                                    <span className={cn(
                                        'text-sm font-medium',
                                        stage.width > 30 ? 'text-white' : 'text-foreground'
                                    )}>
                                        {stage.width > 0 && formatPercent(stage.width)}
                                    </span>
                                </div>
                            </div>

                            {/* Connector arrow */}
                            {index < funnelStages.length - 1 && (
                                <div className="flex justify-center py-1">
                                    <svg
                                        className="w-4 h-4 text-muted-foreground"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                        />
                                    </svg>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Summary */}
                <div className="mt-6 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Overall Conversion Rate</span>
                        <span className="font-semibold text-emerald-600">
                            {formatPercent(
                                data.quotes > 0 ? (data.salesOrders / data.quotes) * 100 : 0
                            )}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
