/**
 * Ergopack Contacts API
 * CRUD operations for contact tracking
 * 
 * GET /api/ergopack/contacts - List all contacts
 * POST /api/ergopack/contacts - Create new contact
 * PUT /api/ergopack/contacts - Update contact
 * DELETE /api/ergopack/contacts - Delete contact
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/utils/session';

/**
 * GET - List all contacts with optional filters
 */
export async function GET(request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const city = searchParams.get('city');
        const search = searchParams.get('search');

        const supabase = createAdminClient();

        let query = supabase
            .from('ergopack_contacts')
            .select(`
                *,
                created_by_user:profiles!ergopack_contacts_created_by_fkey(full_name),
                updated_by_user:profiles!ergopack_contacts_updated_by_fkey(full_name)
            `)
            .order('updated_at', { ascending: false });

        // Apply filters
        if (status && status !== 'all') {
            query = query.eq('status', status);
        }
        if (city) {
            query = query.eq('city', city);
        }
        if (search) {
            query = query.or(`company_name.ilike.%${search}%,contact_person.ilike.%${search}%,email.ilike.%${search}%`);
        }

        const { data: contacts, error } = await query;

        if (error) {
            console.error('Error fetching contacts:', error);
            return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
        }

        // Fetch latest activity for each contact
        const contactIds = contacts?.map(c => c.id) || [];
        let activitiesMap = {};

        if (contactIds.length > 0) {
            const { data: activities } = await supabase
                .from('ergopack_activities')
                .select(`
                    id, contact_id, activity_type, title, created_at,
                    creator:profiles!ergopack_activities_created_by_fkey(full_name)
                `)
                .in('contact_id', contactIds)
                .order('created_at', { ascending: false });

            // Group by contact_id, keep only latest per contact
            activities?.forEach(act => {
                if (!activitiesMap[act.contact_id]) {
                    activitiesMap[act.contact_id] = act;
                }
            });
        }

        // Merge latest activity into contacts
        const contactsWithActivity = contacts?.map(c => ({
            ...c,
            latest_activity: activitiesMap[c.id] || null
        })) || [];

        // Get stats
        const { data: allContacts } = await supabase
            .from('ergopack_contacts')
            .select('status');

        const stats = {
            total: allContacts?.length || 0,
            open: allContacts?.filter(c => c.status === 'open' || c.status === 'new').length || 0,
            contacted: allContacts?.filter(c => c.status === 'contacted').length || 0,
            proposal_sent: allContacts?.filter(c => c.status === 'proposal_sent').length || 0,
            deal_done: allContacts?.filter(c => c.status === 'deal_done' || c.status === 'won').length || 0,
            lost: allContacts?.filter(c => c.status === 'lost').length || 0,
            not_serviceable: allContacts?.filter(c => c.status === 'not_serviceable' || c.status === 'dormant').length || 0,
        };

        return NextResponse.json({ contacts: contactsWithActivity, stats });

    } catch (error) {
        console.error('Contacts API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST - Create a new contact
 */
export async function POST(request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const {
            companyName, contactPerson, email, phone, website,
            city, state, industry, companySize, source, notes, priority, status
        } = body;

        if (!companyName) {
            return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
        }

        const supabase = createAdminClient();

        const { data: contact, error } = await supabase
            .from('ergopack_contacts')
            .insert({
                company_name: companyName,
                contact_person: contactPerson || null,
                email: email || null,
                phone: phone || null,
                website: website || null,
                city: city || null,
                state: state || null,
                industry: industry || null,
                company_size: companySize || null,
                source: source || null,
                notes: notes || null,
                priority: priority || 'medium',
                status: status || 'open',
                created_by: user.id,
                updated_by: user.id,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating contact:', error);
            return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
        }

        // Log activity
        await supabase.from('ergopack_activities').insert({
            contact_id: contact.id,
            activity_type: 'note',
            title: 'Contact created',
            description: `Added ${companyName} to the system`,
            created_by: user.id,
        });

        return NextResponse.json({ contact, success: true });

    } catch (error) {
        console.error('Create contact error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PUT - Update a contact
 */
export async function PUT(request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Get current contact for status change logging
        const { data: current } = await supabase
            .from('ergopack_contacts')
            .select('status, company_name')
            .eq('id', id)
            .single();

        // Build update object with snake_case
        const updateData = {
            updated_by: user.id,
        };

        if (updates.companyName !== undefined) updateData.company_name = updates.companyName;
        if (updates.contactPerson !== undefined) updateData.contact_person = updates.contactPerson;
        if (updates.email !== undefined) updateData.email = updates.email;
        if (updates.phone !== undefined) updateData.phone = updates.phone;
        if (updates.website !== undefined) updateData.website = updates.website;
        if (updates.city !== undefined) updateData.city = updates.city;
        if (updates.state !== undefined) updateData.state = updates.state;
        if (updates.industry !== undefined) updateData.industry = updates.industry;
        if (updates.companySize !== undefined) updateData.company_size = updates.companySize;
        if (updates.source !== undefined) updateData.source = updates.source;
        if (updates.notes !== undefined) updateData.notes = updates.notes;
        if (updates.priority !== undefined) updateData.priority = updates.priority;
        if (updates.status !== undefined) updateData.status = updates.status;

        const { data: contact, error } = await supabase
            .from('ergopack_contacts')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating contact:', error);
            return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
        }

        // Log status change if applicable
        if (updates.status && current?.status !== updates.status) {
            await supabase.from('ergopack_activities').insert({
                contact_id: id,
                activity_type: 'status_change',
                title: `Status changed to ${updates.status}`,
                old_status: current?.status,
                new_status: updates.status,
                created_by: user.id,
            });
        }

        return NextResponse.json({ contact, success: true });

    } catch (error) {
        console.error('Update contact error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE - Delete a contact
 */
export async function DELETE(request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 });
        }

        // Check permissions
        const isAllowed = user.role === 'director' || user.role === 'vp' || user.role === 'developer';
        if (!isAllowed) {
            return NextResponse.json({ error: 'Access restricted: Only Directors and Admins can delete contacts' }, { status: 403 });
        }

        const supabase = createAdminClient();

        const { error } = await supabase
            .from('ergopack_contacts')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting contact:', error);
            return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Delete contact error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
