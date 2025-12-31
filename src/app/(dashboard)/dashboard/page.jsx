/**
 * Executive Dashboard Page
 * 
 * Main dashboard with KPIs, charts, and performance overview.
 * 
 * @module app/(dashboard)/dashboard/page
 */

'use client';

// Force dynamic rendering to avoid SSR issues with auth hooks
export const dynamic = 'force-dynamic';

import { useAuth } from '@/providers/auth-provider';
import { useFilters } from '@/providers/filter-provider';
import { TopBar } from '@/components/layout';
import {
    KPICard,
    KPICardGrid,
    SalesTrendChart,
    SalesByBarChart,
    FunnelChart,
} from '@/components/dashboard';
import { PageSkeleton, ChartEmptyState } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    IndianRupee,
    TrendingUp,
    Target,
    FileText,
    ShoppingCart,
    Percent,
    Sparkles,
} from 'lucide-react';

// Mock data for initial display - will be replaced with real data queries
const mockKPIs = {
    totalSales: 4523000,
    targetAchieved: 78.5,
    gap: 987000,
    quoteCount: 45,
    salesOrderCount: 32,
    conversionRate: 71.1,
    avgDiscount: 8.2,
    avgVariance: -5.4,
};

const mockTrendData = [
    { label: 'Jan', value: 320000 },
    { label: 'Feb', value: 450000 },
    { label: 'Mar', value: 380000 },
    { label: 'Apr', value: 520000 },
    { label: 'May', value: 610000 },
    { label: 'Jun', value: 580000 },
    { label: 'Jul', value: 690000 },
    { label: 'Aug', value: 750000 },
    { label: 'Sep', value: 820000 },
    { label: 'Oct', value: 680000 },
    { label: 'Nov', value: 720000 },
    { label: 'Dec', value: 485000 },
];

const mockSalesBySalesperson = [
    { name: 'Rahul Sharma', value: 1250000, count: 12 },
    { name: 'Priya Patel', value: 980000, count: 9 },
    { name: 'Amit Kumar', value: 850000, count: 11 },
    { name: 'Sneha Gupta', value: 720000, count: 8 },
    { name: 'Vikram Singh', value: 620000, count: 7 },
];

const mockSalesByRegion = [
    { name: 'Maharashtra', value: 1450000, count: 15 },
    { name: 'Gurgaon', value: 1120000, count: 12 },
    { name: 'Chennai', value: 890000, count: 10 },
    { name: 'Noida', value: 650000, count: 8 },
    { name: 'Jaipur', value: 450000, count: 5 },
    { name: 'Indore', value: 280000, count: 3 },
];

const mockFunnelData = {
    quotes: 45,
    salesOrders: 32,
    invoices: 28,
};

export default function DashboardPage() {
    const { profile, isManager } = useAuth();
    const { filters, filterParams } = useFilters();

    // TODO: Replace with actual data fetching using TanStack Query
    const isLoading = false;

    if (isLoading) {
        return <PageSkeleton />;
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        {isManager ? 'Team Performance Overview' : 'Your Performance Overview'}
                    </p>
                </div>
                <Button variant="outline" className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    Generate Executive Digest
                </Button>
            </div>

            {/* KPI Cards */}
            <KPICardGrid columns={4}>
                <KPICard
                    title="Total Sales (MTD)"
                    value={mockKPIs.totalSales}
                    type="currency"
                    compact
                    icon={<IndianRupee className="w-5 h-5" />}
                    trend={{ value: 12.5, direction: 'up', label: 'vs last month' }}
                />
                <KPICard
                    title="Target Achieved"
                    value={mockKPIs.targetAchieved}
                    type="percent"
                    icon={<Target className="w-5 h-5" />}
                    subtitle="Current month"
                />
                <KPICard
                    title="Gap to Target"
                    value={mockKPIs.gap}
                    type="currency"
                    compact
                    icon={<TrendingUp className="w-5 h-5" />}
                    subtitle="Remaining to achieve"
                />
                <KPICard
                    title="Quote → SO Rate"
                    value={mockKPIs.conversionRate}
                    type="percent"
                    icon={<Percent className="w-5 h-5" />}
                    trend={{ value: 5.2, direction: 'up', label: 'vs last month' }}
                />
            </KPICardGrid>

            {/* Secondary KPIs */}
            <KPICardGrid columns={4}>
                <KPICard
                    title="Quotations"
                    value={mockKPIs.quoteCount}
                    type="number"
                    icon={<FileText className="w-5 h-5" />}
                    subtitle="This period"
                />
                <KPICard
                    title="Sales Orders"
                    value={mockKPIs.salesOrderCount}
                    type="number"
                    icon={<ShoppingCart className="w-5 h-5" />}
                    subtitle="This period"
                />
                <KPICard
                    title="Avg Discount"
                    value={mockKPIs.avgDiscount}
                    type="percent"
                    subtitle="On sales orders"
                />
                <KPICard
                    title="Avg Variance from Quote"
                    value={mockKPIs.avgVariance}
                    type="percent"
                    trend={{ value: Math.abs(mockKPIs.avgVariance), direction: 'down', label: 'price decrease' }}
                />
            </KPICardGrid>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SalesTrendChart
                    data={mockTrendData}
                    title="Sales Trend"
                    description="Monthly sales performance over time"
                    lines={[{ key: 'value', name: 'Sales' }]}
                />
                <FunnelChart
                    data={mockFunnelData}
                    title="Conversion Funnel"
                    description="Quote to sales order to invoice conversion"
                />
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SalesByBarChart
                    data={mockSalesBySalesperson}
                    title="Sales by Salesperson"
                    description="Top performing team members"
                    layout="horizontal"
                />
                <SalesByBarChart
                    data={mockSalesByRegion}
                    title="Sales by Region"
                    description="Performance across regions"
                    layout="horizontal"
                />
            </div>

            {/* Additional Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Top Customers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { name: 'Tata Auto Components', value: 890000 },
                                { name: 'Mahindra Parts Ltd', value: 720000 },
                                { name: 'Hero Manufacturing', value: 650000 },
                                { name: 'Bajaj Industries', value: 580000 },
                                { name: 'TVS Exports', value: 450000 },
                            ].map((customer, index) => (
                                <div key={customer.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-muted-foreground w-6">
                                            {index + 1}
                                        </span>
                                        <span className="font-medium">{customer.name}</span>
                                    </div>
                                    <span className="font-semibold">
                                        ₹{(customer.value / 100000).toFixed(1)}L
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Top Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { name: 'PVC Packaging Film', value: 1120000 },
                                { name: 'Wooden Pallet Type A', value: 890000 },
                                { name: 'Industrial Crates', value: 750000 },
                                { name: 'Export Boxes', value: 620000 },
                                { name: 'Stretch Wrap', value: 480000 },
                            ].map((product, index) => (
                                <div key={product.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-muted-foreground w-6">
                                            {index + 1}
                                        </span>
                                        <span className="font-medium">{product.name}</span>
                                    </div>
                                    <span className="font-semibold">
                                        ₹{(product.value / 100000).toFixed(1)}L
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
