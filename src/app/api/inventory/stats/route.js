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
            .select('customer_name, stock_in_kg, balance_qty, material_type')
            .eq('is_active', true)
            .gt('balance_qty', 0);

        const uniqueCustomers = new Set((customerData || []).map(d => d.customer_name)).size;

        // Top companies by stock weight (for pie chart) + per-company top product
        const companyMap = {};
        (customerData || []).forEach(item => {
            const name = item.customer_name;
            const kg = parseFloat(item.stock_in_kg) || 0;
            const bal = parseFloat(item.balance_qty) || 0;
            if (!companyMap[name]) companyMap[name] = { weight: 0, itemCount: 0, topProduct: null, topBalance: 0 };
            companyMap[name].weight += kg;
            companyMap[name].itemCount++;
            if (bal > companyMap[name].topBalance) {
                companyMap[name].topBalance = bal;
                companyMap[name].topProduct = `${item.material_type || ''} ${item.part_size || ''}`.trim() || 'N/A';
            }
        });
        const topCompanies = Object.entries(companyMap)
            .map(([name, d]) => ({
                name,
                weight: Math.round(d.weight * 100) / 100,
                itemCount: d.itemCount,
                topProduct: d.topProduct || 'N/A',
                topBalance: d.topBalance,
            }))
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 10);

        // Overall top product by balance
        let overallTopProduct = '—';
        let overallTopBalance = 0;
        (customerData || []).forEach(item => {
            const bal = parseFloat(item.balance_qty) || 0;
            if (bal > overallTopBalance) {
                overallTopBalance = bal;
                overallTopProduct = `${item.customer_name} — ${item.material_type || ''} ${item.part_size || ''}`.trim();
            }
        });

        // Most dispatched product (highest total_dispatched)
        const { data: topDispatchedItems } = await supabase
            .from('inventory_items')
            .select('customer_name, material_type, part_size, total_dispatched')
            .eq('is_active', true)
            .gt('total_dispatched', 0)
            .order('total_dispatched', { ascending: false })
            .limit(1);
        const mostDispatched = topDispatchedItems?.[0]
            ? `${topDispatchedItems[0].customer_name} — ${topDispatchedItems[0].material_type || ''} ${topDispatchedItems[0].part_size || ''}`.trim()
            : '—';
        const mostDispatchedQty = topDispatchedItems?.[0]?.total_dispatched || 0;

        // Material type breakdown (for bar chart)
        const materialMap = {};
        (customerData || []).forEach(item => {
            const mat = item.material_type || 'Other';
            if (!materialMap[mat]) materialMap[mat] = { count: 0, totalBalance: 0 };
            materialMap[mat].count++;
            materialMap[mat].totalBalance += parseFloat(item.balance_qty) || 0;
        });
        const materialBreakdown = Object.entries(materialMap)
            .map(([name, data]) => ({ name, count: data.count, totalBalance: Math.round(data.totalBalance) }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 12);

        // Stock alerts — items with very low balance (0 < balance ≤ 50)
        const { data: alertItems } = await supabase
            .from('inventory_items')
            .select('id, customer_name, material_type, part_size, uom, balance_qty')
            .eq('is_active', true)
            .gt('balance_qty', 0)
            .lte('balance_qty', 50)
            .order('balance_qty', { ascending: true })
            .limit(20);

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

        // Today's transactions count + details
        const today = new Date().toISOString().split('T')[0];
        const { count: todayTxnCount } = await supabase
            .from('inventory_transactions')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', today);

        const { data: todayTxns } = await supabase
            .from('inventory_transactions')
            .select(`
                id, type, quantity, created_by_name, created_at,
                inventory_items!inner(customer_name, material_type, part_size)
            `)
            .gte('created_at', today)
            .order('created_at', { ascending: false })
            .limit(30);

        const todayActivity = (todayTxns || []).map(txn => ({
            ...txn,
            customer_name: txn.inventory_items?.customer_name || 'Unknown',
            material_type: txn.inventory_items?.material_type || '',
            part_size: txn.inventory_items?.part_size || '',
        }));

        // Zero stock items (for zero stock alert table)
        const { data: zeroItems } = await supabase
            .from('inventory_items')
            .select('id, customer_name, material_type, part_size, uom, balance_qty, total_received, total_dispatched')
            .eq('is_active', true)
            .lte('balance_qty', 0)
            .gt('total_received', 0)
            .order('customer_name', { ascending: true })
            .limit(50);

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
            topCompanies,
            materialBreakdown,
            stockAlerts: alertItems || [],
            zeroStockList: zeroItems || [],
            warehouseBreakdown,
            recentActivity,
            todayTransactions: todayTxnCount || 0,
            todayActivity,
            overallTopProduct,
            overallTopBalance,
            mostDispatched,
            mostDispatchedQty,
        });
    } catch (error) {
        console.error('[Inventory] Stats error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
