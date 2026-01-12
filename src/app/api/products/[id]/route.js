/**
 * Single Product API Route
 * GET, PUT, DELETE operations for a specific product
 * 
 * GET /api/products/[id] - Get product details
 * PUT /api/products/[id] - Update product
 * DELETE /api/products/[id] - Delete product
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/utils/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/products/[id]
 * Get single product with all related data
 */
export async function GET(request, { params }) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                item_group:item_groups(id, name, path),
                brand:brands(id, name),
                barcodes:product_barcodes(id, barcode, barcode_type),
                uom_conversions:product_uom_conversion(id, from_uom, to_uom, conversion_factor),
                prices:item_prices(
                    id, 
                    price_list_rate, 
                    uom, 
                    min_qty,
                    price_list:price_lists(id, name)
                )
            `)
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Product not found' }, { status: 404 });
            }
            console.error('Error fetching product:', error);
            return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
        }

        return NextResponse.json({ product: data });
    } catch (error) {
        console.error('Product GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PUT /api/products/[id]
 * Update product
 */
export async function PUT(request, { params }) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const supabase = createAdminClient();
        const body = await request.json();

        // Remove fields that shouldn't be updated directly
        const {
            id: _,
            created_at,
            created_by,
            item_group,
            brand,
            barcodes,
            uom_conversions,
            prices,
            ...updateData
        } = body;

        // Add updated timestamp
        updateData.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', id)
            .select(`
                *,
                item_group:item_groups(id, name, path),
                brand:brands(id, name)
            `)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Product not found' }, { status: 404 });
            }
            console.error('Error updating product:', error);
            return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
        }

        return NextResponse.json({ product: data });
    } catch (error) {
        console.error('Product PUT error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/products/[id]
 * Soft delete (disable) product
 */
export async function DELETE(request, { params }) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const supabase = createAdminClient();

        // Soft delete - just mark as disabled
        const { data, error } = await supabase
            .from('products')
            .update({
                disabled: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select('id, item_code, disabled')
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Product not found' }, { status: 404 });
            }
            console.error('Error deleting product:', error);
            return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
        }

        return NextResponse.json({
            message: 'Product disabled successfully',
            product: data
        });
    } catch (error) {
        console.error('Product DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
