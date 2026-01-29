/**
 * Targets API Route - Fixed Version
 * 
 * Features:
 * - Only returns the 6 valid ASM regions
 * - Tracks who set each target
 * - Logs all target changes
 * 
 * @module api/targets
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/utils/session';

export const dynamic = 'force-dynamic';

// The ONLY valid ASM regions that can have targets
const VALID_ASM_REGIONS = [
    'Karnataka',
    'Madhya Pradesh',
    'Maharashtra',
    'Noida',
    'Rajasthan',
    'West Zone'
];

// Manager roles that can set targets
const MANAGER_ROLES = ['developer', 'director', 'head_of_sales', 'head of sales', 'vp'];

function isManager(role) {
    if (!role) return false;
    return MANAGER_ROLES.includes(role.toLowerCase());
}

function canSetTargets(role) {
    return isManager(role);
}

// ============================================================================
// GET HANDLER
// ============================================================================

export async function GET(request) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized',
                targets: [],
                availableSalespeople: [],
                canSetTargets: false
            }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const year = parseInt(searchParams.get('year')) || new Date().getFullYear();
        const userIsManager = isManager(currentUser.role);
        const userCanSetTargets = canSetTargets(currentUser.role);

        const supabase = createAdminClient();

        let targets = [];
        let availableSalespeople = [];

        // Step 1: Fetch ONLY valid ASM profiles (no duplicates)
        // Filter by: is in VALID_ASM_REGIONS, has email, is active, role is 'asm'
        try {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('user_id, full_name, email, role')
                .in('full_name', VALID_ASM_REGIONS)
                .eq('is_active', true)
                .not('email', 'is', null)
                .neq('email', '')
                .order('full_name');

            // Deduplicate by full_name (keep first one with email)
            const uniqueProfiles = {};
            (profiles || []).forEach(p => {
                if (!uniqueProfiles[p.full_name] && p.email) {
                    uniqueProfiles[p.full_name] = p;
                }
            });

            availableSalespeople = Object.values(uniqueProfiles).map(p => ({
                id: p.user_id,
                name: p.full_name,
                email: p.email
            }));

            console.log('[Targets API GET] Available ASM regions:', availableSalespeople.map(s => s.name));
        } catch (e) {
            console.error('[Targets API GET] Profiles error:', e.message);
        }

        // Step 2: Fetch targets ONLY for valid ASM regions
        const validUserIds = availableSalespeople.map(s => s.id);

        if (validUserIds.length > 0) {
            try {
                const { data: targetData, error: targetError } = await supabase
                    .from('annual_targets')
                    .select('*')
                    .eq('year', year)
                    .in('salesperson_user_id', validUserIds);

                if (targetError) {
                    console.error('[Targets API GET] Target fetch error:', targetError.message);
                } else if (targetData && targetData.length > 0) {
                    // Get profile names
                    const profileMap = {};
                    availableSalespeople.forEach(p => { profileMap[p.id] = p; });

                    // Fetch sales orders for achievement calculation
                    const startDate = `${year}-01-01`;
                    const endDate = `${year}-12-31`;

                    const { data: salesOrders } = await supabase
                        .from('documents')
                        .select('salesperson_user_id, grand_total, doc_date')
                        .eq('doc_type', 'sales_order')
                        .in('salesperson_user_id', validUserIds)
                        .gte('doc_date', startDate)
                        .lte('doc_date', endDate);

                    // Calculate achieved by salesperson
                    const achievedMap = {};
                    const monthlyAchievedMap = {};

                    (salesOrders || []).forEach(so => {
                        const spId = so.salesperson_user_id;
                        const amount = parseFloat(so.grand_total) || 0;
                        achievedMap[spId] = (achievedMap[spId] || 0) + amount;

                        if (so.doc_date) {
                            const month = new Date(so.doc_date).getMonth() + 1;
                            if (!monthlyAchievedMap[spId]) {
                                monthlyAchievedMap[spId] = {};
                            }
                            monthlyAchievedMap[spId][month] = (monthlyAchievedMap[spId][month] || 0) + amount;
                        }
                    });

                    // Build targets with tracking info
                    targets = targetData.map(t => ({
                        id: t.id,
                        salespersonId: t.salesperson_user_id,
                        salespersonName: profileMap[t.salesperson_user_id]?.name || 'Unknown',
                        year: t.year,
                        annualTarget: parseFloat(t.annual_target) || 0,
                        totalAchieved: achievedMap[t.salesperson_user_id] || 0,
                        monthlyAchieved: monthlyAchievedMap[t.salesperson_user_id] || {},
                        setBy: t.set_by_name || null,
                        setByUserId: t.set_by_user_id || null,
                        createdAt: t.created_at || null,
                        updatedAt: t.updated_at || null,
                    }));

                    // Non-managers can only see their own targets
                    if (!userIsManager) {
                        targets = targets.filter(t => t.salespersonId === currentUser.id);
                    }
                }
            } catch (e) {
                console.error('[Targets API GET] Targets error:', e.message);
            }
        }

        return NextResponse.json({
            success: true,
            targets,
            availableSalespeople,
            canSetTargets: userCanSetTargets,
            year,
            isManager: userIsManager,
        });

    } catch (error) {
        console.error('[Targets API GET] Fatal error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            targets: [],
            availableSalespeople: [],
            canSetTargets: false
        }, { status: 200 });
    }
}

// ============================================================================
// POST HANDLER - Set/Update Target with Logging
// ============================================================================

export async function POST(request) {
    console.log('[Targets API POST] Start');

    try {
        // Step 1: Auth
        const currentUser = await getCurrentUser();
        console.log('[Targets API POST] Current user:', JSON.stringify(currentUser, null, 2));

        if (!currentUser) {
            console.log('[Targets API POST] No user found - returning 401');
            return NextResponse.json({
                success: false,
                error: 'Unauthorized - Please log in again'
            }, { status: 401 });
        }

        console.log('[Targets API POST] User ID:', currentUser.id, 'Role:', currentUser.role, 'Name:', currentUser.fullName);

        // Step 2: Permission check
        if (!canSetTargets(currentUser.role)) {
            console.log('[Targets API POST] Permission denied for role:', currentUser.role);
            return NextResponse.json({
                success: false,
                error: `Permission denied. Role: ${currentUser.role}`
            }, { status: 403 });
        }

        // Step 3: Parse body
        let body;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json({
                success: false,
                error: 'Invalid JSON in request body'
            }, { status: 400 });
        }

        const { salespersonId, year, annualTarget, oldTarget } = body;

        // Validate required fields
        if (!salespersonId || !year || annualTarget === undefined) {
            return NextResponse.json({
                success: false,
                error: 'Missing required fields: salespersonId, year, annualTarget'
            }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Step 4: Verify the salesperson is a valid ASM region
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('user_id, full_name, email')
            .eq('user_id', salespersonId)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({
                success: false,
                error: 'Invalid salesperson ID'
            }, { status: 400 });
        }

        if (!VALID_ASM_REGIONS.includes(profile.full_name)) {
            return NextResponse.json({
                success: false,
                error: `Targets can only be set for ASM regions: ${VALID_ASM_REGIONS.join(', ')}`
            }, { status: 400 });
        }

        // Step 5: Check for existing target
        const { data: existing } = await supabase
            .from('annual_targets')
            .select('*')
            .eq('salesperson_user_id', salespersonId)
            .eq('year', year)
            .single();

        let result;
        let action = 'created';

        if (existing) {
            // Update existing target
            action = 'updated';
            const { data, error } = await supabase
                .from('annual_targets')
                .update({
                    annual_target: annualTarget,
                    set_by_user_id: currentUser.id,
                    set_by_name: currentUser.fullName || currentUser.email,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id)
                .select()
                .single();

            if (error) {
                console.error('[Targets API POST] Update error:', error);
                return NextResponse.json({
                    success: false,
                    error: error.message
                }, { status: 500 });
            }
            result = data;
        } else {
            // Create new target
            const { data, error } = await supabase
                .from('annual_targets')
                .insert({
                    salesperson_user_id: salespersonId,
                    year: year,
                    annual_target: annualTarget,
                    set_by_user_id: currentUser.id,
                    set_by_name: currentUser.fullName || currentUser.email,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) {
                console.error('[Targets API POST] Insert error:', error);
                return NextResponse.json({
                    success: false,
                    error: error.message
                }, { status: 500 });
            }
            result = data;
        }

        // Step 6: Log the change
        try {
            await supabase
                .from('target_logs')
                .insert({
                    target_id: result.id,
                    action: action,
                    salesperson_user_id: salespersonId,
                    salesperson_name: profile.full_name,
                    year: year,
                    old_value: oldTarget || null,
                    new_value: annualTarget,
                    changed_by_user_id: currentUser.id,
                    changed_by_name: currentUser.fullName || currentUser.email,
                    notes: action === 'updated'
                        ? `Target changed from ₹${(oldTarget || 0).toLocaleString()} to ₹${annualTarget.toLocaleString()}`
                        : `New target of ₹${annualTarget.toLocaleString()} created`
                });
        } catch (logError) {
            console.error('[Targets API POST] Log insert error:', logError);
            // Don't fail the request if logging fails
        }

        console.log('[Targets API POST] Success:', result.id);

        return NextResponse.json({
            success: true,
            target: result,
            message: action === 'updated' ? 'Target updated successfully' : 'Target created successfully'
        });

    } catch (error) {
        console.error('[Targets API POST] Fatal error:', error.message);
        console.error('[Targets API POST] Stack:', error.stack);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

// ============================================================================
// GET LOGS - New endpoint for fetching target activity logs
// ============================================================================

export async function PATCH(request) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized'
            }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        if (action !== 'get_logs') {
            return NextResponse.json({
                success: false,
                error: 'Invalid action'
            }, { status: 400 });
        }

        const supabase = createAdminClient();
        const userIsManager = isManager(currentUser.role);

        let query = supabase
            .from('target_logs')
            .select('*')
            .order('changed_at', { ascending: false })
            .limit(100);

        // Non-managers can only see their own logs
        if (!userIsManager) {
            query = query.eq('salesperson_user_id', currentUser.id);
        }

        const { data: logs, error } = await query;

        if (error) {
            console.error('[Targets API PATCH] Logs error:', error);
            return NextResponse.json({
                success: false,
                error: error.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            logs: logs || []
        });

    } catch (error) {
        console.error('[Targets API PATCH] Fatal error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
