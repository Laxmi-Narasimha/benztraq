/**
 * Customers API Route
 * Full CRUD operations for customers
 * 
 * GET /api/customers - List all customers with filtering and pagination
 * POST /api/customers - Create a new customer
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getUserFromRequest } from '@/lib/auth';

/**
 * GET /api/customers
 * List customers with optional filters
 */
export async function GET(request) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createServerClient();
        const { searchParams } = new URL(request.url);

        // Parse query parameters
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status');
        const industryId = searchParams.get('industry_id');
        const accountManagerId = searchParams.get('account_manager_id');
        const sortBy = searchParams.get('sort_by') || 'created_at';
        const sortOrder = searchParams.get('sort_order') || 'desc';

        // Build query
        let query = supabase
            .from('customers')
            .select(`
                *,
                customer_group:customer_groups(id, name),
                industry:industries(id, name),
                account_manager:profiles!customers_account_manager_id_fkey(user_id, full_name, email),
                region:regions(id, name)
            `, { count: 'exact' });

        // Apply filters
        if (search) {
            query = query.or(`name.ilike.%${search}%,customer_code.ilike.%${search}%,gstin.ilike.%${search}%`);
        }

        if (status) {
            query = query.eq('status', status);
        }

        if (industryId) {
            query = query.eq('industry_id', industryId);
        }

        if (accountManagerId) {
            query = query.eq('account_manager_id', accountManagerId);
        }

        // By default, show only active customers
        query = query.eq('disabled', false);

        // Apply sorting
        const ascending = sortOrder === 'asc';
        query = query.order(sortBy, { ascending });

        // Apply pagination
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching customers:', error);
            return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
        }

        return NextResponse.json({
            customers: data || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            }
        });
    } catch (error) {
        console.error('Customers GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/customers
 * Create a new customer
 */
export async function POST(request) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createServerClient();
        const body = await request.json();

        // Validate required fields
        if (!body.name) {
            return NextResponse.json(
                { error: 'Customer name is required' },
                { status: 400 }
            );
        }

        // Generate customer code if not provided
        let customerCode = body.customer_code;
        if (!customerCode) {
            // Get next sequence number
            const { count } = await supabase
                .from('customers')
                .select('*', { count: 'exact', head: true });
            customerCode = `CUST-${String((count || 0) + 1).padStart(5, '0')}`;
        }

        // Check for duplicate customer_code
        const { data: existing } = await supabase
            .from('customers')
            .select('id')
            .eq('customer_code', customerCode)
            .single();

        if (existing) {
            return NextResponse.json(
                { error: 'Customer with this code already exists' },
                { status: 409 }
            );
        }

        // Prepare customer data
        const customerData = {
            name: body.name,
            customer_code: customerCode,
            customer_type: body.customer_type || 'Company',
            customer_group_id: body.customer_group_id || null,
            industry_id: body.industry_id || null,
            region_id: body.region_id || null,
            gstin: body.gstin || null,
            pan: body.pan || null,
            tax_category: body.tax_category || 'Regular',
            is_sez: body.is_sez || false,
            credit_limit: body.credit_limit || 0,
            credit_days: body.credit_days || 30,
            account_manager_id: body.account_manager_id || null,
            status: body.status || 'Active',
            email: body.email || null,
            phone: body.phone || null,
            created_by: user.id
        };

        const { data, error } = await supabase
            .from('customers')
            .insert(customerData)
            .select(`
                *,
                customer_group:customer_groups(id, name),
                industry:industries(id, name),
                region:regions(id, name)
            `)
            .single();

        if (error) {
            console.error('Error creating customer:', error);
            return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
        }

        return NextResponse.json({ customer: data }, { status: 201 });
    } catch (error) {
        console.error('Customers POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
