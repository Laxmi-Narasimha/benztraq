/**
 * KPI Card Component
 * 
 * Premium card for displaying key performance indicators.
 * Features:
 * - Icon display
 * - Value with optional compact formatting
 * - Trend indicator with color coding
 * - Optional subtitle/label
 * - Skeleton loading state
 * 
 * @module components/dashboard/KPICard
 */

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/utils/formatting';

/**
 * Props for KPICard component.
 * 
 * @typedef {Object} KPICardProps
 * @property {string} title - Card title/label
 * @property {number | string} value - Main value to display
 * @property {'currency' | 'percent' | 'number' | 'text'} [type='text'] - Value type for formatting
 * @property {React.ReactNode} [icon] - Icon component to display
 * @property {Object} [trend] - Trend indicator data
 * @property {number} trend.value - Trend value (percentage)
 * @property {'up' | 'down' | 'neutral'} trend.direction - Trend direction
 * @property {string} [trend.label] - Optional trend label
 * @property {string} [subtitle] - Additional context text
 * @property {boolean} [loading=false] - Show loading skeleton
 * @property {boolean} [compact=false] - Use compact number formatting
 * @property {string} [className] - Additional CSS classes
 */

/**
 * Formats the value based on type.
 * 
 * @param {number | string} value - The value to format
 * @param {string} type - The value type
 * @param {boolean} compact - Whether to use compact formatting
 * @returns {string} Formatted value
 */
function formatValue(value, type, compact) {
    switch (type) {
        case 'currency':
            return formatCurrency(value, { compact });
        case 'percent':
            return formatPercent(value);
        case 'number':
            return formatNumber(value);
        default:
            return String(value);
    }
}

/**
 * Gets the trend icon and color based on direction.
 * 
 * @param {'up' | 'down' | 'neutral'} direction - Trend direction
 * @returns {{Icon: React.ComponentType, colorClass: string}}
 */
function getTrendDisplay(direction) {
    switch (direction) {
        case 'up':
            return {
                Icon: TrendingUp,
                colorClass: 'text-emerald-600 bg-emerald-50',
            };
        case 'down':
            return {
                Icon: TrendingDown,
                colorClass: 'text-red-600 bg-red-50',
            };
        default:
            return {
                Icon: Minus,
                colorClass: 'text-gray-500 bg-gray-50',
            };
    }
}

/**
 * KPI Card component for dashboard metrics.
 * 
 * @param {KPICardProps} props - Component props
 */
export function KPICard({
    title,
    value,
    type = 'text',
    icon,
    trend,
    subtitle,
    loading = false,
    compact = false,
    className,
}) {
    if (loading) {
        return (
            <Card className={cn('overflow-hidden', className)}>
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-32" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="h-10 w-10 rounded-lg" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const formattedValue = formatValue(value, type, compact);
    const trendDisplay = trend ? getTrendDisplay(trend.direction) : null;

    return (
        <Card className={cn('overflow-hidden transition-shadow hover:shadow-md', className)}>
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    {/* Content */}
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold tracking-tight">{formattedValue}</p>

                        {/* Trend or Subtitle */}
                        {trend && trendDisplay && (
                            <div className="flex items-center gap-1.5 mt-1">
                                <span
                                    className={cn(
                                        'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium',
                                        trendDisplay.colorClass
                                    )}
                                >
                                    <trendDisplay.Icon className="h-3 w-3" />
                                    {formatPercent(Math.abs(trend.value))}
                                </span>
                                {trend.label && (
                                    <span className="text-xs text-muted-foreground">{trend.label}</span>
                                )}
                            </div>
                        )}

                        {!trend && subtitle && (
                            <p className="text-xs text-muted-foreground">{subtitle}</p>
                        )}
                    </div>

                    {/* Icon */}
                    {icon && (
                        <div className="flex-shrink-0 p-2.5 rounded-lg bg-primary/10 text-primary">
                            {icon}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * KPI Card Grid wrapper for consistent layout.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - KPI cards
 * @param {number} [props.columns=4] - Number of columns
 */
export function KPICardGrid({ children, columns = 4 }) {
    const gridCols = {
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
        5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    };

    return (
        <div className={cn('grid gap-4', gridCols[columns] || gridCols[4])}>
            {children}
        </div>
    );
}
