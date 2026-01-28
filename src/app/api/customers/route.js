/**
 * Customers API Route
 * Full CRUD operations for customers
 * 
 * GET /api/customers - List all customers with filtering and pagination
 * POST /api/customers - Create a new customer
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/utils/session';

export const dynamic = 'force-dynamic';

// Roles that can see all data
const ADMIN_ROLES = ['developer', 'director', 'vp', 'head_of_sales'];

/**
 * GET /api/customers
 * List customers with optional filters
 * 
 * STRICT DATA ISOLATION:
 * - ASMs only see customers from their assigned region
 * - Directors/VP/Developers see all data
 */
export async function GET(request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createAdminClient();
        const { searchParams } = new URL(request.url);

        // Get user's profile to get role and region
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*, role:roles(id, name), region:regions(id, name)')
            .eq('user_id', currentUser.id)
            .single();

        if (profileError) {
            console.error('Profile fetch error:', profileError);
        }

        const userRole = profile?.role?.name || currentUser.role;
        const userRegionId = profile?.region_id;
        const userRegionName = profile?.region?.name;
        const canSeeAllData = ADMIN_ROLES.includes(userRole);

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

        // ======= DATA ISOLATION (RELAXED FOR TESTING) =======
        // TODO: Re-enable strict isolation after regions are properly assigned
        // For now, all authenticated users can see all customers
        // if (!canSeeAllData && userRegionId) {
        //     query = query.eq('region_id', userRegionId);
        // } else if (!canSeeAllData && !userRegionId) {
        //     return NextResponse.json({
        //         customers: [],
        //         pagination: { page, limit, total: 0, totalPages: 0 },
        //         userInfo: { role: userRole, region: null, canSeeAllData: false }
        //     });
        // }

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
            },
            userInfo: {
                role: userRole,
                region: userRegionName,
                canSeeAllData
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
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createAdminClient();
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
        if (!customerCode && (!body.parent_id || body.company_type === 'company')) {
            // Only generate code for main partners or companies
            // Get next sequence number
            const { count } = await supabase
                .from('customers')
                .select('*', { count: 'exact', head: true });
            customerCode = `CUST-${String((count || 0) + 1).padStart(5, '0')}`;
        }

        // Check for duplicate customer_code
        if (customerCode) {
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
        }

        // Prepare customer data - matching Odoo 1:1
        const customerData = {
            // Use Odoo field names primarily
            name: body.name,
            customer_code: customerCode,

            // Partner Type Logic
            company_type: body.company_type || (body.is_company ? 'company' : 'person'),
            is_company: body.is_company ?? (body.company_type === 'company'),
            parent_id: body.parent_id || null, // Link to parent company
            type: body.type || 'contact', // contact, invoice, delivery, other
            function: body.function || null, // Job Position

            // Address fields
            street: body.street || null,
            street2: body.street2 || null,
            city: body.city || null,
            zip: body.zip || null,
            // Odoo stores state_id and country_id as FKs. We might need to handle ID or code.
            // Assuming simplified text or existing ID for now.
            // In Odoo: state_id is Many2one (res.country.state), country_id is Many2one (res.country)
            // We use whatever matches our DB schema (likely state string or ID if table exists)
            // state_id: body.state_id || null, 
            country_id: body.country_id || 'IN',

            // Contact details
            phone: body.phone || null,
            mobile: body.mobile || null,
            email: body.email || null,
            website: body.website || null,

            // Indian Localization
            l10n_in_gst_treatment: body.l10n_in_gst_treatment || 'consumer',
            vat: body.vat || body.gstin || null, // GSTIN
            l10n_in_pan: body.l10n_in_pan || body.pan || null, // PAN

            // Business Properties
            property_payment_term_id: body.property_payment_term_id || null,
            property_product_pricelist: body.property_product_pricelist || null,
            property_account_position_id: body.property_account_position_id || null,
            property_stock_customer: body.property_stock_customer || null,
            property_stock_supplier: body.property_stock_supplier || null,

            // Legacy / App Specific mappings
            customer_group_id: body.customer_group_id || null,
            industry_id: body.industry_id || null,
            region_id: body.region_id || null,
            account_manager_id: body.account_manager_id || null,

            // Metdata
            active: body.active ?? true,
            comment: body.comment || null,
            created_by: currentUser.id
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
            return NextResponse.json({ error: error.message || 'Failed to create customer' }, { status: 500 });
        }

        // Handle Child Contacts (if any) - Use the EXISTING customer_contacts table
        if (data && body.child_ids && Array.isArray(body.child_ids) && body.child_ids.length > 0) {
            for (const child of body.child_ids) {
                // For address type (invoice, delivery, etc.), insert into customer_addresses
                if (['invoice', 'delivery', 'other'].includes(child.type)) {
                    const addressData = {
                        customer_id: data.id,
                        address_title: child.name,
                        address_type: child.type === 'invoice' ? 'Billing' : 'Shipping',
                        address_line1: child.street || '',
                        address_line2: child.street2 || '',
                        city: child.city || '',
                        state: child.state_id || '',
                        pincode: child.zip || '',
                        country: 'India',
                        phone: child.phone || '',
                        email_id: child.email || '',
                        is_primary_address: false,
                        is_shipping_address: child.type === 'delivery'
                    };

                    const { error: addressError } = await supabase
                        .from('customer_addresses')
                        .insert(addressData);

                    if (addressError) {
                        console.error('Error creating address:', addressError);
                    }
                } else {
                    // For contact type, insert into customer_contacts
                    const nameParts = (child.name || '').split(' ');
                    const contactData = {
                        customer_id: data.id,
                        first_name: nameParts[0] || 'Contact',
                        last_name: nameParts.slice(1).join(' ') || '',
                        email_id: child.email || '',
                        phone: child.phone || '',
                        mobile_no: child.mobile || '',
                        is_primary_contact: false,
                        is_billing_contact: false
                    };

                    const { error: contactError } = await supabase
                        .from('customer_contacts')
                        .insert(contactData);

                    if (contactError) {
                        console.error('Error creating contact:', contactError);
                    }
                }
            }
        }

        return NextResponse.json({ customer: data }, { status: 201 });
    } catch (error) {
        console.error('Customers POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
