'use server';

import { createClient } from '@/lib/supabase/server';
import { startOfMonth, endOfMonth, subMonths, format, parseISO } from 'date-fns';

// 1. KPI Cards
export async function getKPICards() {
    const supabase = await createClient();

    // Total Revenue (This Year)
    const currentYear = new Date().getFullYear();
    const { data: revenueData } = await supabase
        .from('sales_orders')
        .select('amount_total')
        .eq('state', 'sale')
        .gte('date_order', `${currentYear}-01-01`);

    const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.amount_total || 0), 0) || 0;

    // Active Quotations (Pipeline)
    const { count: pipelineCount } = await supabase
        .from('quotations')
        .select('*', { count: 'exact', head: true })
        .in('status', ['draft', 'sent']);

    // Active Customers (Placed an order this year)
    const { data: customers } = await supabase
        .from('sales_orders')
        .select('partner_id')
        .eq('state', 'sale')
        .gte('date_order', `${currentYear}-01-01`);

    const activeCustomers = new Set(customers?.map(c => c.partner_id)).size;

    return {
        totalRevenue,
        pipelineCount: pipelineCount || 0,
        activeCustomers
    };
}

// 2. Sales Funnel
export async function getSalesFunnelMetrics() {
    const supabase = await createClient();

    // Fetch counts for different stages
    const { count: draftQuotes } = await supabase
        .from('quotations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft');

    const { count: sentQuotes } = await supabase
        .from('quotations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sent');

    const { count: confirmedOrders } = await supabase
        .from('sales_orders')
        .select('*', { count: 'exact', head: true })
        .eq('state', 'sale');

    // Simplified Funnel Data
    return [
        { name: 'Draft Quotes', value: draftQuotes || 0, fill: '#f59e0b' }, // Amber
        { name: 'Sent Quotes', value: sentQuotes || 0, fill: '#3b82f6' }, // Blue
        { name: 'Orders Won', value: confirmedOrders || 0, fill: '#10b981' }, // Green
    ];
}

// 3. Revenue Trend (Monthly)
export async function getRevenueTrend() {
    const supabase = await createClient();
    const currentYear = new Date().getFullYear();

    // Fetch Orders
    const { data: orders } = await supabase
        .from('sales_orders')
        .select('date_order, amount_total')
        .eq('state', 'sale')
        .gte('date_order', `${currentYear}-01-01`)
        .order('date_order');

    // Group by Month
    const months = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    monthNames.forEach(m => months[m] = 0);

    orders?.forEach(order => {
        if (!order.date_order) return;
        const date = new Date(order.date_order);
        const month = monthNames[date.getMonth()];
        months[month] += (order.amount_total || 0);
    });

    return Object.entries(months).map(([name, total]) => ({ name, total }));
}

// 4. Sales Leaderboard
export async function getSalesLeaderboard() {
    const supabase = await createClient();

    // Join with Profiles if possible, or fetch names manually if no relation
    const { data: orders } = await supabase
        .from('sales_orders')
        .select('user_id, amount_total')
        .eq('state', 'sale');

    const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name');

    const profileMap = {};
    profiles?.forEach(p => profileMap[p.user_id] = p.full_name);

    const leaderboard = {};

    orders?.forEach(order => {
        const userId = order.user_id;
        const name = profileMap[userId] || 'Unknown';

        if (!leaderboard[userId]) {
            leaderboard[userId] = { name, revenue: 0, count: 0 };
        }
        leaderboard[userId].revenue += (order.amount_total || 0);
        leaderboard[userId].count += 1;
    });

    return Object.values(leaderboard)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10); // Top 10
}

// 5. Regional Heatmap
export async function getRegionalSales() {
    const supabase = await createClient();

    // Requires joining customers to orders
    // Assuming sales_orders has partner_id -> customers.id -> state_name
    const { data: orders } = await supabase
        .from('sales_orders')
        .select(`
            amount_total,
            partner_state_code
        `)
        .eq('state', 'sale')
        .not('partner_state_code', 'is', null);

    const regions = {};

    orders?.forEach(order => {
        const state = order.partner_state_code || 'Unknown';
        regions[state] = (regions[state] || 0) + (order.amount_total || 0);
    });

    return Object.entries(regions)
        .map(([code, value]) => ({ code, value }))
        .sort((a, b) => b.value - a.value);
}
