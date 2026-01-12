/**
 * Bulk Product Import API
 * Imports products from commercial master data
 * 
 * POST /api/products/import
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/utils/session';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for bulk import

export async function POST(request) {
    try {
        // Check authentication
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only allow directors and developers to import
        const roleName = currentUser.profile?.role?.name?.toLowerCase();
        if (!['director', 'developer', 'vp'].includes(roleName)) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        const { products } = await request.json();

        if (!Array.isArray(products) || products.length === 0) {
            return NextResponse.json({ error: 'No products provided' }, { status: 400 });
        }

        const supabase = createAdminClient();
        const results = {
            success: 0,
            failed: 0,
            duplicates: 0,
            errors: []
        };

        // Process in batches of 100
        const batchSize = 100;
        for (let i = 0; i < products.length; i += batchSize) {
            const batch = products.slice(i, i + batchSize);

            // Prepare products for upsert
            const preparedProducts = batch.map(p => ({
                item_code: p.part_code || p.item_code || generateItemCode(p),
                part_code: p.part_code || null,
                item_name: p.item_name || p.part_name || 'Unknown Product',
                description: p.description || null,
                stock_uom: normalizeUOM(p.uom || p.stock_uom || 'PCS'),
                hsn_sac_code: p.hsn_code ? String(p.hsn_code).replace('.0', '') : null,
                gst_rate: p.gst_rate || 18,
                is_sales_item: true,
                maintain_stock: true,
                disabled: false,
                created_by: currentUser.id
            }));

            // Upsert to avoid duplicates
            const { data, error } = await supabase
                .from('products')
                .upsert(preparedProducts, {
                    onConflict: 'item_code',
                    ignoreDuplicates: true
                })
                .select('id');

            if (error) {
                results.errors.push({
                    batch: Math.floor(i / batchSize) + 1,
                    error: error.message
                });
                results.failed += batch.length;
            } else {
                results.success += data?.length || 0;
                results.duplicates += batch.length - (data?.length || 0);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Import complete: ${results.success} created, ${results.duplicates} skipped (duplicates), ${results.failed} failed`,
            results
        });

    } catch (error) {
        console.error('Product import error:', error);
        return NextResponse.json({ error: 'Import failed: ' + error.message }, { status: 500 });
    }
}

// Generate item code from product name
function generateItemCode(product) {
    const name = product.item_name || product.part_name || 'UNKNOWN';
    const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
    const timestamp = Date.now().toString(36).toUpperCase();
    return `${prefix}-${timestamp}`;
}

// Normalize UOM to standard format
function normalizeUOM(uom) {
    const uomMap = {
        'PCS': 'PCS',
        'KGS': 'KGS',
        'KG': 'KGS',
        'ROLL': 'ROLL',
        'SQM': 'SQM',
        'MTR': 'MTR',
        'LTR': 'LTR',
        'SET': 'SET',
        'NOS': 'PCS',
        'BOX': 'BOX',
        'COILS': 'COILS'
    };
    return uomMap[uom?.toUpperCase()] || 'PCS';
}
