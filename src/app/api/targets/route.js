/**
 * Targets API Route
 * 
 * GET - Fetch targets for the authenticated user or all team members (if manager)
 * POST - Create/Update a target (Director/Head of Sales only)
 * 
 * @module api/targets
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/utils/session';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createAdminClient();
        const { searchParams } = new URL(request.url);
        const year = parseInt(searchParams.get('year')) || new Date().getFullYear();

        const isManager = ['vp', 'director', 'head_of_sales', 'developer'].includes(currentUser.role);

        // Fetch targets
        let targetQuery = supabase
            .from('annual_targets')
            .select(`
                id,
                salesperson_user_id,
                year,
                annual_target,
                created_at,
                created_by
            `)
            .eq('year', year);

        // If not manager, only show own targets
        if (!isManager) {
            targetQuery = targetQuery.eq('salesperson_user_id', currentUser.id);
        }

        const { data: targets, error: targetError } = await targetQuery;
        if (targetError) throw targetError;

        // Fetch salesperson profiles for names
        const salespersonIds = [...new Set(targets.map(t => t.salesperson_user_id))];
        const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name, email')
            .in('user_id', salespersonIds.length > 0 ? salespersonIds : ['none']);

        const profileMap = {};
        profiles?.forEach(p => { profileMap[p.user_id] = p; });

        // Fetch actual sales data for each salesperson
        const { data: documents } = await supabase
            .from('documents')
            .select('salesperson_user_id, total_value, doc_date, status')
            .eq('doc_type', 'sales_order')
            .neq('status', 'cancelled')
            .in('salesperson_user_id', salespersonIds.length > 0 ? salespersonIds : ['none']);

        // Calculate monthly achievements
        const achievementsMap = {};
        documents?.forEach(doc => {
            const uid = doc.salesperson_user_id;
            const docDate = new Date(doc.doc_date);
            const docYear = docDate.getFullYear();
            const docMonth = docDate.getMonth() + 1;

            if (docYear === year) {
                if (!achievementsMap[uid]) {
                    achievementsMap[uid] = {};
                }
                if (!achievementsMap[uid][docMonth]) {
                    achievementsMap[uid][docMonth] = 0;
                }
                achievementsMap[uid][docMonth] += parseFloat(doc.total_value || 0);
            }
        });

        // Combine targets with achievements
        const enrichedTargets = targets.map(t => ({
            id: t.id,
            salespersonId: t.salesperson_user_id,
            salespersonName: profileMap[t.salesperson_user_id]?.full_name || 'Unknown',
            salespersonEmail: profileMap[t.salesperson_user_id]?.email,
            year: t.year,
            annualTarget: parseFloat(t.annual_target),
            achieved: achievementsMap[t.salesperson_user_id] || {},
            totalAchieved: Object.values(achievementsMap[t.salesperson_user_id] || {}).reduce((a, b) => a + b, 0),
            createdAt: t.created_at,
        }));

        // Fetch available salespeople for the dropdown (if manager)
        let availableSalespeople = [];
        if (isManager) {
            const { data: salespeople } = await supabase
                .from('profiles')
                .select('user_id, full_name, email')
                .eq('role', 'asm')
                .eq('is_active', true);

            availableSalespeople = (salespeople || []).map(s => ({
                id: s.user_id,
                name: s.full_name,
                email: s.email,
            }));
        }

        return NextResponse.json({
            targets: enrichedTargets,
            availableSalespeople,
            canSetTargets: isManager,
            year,
        });

    } catch (error) {
        console.error('Targets API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check permissions - only Directors and Head of Sales can set targets
        const canSetTargets = ['vp', 'director', 'head_of_sales', 'developer'].includes(currentUser.role);
        if (!canSetTargets) {
            return NextResponse.json({ error: 'Permission denied. Only Directors and Head of Sales can set targets.' }, { status: 403 });
        }

        const { salespersonId, year, annualTarget } = await request.json();

        if (!salespersonId || !year || !annualTarget) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Upsert the target
        const { data, error } = await supabase
            .from('annual_targets')
            .upsert({
                salesperson_user_id: salespersonId,
                year: parseInt(year),
                annual_target: parseFloat(annualTarget),
                created_by: currentUser.id,
            }, {
                onConflict: 'salesperson_user_id,year'
            })
            .select()
            .single();

        if (error) {
            console.error('Target upsert error:', error);
            return NextResponse.json({ error: 'Failed to save target' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Target saved successfully',
            target: data,
        });

    } catch (error) {
        console.error('Targets POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
