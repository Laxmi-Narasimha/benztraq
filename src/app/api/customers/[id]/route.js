/**
 * Single Customer API Route
 * GET, PUT, DELETE operations for a specific customer
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/utils/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/customers/[id]
 * Get single customer with addresses and contacts
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
            .from('customers')
            .select(`
                *,
                customer_group:customer_groups(id, name),
                industry:industries(id, name),
                account_manager:profiles!customers_account_manager_id_fkey(user_id, full_name, email),
                region:regions(id, name),
                addresses:customer_addresses(
                    id, address_title, address_type, address_line1, address_line2,
                    city, state, state_code, pincode, country, gstin,
                    is_primary_address, is_shipping_address, phone, email_id
                ),
                contacts:customer_contacts(
                    id, salutation, first_name, last_name, designation, department,
                    email_id, phone, mobile_no, is_primary_contact, is_billing_contact
                )
            `)
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
            }
            console.error('Error fetching customer:', error);
            return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
        }

        return NextResponse.json({ customer: data });
    } catch (error) {
        console.error('Customer GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PUT /api/customers/[id]
 * Update customer
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
            customer_group,
            industry,
            account_manager,
            region,
            addresses,
            contacts,
            ...updateData
        } = body;

        // Add updated timestamp
        updateData.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('customers')
            .update(updateData)
            .eq('id', id)
            .select(`
                *,
                customer_group:customer_groups(id, name),
                industry:industries(id, name),
                region:regions(id, name)
            `)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
            }
            console.error('Error updating customer:', error);
            return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
        }

        return NextResponse.json({ customer: data });
    } catch (error) {
        console.error('Customer PUT error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/customers/[id]
 * Soft delete (disable) customer
 */
export async function DELETE(request, { params }) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('customers')
            .update({
                disabled: true,
                status: 'Inactive',
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select('id, name, disabled')
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
            }
            console.error('Error deleting customer:', error);
            return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
        }

        return NextResponse.json({
            message: 'Customer disabled successfully',
            customer: data
        });
    } catch (error) {
        console.error('Customer DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
