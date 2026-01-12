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

        // Apply filters
        if (search) {
            query = query.or(`item_code.ilike.%${search}%,item_name.ilike.%${search}%,description.ilike.%${search}%`);
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
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createAdminClient();
        const body = await request.json();

        // Validate required fields
        if (!body.item_code || !body.item_name) {
            return NextResponse.json(
                { error: 'item_code and item_name are required' },
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
                { error: 'Product with this item_code already exists' },
                { status: 409 }
            );
        }

        // Prepare product data
        const productData = {
            item_code: body.item_code,
            item_name: body.item_name,
            description: body.description || null,
            item_group_id: body.item_group_id || null,
            brand_id: body.brand_id || null,
            stock_uom: body.stock_uom || 'Nos',
            standard_rate: body.standard_rate || 0,
            hsn_sac_code: body.hsn_sac_code || null,
            gst_rate: body.gst_rate || 18.00,
            length: body.length || null,
            width: body.width || null,
            height: body.height || null,
            dimension_uom: body.dimension_uom || 'mm',
            thickness_micron: body.thickness_micron || null,
            gsm: body.gsm || null,
            ply_count: body.ply_count || null,
            is_stock_item: body.is_stock_item ?? true,
            is_sales_item: body.is_sales_item ?? true,
            is_purchase_item: body.is_purchase_item ?? true,
            maintain_stock: body.maintain_stock ?? true,
            created_by: currentUser.id
        };

        const { data, error } = await supabase
            .from('products')
            .insert(productData)
            .select(`
                *,
                item_group:item_groups(id, name, path),
                brand:brands(id, name)
            `)
            .single();

        if (error) {
            console.error('Error creating product:', error);
            return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
        }

        return NextResponse.json({ product: data }, { status: 201 });
    } catch (error) {
        console.error('Products POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
