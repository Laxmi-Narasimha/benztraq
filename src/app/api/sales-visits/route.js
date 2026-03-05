/**
 * Sales Visits CRUD API
 * 
 * Handles logging, updating, and retrieving customer visits by ASMs.
 * Role-gated: managers see all visits, ASMs see only their own.
 * 
 * @module api/sales-visits
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/utils/session';
import { isManager } from '@/lib/utils/rbac';

export const dynamic = 'force-dynamic';

// ============================================================================
// GET — Fetch visits
// ============================================================================
export async function GET(request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('user_id');
        const fromDate = searchParams.get('from');
        const toDate = searchParams.get('to');
        const visitType = searchParams.get('type');
        const limit = parseInt(searchParams.get('limit')) || 100;

        const supabase = createAdminClient();
        let query = supabase
            .from('sales_visits')
            .select('*')
            .order('visit_date', { ascending: false })
            .limit(limit);

        // Role-based filtering
        if (!isManager(currentUser.role)) {
            query = query.eq('user_id', currentUser.id);
        } else if (userId) {
            query = query.eq('user_id', userId);
        }

        if (fromDate) query = query.gte('visit_date', fromDate);
        if (toDate) query = query.lte('visit_date', toDate);
        if (visitType) query = query.eq('visit_type', visitType);

        const { data, error } = await query;

        if (error) {
            console.error('[Sales Visits GET] Error:', error.message);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, visits: data || [] });
    } catch (error) {
        console.error('[Sales Visits GET] Fatal:', error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// ============================================================================
// POST — Log a new visit
// ============================================================================
export async function POST(request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            customer_id,
            customer_name,
            visit_date,
            visit_type = 'meeting',
            outcome = 'no_outcome',
            notes,
            duration_minutes,
            quotation_id,
        } = body;

        if (!visit_date) {
            return NextResponse.json({ success: false, error: 'visit_date is required' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Allow managers to log visits on behalf of ASMs
        const targetUserId = (isManager(currentUser.role) && body.user_id) ? body.user_id : currentUser.id;

        const { data, error } = await supabase
            .from('sales_visits')
            .insert({
                user_id: targetUserId,
                customer_id: customer_id || null,
                customer_name: customer_name || null,
                visit_date,
                visit_type,
                outcome,
                notes: notes || null,
                duration_minutes: duration_minutes || null,
                quotation_id: quotation_id || null,
            })
            .select()
            .single();

        if (error) {
            console.error('[Sales Visits POST] Error:', error.message);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, visit: data });
    } catch (error) {
        console.error('[Sales Visits POST] Fatal:', error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// ============================================================================
// PUT — Update a visit
// ============================================================================
export async function PUT(request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: 'visit id is required' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Non-managers can only update their own visits
        let query = supabase.from('sales_visits').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
        if (!isManager(currentUser.role)) {
            query = query.eq('user_id', currentUser.id);
        }

        const { data, error } = await query.select().single();

        if (error) {
            console.error('[Sales Visits PUT] Error:', error.message);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, visit: data });
    } catch (error) {
        console.error('[Sales Visits PUT] Fatal:', error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// ============================================================================
// DELETE — Remove a visit
// ============================================================================
export async function DELETE(request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'visit id is required' }, { status: 400 });
        }

        const supabase = createAdminClient();
        let query = supabase.from('sales_visits').delete().eq('id', id);
        if (!isManager(currentUser.role)) {
            query = query.eq('user_id', currentUser.id);
        }

        const { error } = await query;

        if (error) {
            console.error('[Sales Visits DELETE] Error:', error.message);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Visit deleted' });
    } catch (error) {
        console.error('[Sales Visits DELETE] Fatal:', error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
