import { Suspense } from 'react';
import {
    getDeskMetrics,
    getKPICards,
    getSalesFunnelMetrics,
    getRevenueTrend,
    getSalesLeaderboard,
    getRegionalSales
} from '@/app/actions/dashboard-analytics';
import { KPICards } from '@/components/dashboard/KPICards';
import { SalesFunnel } from '@/components/dashboard/SalesFunnel';
import { RevenueTrend } from '@/components/dashboard/RevenueTrend';
import { SalesLeaderboard } from '@/components/dashboard/SalesLeaderboard';
import { RegionalHeatmap } from '@/components/dashboard/RegionalHeatmap';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
    // Parallel Data Fetching
    const [kpi, funnel, revenue, leaderboard, regions] = await Promise.all([
        getKPICards(),
        getSalesFunnelMetrics(),
        getRevenueTrend(),
        getSalesLeaderboard(),
        getRegionalSales(),
    ]);

    return (
        <div className="min-h-screen bg-stone-50/50 p-6 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Admin Overview</h1>
                    <p className="text-stone-500">Real-time sales performance and insights</p>
                </div>
                <div className="text-sm text-stone-400">
                    Last updated: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* KPI Cards */}
            <KPICards kpi={kpi} />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend - Main Chart */}
                <div className="col-span-1 lg:col-span-2">
                    <RevenueTrend data={revenue} />
                </div>

                {/* Sales Funnel */}
                <div className="col-span-1">
                    <SalesFunnel data={funnel} />
                </div>

                {/* Top Performers */}
                <div className="col-span-1">
                    <SalesLeaderboard data={leaderboard} />
                </div>

                {/* Regional Performance */}
                <div className="col-span-1">
                    <RegionalHeatmap data={regions} />
                </div>
            </div>
        </div>
    );
}
