/**
 * Inventory Stats API
 * GET /api/inventory/stats - Dashboard statistics
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/utils/session';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createAdminClient();

        // Total active items
        const { count: totalItems } = await supabase
            .from('inventory_items')
            .select('id', { count: 'exact', head: true })
            .eq('is_active', true);

        // Items with stock (balance > 0)
        const { count: itemsInStock } = await supabase
            .from('inventory_items')
            .select('id', { count: 'exact', head: true })
            .eq('is_active', true)
            .gt('balance_qty', 0);

        // Items with zero stock
        const { count: zeroStockItems } = await supabase
            .from('inventory_items')
            .select('id', { count: 'exact', head: true })
            .eq('is_active', true)
            .lte('balance_qty', 0);

        // Total stock weight
        const { data: stockData } = await supabase
            .from('inventory_items')
            .select('stock_in_kg')
            .eq('is_active', true)
            .gt('balance_qty', 0);

        const totalStockKg = (stockData || []).reduce((sum, item) => sum + (parseFloat(item.stock_in_kg) || 0), 0);

        // Unique customers
        const { data: customerData } = await supabase
            .from('inventory_items')
            .select('customer_name')
            .eq('is_active', true)
            .gt('balance_qty', 0);

        const uniqueCustomers = new Set((customerData || []).map(d => d.customer_name)).size;

        // Warehouse breakdown
        const { data: warehouseData } = await supabase
            .from('inventory_items')
            .select('warehouse, balance_qty')
            .eq('is_active', true)
            .gt('balance_qty', 0);

        const warehouseBreakdown = {};
        (warehouseData || []).forEach(item => {
            if (!warehouseBreakdown[item.warehouse]) {
                warehouseBreakdown[item.warehouse] = { count: 0, totalBalance: 0 };
            }
            warehouseBreakdown[item.warehouse].count++;
            warehouseBreakdown[item.warehouse].totalBalance += parseFloat(item.balance_qty) || 0;
        });

        // Recent transactions (last 20)
        const { data: recentTxns } = await supabase
            .from('inventory_transactions')
            .select(`
                id, type, quantity, reference_note, created_by_name, created_at,
                inventory_items!inner(customer_name, material_type, part_size)
            `)
            .order('created_at', { ascending: false })
            .limit(20);

        // Today's transactions count
        const today = new Date().toISOString().split('T')[0];
        const { count: todayTxnCount } = await supabase
            .from('inventory_transactions')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', today);

        // Flatten recent transactions for activity feed
        const recentActivity = (recentTxns || []).map(txn => ({
            ...txn,
            customer_name: txn.inventory_items?.customer_name || 'Unknown',
            material_type: txn.inventory_items?.material_type || '',
            part_size: txn.inventory_items?.part_size || '',
        }));

        return NextResponse.json({
            totalItems: totalItems || 0,
            inStockItems: itemsInStock || 0,
            zeroStockItems: zeroStockItems || 0,
            totalStockKg: Math.round(totalStockKg * 100) / 100,
            uniqueCustomers,
            warehouseBreakdown,
            recentActivity,
            todayTransactions: todayTxnCount || 0,
        });
    } catch (error) {
        console.error('[Inventory] Stats error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
