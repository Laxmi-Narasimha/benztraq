/**
 * Products API Route
 * Full CRUD operations for products
 * 
 * GET /api/products - List all products with filtering and pagination
 * POST /api/products - Create a new product
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/utils/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/products
 * List products with optional filters
 */
export async function GET(request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createAdminClient();
        const { searchParams } = new URL(request.url);

        // Parse query parameters
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const search = searchParams.get('search') || '';
        const itemGroupId = searchParams.get('item_group_id');
        const disabled = searchParams.get('disabled');
        const sortBy = searchParams.get('sort_by') || 'created_at';
        const sortOrder = searchParams.get('sort_order') || 'desc';

        // Build query
        let query = supabase
            .from('products')
            .select(`
                *,
                item_group:item_groups(id, name, path),
                brand:brands(id, name)
            `, { count: 'exact' });

        // Apply search — split into words, each word must match (AND logic)
        // e.g. "vci laminated" matches "VCI HD Laminated Bag"
        if (search) {
            const words = search.trim().split(/\s+/).filter(w => w.length > 0);
            for (const word of words) {
                query = query.or(`item_code.ilike.%${word}%,item_name.ilike.%${word}%,description.ilike.%${word}%,tags.ilike.%${word}%`);
            }
        }

        if (itemGroupId) {
            query = query.eq('item_group_id', itemGroupId);
        }

        if (disabled !== null && disabled !== undefined) {
            query = query.eq('disabled', disabled === 'true');
        } else {
            // By default, show only active products
            query = query.eq('disabled', false);
        }

        // Apply sorting
        const ascending = sortOrder === 'asc';
        query = query.order(sortBy, { ascending });

        // Apply pagination
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching products:', error);
            return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
        }

        return NextResponse.json({
            products: data || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            }
        });
    } catch (error) {
        console.error('Products GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/products
 * Create a new product
 */
export async function POST(request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized — please log in again' }, { status: 401 });
        }

        const supabase = createAdminClient();
        let body;
        try {
            body = await request.json();
        } catch (parseErr) {
            return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
        }

        console.log('[Products POST] User:', currentUser.id, 'Body keys:', Object.keys(body).join(', '));

        // Validate required fields
        if (!body.item_code || !body.item_name) {
            return NextResponse.json(
                { error: 'Part Code and Item Name are required' },
                { status: 400 }
            );
        }

        // Check for duplicate item_code
        const { data: existing } = await supabase
            .from('products')
            .select('id')
            .eq('item_code', body.item_code)
            .single();

        if (existing) {
            return NextResponse.json(
                { error: `Product with code "${body.item_code}" already exists` },
                { status: 409 }
            );
        }

        // Helper: convert empty string to null, invalid UUID to null
        const toNull = (v) => (v === '' || v === undefined || v === null) ? null : v;
        const toUUID = (v) => {
            if (!v || v === '' || v === 'null' || v === 'undefined') return null;
            // Quick UUID format check
            if (typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(v)) return v;
            return null;
        };
        const toNum = (v) => {
            if (v === '' || v === null || v === undefined) return null;
            const n = parseFloat(v);
            return isNaN(n) ? null : n;
        };

        // Build product data — only include known columns
        const productData = {
            item_code: body.item_code.trim(),
            item_name: body.item_name.trim(),
            description: toNull(body.description),
            item_group_id: toUUID(body.item_group_id),
            brand_id: toUUID(body.brand_id),
            stock_uom: body.stock_uom || 'Nos',
            standard_rate: toNum(body.standard_rate) ?? 0,
            hsn_sac_code: toNull(body.hsn_sac_code),
            gst_rate: toNum(body.gst_rate) ?? 18.00,
            length: toNum(body.length),
            width: toNum(body.width),
            height: toNum(body.height),
            dimension_uom: body.dimension_uom || 'cm',
            thickness_micron: toNum(body.thickness_micron),
            gsm: toNum(body.gsm),
            ply_count: body.ply_count ? parseInt(body.ply_count) : null,
            is_stock_item: body.is_stock_item ?? true,
            is_sales_item: body.is_sales_item ?? true,
            is_purchase_item: body.is_purchase_item ?? true,
            maintain_stock: body.maintain_stock ?? true,
            created_by: currentUser.id,
            // Extended fields
            item_type: body.item_type || 'Product',
            buying_price: toNum(body.buying_price),
            landed_cost: toNum(body.landed_cost),
            gross_weight: toNum(body.gross_weight),
            net_weight: toNum(body.net_weight),
            weight_uom: body.weight_uom || 'kg',
            tags: toNull(body.tags),
            internal_notes: toNull(body.internal_notes),
            tracking_method: body.tracking_method || 'none',
            invoicing_policy: body.invoicing_policy || 'ordered',
            price_inclusive_tax: body.price_inclusive_tax ?? false,
            initial_stock: toNum(body.initial_stock),
            reorder_point: toNum(body.reorder_point),
            overstock_point: toNum(body.overstock_point),
        };

        console.log('[Products POST] Inserting:', body.item_code, body.item_name);

        // Attempt insert
        let { data, error } = await supabase
            .from('products')
            .insert(productData)
            .select(`*, item_group:item_groups(id, name, path), brand:brands(id, name)`)
            .single();

        // If column-not-found error, fall back to core fields only
        if (error && (error.code === '42703' || error.message?.includes('column') || error.message?.includes('does not exist'))) {
            console.warn('[Products POST] Extended column missing, trying core-only insert');
            // Remove extended fields
            const { item_type, buying_price, landed_cost, gross_weight, net_weight, weight_uom,
                tags, internal_notes, tracking_method, invoicing_policy, price_inclusive_tax,
                initial_stock, reorder_point, overstock_point, ...coreOnly } = productData;

            const fallback = await supabase
                .from('products')
                .insert(coreOnly)
                .select(`*, item_group:item_groups(id, name, path), brand:brands(id, name)`)
                .single();
            data = fallback.data;
            error = fallback.error;
        }

        if (error) {
            console.error('[Products POST] Insert error:', error.code, error.message, error.details, error.hint);
            return NextResponse.json(
                { error: `Failed to create product: ${error.message}` },
                { status: 500 }
            );
        }

        console.log('[Products POST] Created:', data.id);
        return NextResponse.json({ product: data }, { status: 201 });
    } catch (error) {
        console.error('[Products POST] Unexpected error:', error.message, error.stack);
        return NextResponse.json(
            { error: `Server error: ${error.message}` },
            { status: 500 }
        );
    }
}

