import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/utils/session';
import { NextResponse } from 'next/server';
import { startOfMonth, endOfMonth, eachMonthOfInterval, format, isWithinInterval, differenceInDays } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        // ========================================
        // AUTHENTICATION (Custom JWT Session)
        // ========================================
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createAdminClient();

        const { searchParams } = new URL(request.url);
        const dateFrom = searchParams.get('from') || new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
        const dateTo = searchParams.get('to') || new Date().toISOString();
        const salespersonIds = searchParams.get('users')?.split(',').filter(Boolean) || [];

        // Get Profile from currentUser (already have it)
        const profile = currentUser;
        const userId = currentUser.id;

        const isManager = ['vp', 'director', 'head_of_sales'].includes(profile.role);

        // ========================================
        // 1. ACCESSIBLE USERS (for filter dropdown)
        // ========================================
        let accessibleUsers = [];

        if (isManager) {
            // Manager can see all ASMs
            const { data: teamProfiles } = await supabase
                .from('profiles')
                .select('user_id, full_name, role')
                .eq('role', 'asm');

            accessibleUsers = (teamProfiles || []).map(p => ({
                id: p.user_id,
                name: p.full_name || 'Unknown',
                role: p.role
            }));
        }

        // Determine effective user IDs for queries
        let effectiveUserIds = salespersonIds.length > 0 ? salespersonIds : [];
        if (!isManager) {
            // ASM can only see themselves
            effectiveUserIds = [userId];
        }

        // ========================================
        // 2. FETCH ALL DOCUMENTS
        // ========================================
        let docQuery = supabase
            .from('documents')
            .select(`
                id,
                doc_type,
                doc_date,
                doc_number,
                total_value,
                status,
                salesperson_user_id,
                customer_name_raw,
                product_name,
                quantity
            `)
            .in('doc_type', ['quotation', 'sales_order'])
            .gte('doc_date', dateFrom)
            .lte('doc_date', dateTo);

        if (effectiveUserIds.length > 0) {
            docQuery = docQuery.in('salesperson_user_id', effectiveUserIds);
        }

        const { data: docs, error: docsError } = await docQuery;
        if (docsError) throw docsError;

        // ========================================
        // 3. CALCULATE PREVIOUS PERIOD (for comparison)
        // ========================================
        const fromDate = new Date(dateFrom);
        const toDate = new Date(dateTo);
        const periodLengthDays = differenceInDays(toDate, fromDate);
        const prevFrom = new Date(fromDate.getTime() - periodLengthDays * 24 * 60 * 60 * 1000);
        const prevTo = new Date(fromDate.getTime() - 1);

        let prevDocQuery = supabase
            .from('documents')
            .select('doc_type, total_value, status')
            .in('doc_type', ['quotation', 'sales_order'])
            .gte('doc_date', prevFrom.toISOString())
            .lte('doc_date', prevTo.toISOString());

        if (effectiveUserIds.length > 0) {
            prevDocQuery = prevDocQuery.in('salesperson_user_id', effectiveUserIds);
        }

        const { data: prevDocs } = await prevDocQuery;

        // ========================================
        // 4. FETCH TARGETS
        // ========================================
        const years = new Set([
            new Date(dateFrom).getFullYear(),
            new Date(dateTo).getFullYear()
        ]);

        const { data: targetsData } = await supabase
            .from('annual_targets')
            .select('*')
            .in('year', Array.from(years))
            .in('salesperson_user_id', effectiveUserIds.length > 0 ? effectiveUserIds : accessibleUsers.map(u => u.id));

        // ========================================
        // 5. AGGREGATION HELPER
        // ========================================
        const aggregateMetrics = (filteredDocs) => {
            let revenue = 0, ordersCount = 0, quotesValue = 0, quotesCount = 0;

            filteredDocs.forEach(d => {
                if (d.doc_type === 'sales_order' && d.status !== 'cancelled') {
                    revenue += (d.total_value || 0);
                    ordersCount++;
                } else if (d.doc_type === 'quotation') {
                    quotesValue += (d.total_value || 0);
                    quotesCount++;
                }
            });

            return { revenue, ordersCount, quotesValue, quotesCount };
        };

        // ========================================
        // 6. SUMMARY METRICS
        // ========================================
        const currentMetrics = aggregateMetrics(docs || []);
        const previousMetrics = aggregateMetrics(prevDocs || []);

        const revenueChange = previousMetrics.revenue > 0
            ? Math.round(((currentMetrics.revenue - previousMetrics.revenue) / previousMetrics.revenue) * 100)
            : 0;
        const ordersChange = previousMetrics.ordersCount > 0
            ? Math.round(((currentMetrics.ordersCount - previousMetrics.ordersCount) / previousMetrics.ordersCount) * 100)
            : 0;

        const summaryMetrics = {
            totalRevenue: currentMetrics.revenue,
            totalQuotedValue: currentMetrics.quotesValue,
            totalOrders: currentMetrics.ordersCount,
            totalQuotations: currentMetrics.quotesCount,
            conversionRate: currentMetrics.quotesCount > 0
                ? Math.round((currentMetrics.ordersCount / currentMetrics.quotesCount) * 100)
                : 0,
            avgOrderValue: currentMetrics.ordersCount > 0
                ? Math.round(currentMetrics.revenue / currentMetrics.ordersCount)
                : 0,
            previousPeriod: {
                revenue: previousMetrics.revenue,
                orders: previousMetrics.ordersCount,
                revenueChange,
                ordersChange
            }
        };

        // ========================================
        // 7. MONTHLY TREND DATA
        // ========================================
        const months = eachMonthOfInterval({
            start: startOfMonth(new Date(dateFrom)),
            end: endOfMonth(new Date(dateTo))
        });

        const chartData = months.map(date => {
            const monthKey = format(date, 'MMM yyyy');
            const monthStart = startOfMonth(date);
            const monthEnd = endOfMonth(date);
            const point = { name: monthKey, date: date.toISOString() };

            // Per-user metrics for comparison
            if (effectiveUserIds.length > 0) {
                effectiveUserIds.forEach(uid => {
                    const userDocs = (docs || []).filter(d =>
                        d.salesperson_user_id === uid &&
                        isWithinInterval(new Date(d.doc_date), { start: monthStart, end: monthEnd })
                    );
                    const metrics = aggregateMetrics(userDocs);
                    point[`revenue_${uid}`] = metrics.revenue;
                    point[`orders_${uid}`] = metrics.ordersCount;
                    point[`quotes_val_${uid}`] = metrics.quotesValue;
                    point[`quotes_${uid}`] = metrics.quotesCount;

                    const year = date.getFullYear();
                    const targetRec = targetsData?.find(t => t.salesperson_user_id === uid && t.year === year);
                    point[`target_${uid}`] = targetRec ? Math.round(targetRec.annual_target / 12) : 0;
                });
            }

            // Aggregated metrics
            const monthDocs = (docs || []).filter(d =>
                isWithinInterval(new Date(d.doc_date), { start: monthStart, end: monthEnd })
            );
            const totalMetrics = aggregateMetrics(monthDocs);

            point.revenue = totalMetrics.revenue;
            point.orders = totalMetrics.ordersCount;
            point.quotations = totalMetrics.quotesCount;
            point.quotations_value = totalMetrics.quotesValue;
            point.conversion = totalMetrics.quotesCount > 0
                ? Math.round((totalMetrics.ordersCount / totalMetrics.quotesCount) * 100)
                : 0;

            const year = date.getFullYear();
            const relevantTargets = targetsData?.filter(t => t.year === year) || [];
            point.target = relevantTargets.reduce((sum, t) => sum + (Number(t.annual_target) / 12), 0);

            return point;
        });

        // ========================================
        // 8. TOP PRODUCTS (by Revenue)
        // ========================================
        const productMap = {};
        (docs || []).filter(d => d.doc_type === 'sales_order' && d.status !== 'cancelled').forEach(d => {
            const name = d.product_name || 'Unknown Product';
            if (!productMap[name]) {
                productMap[name] = { name, revenue: 0, quantity: 0, orders: 0 };
            }
            productMap[name].revenue += (d.total_value || 0);
            productMap[name].quantity += (d.quantity || 0);
            productMap[name].orders += 1;
        });
        const topProducts = Object.values(productMap)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        // ========================================
        // 9. TOP CUSTOMERS (by Revenue)
        // ========================================
        const customerMap = {};
        (docs || []).filter(d => d.doc_type === 'sales_order' && d.status !== 'cancelled').forEach(d => {
            const name = d.customer_name_raw || d.customer_display_name || 'Unknown Customer';
            if (!customerMap[name]) {
                customerMap[name] = { name, revenue: 0, orders: 0, lastOrder: d.doc_date };
            }
            customerMap[name].revenue += (d.total_value || 0);
            customerMap[name].orders += 1;
            if (new Date(d.doc_date) > new Date(customerMap[name].lastOrder)) {
                customerMap[name].lastOrder = d.doc_date;
            }
        });
        const topCustomers = Object.values(customerMap)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        // ========================================
        // 10. FUNNEL DATA (from Quotation Statuses)
        // ========================================
        const quotations = (docs || []).filter(d => d.doc_type === 'quotation');
        const orders = (docs || []).filter(d => d.doc_type === 'sales_order' && d.status !== 'cancelled');

        const funnelData = [
            {
                stage: 'Quotations Created',
                count: quotations.length,
                value: quotations.reduce((s, d) => s + (d.total_value || 0), 0)
            },
            {
                stage: 'Sent to Customer',
                count: quotations.filter(d => d.status === 'sent' || d.status === 'accepted' || d.status === 'rejected').length,
                value: quotations.filter(d => d.status === 'sent' || d.status === 'accepted' || d.status === 'rejected')
                    .reduce((s, d) => s + (d.total_value || 0), 0)
            },
            {
                stage: 'Converted to Order',
                count: orders.length,
                value: orders.reduce((s, d) => s + (d.total_value || 0), 0)
            }
        ];

        // ========================================
        // 11. PIE DATA (Status Distribution)
        // ========================================
        const statusCounts = {};
        (docs || []).forEach(d => {
            const s = d.status ? (d.status.charAt(0).toUpperCase() + d.status.slice(1).replace('_', ' ')) : 'Unknown';
            statusCounts[s] = (statusCounts[s] || 0) + 1;
        });
        const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

        // ========================================
        // 12. USER MAP (for chart legends)
        // ========================================
        let userMap = {};
        if (effectiveUserIds.length > 0) {
            const { data: userProfiles } = await supabase
                .from('profiles')
                .select('user_id, full_name')
                .in('user_id', effectiveUserIds);

            (userProfiles || []).forEach(p => {
                userMap[p.user_id] = p.full_name || 'Unknown';
            });
        }

        // ========================================
        // RETURN COMPLETE RESPONSE
        // ========================================
        return NextResponse.json({
            // For filters
            accessibleUsers,
            isManager,
            currentUserId: userId,

            // Summary
            summaryMetrics,

            // Charts
            revenueTrend: chartData,
            funnelData,
            pieData,

            // Tables
            topProducts,
            topCustomers,

            // Utilities
            userMap,
            meta: {
                effectiveUserIds,
                isComparison: effectiveUserIds.length > 1,
                dateRange: { from: dateFrom, to: dateTo }
            }
        });

    } catch (error) {
        console.error('Analytics API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
