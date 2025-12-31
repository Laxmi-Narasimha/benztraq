/**
 * Common Components: Loading Skeleton
 * 
 * Premium loading skeleton components for various layouts.
 * 
 * @module components/common/LoadingSkeleton
 */

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Page loading skeleton.
 * Shows skeleton for entire page with header and content sections.
 */
export function PageSkeleton() {
    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-8 w-32" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.from({ length: 2 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-40" />
                            <Skeleton className="h-4 w-56" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-[300px]" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Table */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <Skeleton className="h-10 w-full" />
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Table loading skeleton.
 * 
 * @param {Object} props - Component props
 * @param {number} [props.rows=5] - Number of rows to show
 * @param {number} [props.columns=5] - Number of columns to show
 */
export function TableSkeleton({ rows = 5, columns = 5 }) {
    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex gap-4 border-b pb-3">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} className="h-4 flex-1" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4 py-2">
                    {Array.from({ length: columns }).map((_, j) => (
                        <Skeleton key={j} className="h-6 flex-1" />
                    ))}
                </div>
            ))}
        </div>
    );
}

/**
 * Form loading skeleton.
 * 
 * @param {Object} props - Component props
 * @param {number} [props.fields=4] - Number of field rows to show
 */
export function FormSkeleton({ fields = 4 }) {
    return (
        <div className="space-y-6">
            {Array.from({ length: fields }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ))}
            <Skeleton className="h-10 w-32" />
        </div>
    );
}

/**
 * Card list loading skeleton.
 * 
 * @param {Object} props - Component props
 * @param {number} [props.count=3] - Number of cards to show
 */
export function CardListSkeleton({ count = 3 }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <Card key={i}>
                    <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                            <Skeleton className="h-12 w-12 rounded-lg" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-5 w-48" />
                                <Skeleton className="h-4 w-full" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-6 w-20" />
                                    <Skeleton className="h-6 w-24" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
