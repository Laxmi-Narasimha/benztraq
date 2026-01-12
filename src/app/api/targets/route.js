/**
 * Targets API Route - Ultra Robust Version
 * 
 * Handles all edge cases including missing tables.
 * 
 * @module api/targets
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/utils/session';

export const dynamic = 'force-dynamic';

// ASM names that can have targets set
const ASM_NAMES = ['Madhya Pradesh', 'Rajasthan', 'Karnataka', 'Maharashtra', 'Noida', 'West Zone'];

// Manager roles
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

        // Step 1: Fetch targets from annual_targets table
        try {
            const { data: targetData, error: targetError } = await supabase
                .from('annual_targets')
                .select('*')
                .eq('year', year);

            if (targetError) {
                console.error('[Targets API GET] Target fetch error:', targetError.message);
            } else if (targetData && targetData.length > 0) {
                const userIds = [...new Set(targetData.map(t => t.salesperson_user_id).filter(Boolean))];

                if (userIds.length > 0) {
                    // Fetch profiles
                    const { data: profiles } = await supabase
                        .from('profiles')
                        .select('user_id, full_name, email')
                        .in('user_id', userIds);

                    const profileMap = {};
                    (profiles || []).forEach(p => { profileMap[p.user_id] = p; });

                    // Step 2: Fetch sales orders for this year to calculate achieved amounts
                    const startDate = `${year}-01-01`;
                    const endDate = `${year}-12-31`;

                    const { data: salesOrders, error: salesError } = await supabase
                        .from('documents')
                        .select('salesperson_user_id, grand_total, doc_date')
                        .eq('doc_type', 'sales_order')
                        .in('salesperson_user_id', userIds)
                        .gte('doc_date', startDate)
                        .lte('doc_date', endDate);

                    if (salesError) {
                        console.error('[Targets API GET] Sales order fetch error:', salesError.message);
                    }

                    // Calculate achieved by salesperson (annual total)
                    const achievedMap = {};
                    const monthlyAchievedMap = {}; // { salesperson_id: { 1: amount, 2: amount, ... } }

                    (salesOrders || []).forEach(so => {
                        const spId = so.salesperson_user_id;
                        const amount = parseFloat(so.grand_total) || 0;

                        // Add to annual total
                        achievedMap[spId] = (achievedMap[spId] || 0) + amount;

                        // Add to monthly breakdown
                        if (so.doc_date) {
                            const month = new Date(so.doc_date).getMonth() + 1; // 1-12
                            if (!monthlyAchievedMap[spId]) {
                                monthlyAchievedMap[spId] = {};
                            }
                            monthlyAchievedMap[spId][month] = (monthlyAchievedMap[spId][month] || 0) + amount;
                        }
                    });

                    console.log('[Targets API GET] Achieved map:', achievedMap);

                    // Build targets with achieved amounts
                    targets = targetData.map(t => ({
                        id: t.id,
                        salespersonId: t.salesperson_user_id,
                        salespersonName: profileMap[t.salesperson_user_id]?.full_name || 'Unknown',
                        year: t.year,
                        annualTarget: parseFloat(t.annual_target) || 0,
                        totalAchieved: achievedMap[t.salesperson_user_id] || 0,
                        monthlyAchieved: monthlyAchievedMap[t.salesperson_user_id] || {},
                    }));

                    // Filter for ASMs if not manager
                    if (!userIsManager) {
                        targets = targets.filter(t => t.salespersonId === currentUser.id);
                    }
                }
            }
        } catch (e) {
            console.error('[Targets API GET] Exception:', e.message);
        }

        // Step 3: Fetch ASMs for filter dropdown
        if (userIsManager) {
            try {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('user_id, full_name, email')
                    .eq('is_active', true)
                    .order('full_name');

                const asmProfiles = (profiles || []).filter(p => ASM_NAMES.includes(p.full_name));

                availableSalespeople = asmProfiles.map(p => ({
                    id: p.user_id,
                    name: p.full_name,
                    email: p.email || ''
                }));
            } catch (e) {
                console.error('[Targets API GET] Profiles error:', e.message);
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
        }, { status: 200 }); // Return 200 to not break UI
    }
}

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(request) {
    console.log('[Targets API POST] Start');

    try {
        // Step 1: Auth
        const currentUser = await getCurrentUser();
        console.log('[Targets API POST] User:', currentUser?.id, 'Role:', currentUser?.role);

        if (!currentUser) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized - Please log in again'
            }, { status: 401 });
        }

        // Step 2: Permission check
        if (!canSetTargets(currentUser.role)) {
            return NextResponse.json({
                success: false,
                error: `Permission denied. Role: ${currentUser.role}`
            }, { status: 403 });
        }

        // Step 3: Parse body
        let body;
        try {
            body = await request.json();
            console.log('[Targets API POST] Body:', JSON.stringify(body));
        } catch (e) {
            return NextResponse.json({
                success: false,
                error: 'Invalid JSON in request body'
            }, { status: 400 });
        }

        const { salespersonId, year, annualTarget } = body;

        // Step 4: Validate
        if (!salespersonId) {
            return NextResponse.json({
                success: false,
                error: 'Salesperson ID is required'
            }, { status: 400 });
        }
        if (!year) {
            return NextResponse.json({
                success: false,
                error: 'Year is required'
            }, { status: 400 });
        }
        if (!annualTarget && annualTarget !== 0) {
            return NextResponse.json({
                success: false,
                error: 'Annual target is required'
            }, { status: 400 });
        }

        const yearNum = parseInt(year);
        const targetNum = parseFloat(annualTarget);

        // Step 5: DB connection
        let supabase;
        try {
            supabase = createAdminClient();
            console.log('[Targets API POST] Supabase client created');
        } catch (e) {
            console.error('[Targets API POST] DB init error:', e);
            return NextResponse.json({
                success: false,
                error: 'Database connection failed: ' + e.message
            }, { status: 500 });
        }

        // Step 6: Verify salesperson exists
        let salespersonName = 'Unknown';
        try {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('user_id, full_name')
                .eq('user_id', salespersonId)
                .single();

            console.log('[Targets API POST] Profile lookup:', profile?.full_name, 'Error:', profileError?.message);

            if (profileError || !profile) {
                return NextResponse.json({
                    success: false,
                    error: 'Salesperson not found',
                    details: profileError?.message || 'No profile for ID'
                }, { status: 404 });
            }

            salespersonName = profile.full_name;

            // Verify is ASM
            if (!ASM_NAMES.includes(profile.full_name)) {
                return NextResponse.json({
                    success: false,
                    error: `Cannot set target for ${profile.full_name}. Only ASMs allowed.`,
                    allowedASMs: ASM_NAMES
                }, { status: 400 });
            }
        } catch (e) {
            console.error('[Targets API POST] Profile lookup error:', e);
            return NextResponse.json({
                success: false,
                error: 'Profile lookup failed: ' + e.message
            }, { status: 500 });
        }

        // Step 7: Check if target exists
        let existingId = null;
        try {
            const { data: existing, error: existingError } = await supabase
                .from('annual_targets')
                .select('id')
                .eq('salesperson_user_id', salespersonId)
                .eq('year', yearNum)
                .maybeSingle();

            console.log('[Targets API POST] Existing check:', existing?.id, 'Error:', existingError?.message);

            if (existingError && existingError.code !== 'PGRST116') {
                // Table might not exist - try to create it
                if (existingError.code === '42P01') {
                    console.log('[Targets API POST] Table does not exist, will try to create');
                } else {
                    throw existingError;
                }
            }

            existingId = existing?.id;
        } catch (e) {
            console.error('[Targets API POST] Existing check error:', e);
            // Continue - might be new table situation
        }

        // Step 8: Upsert
        try {
            let result;

            if (existingId) {
                console.log('[Targets API POST] Updating existing:', existingId);
                result = await supabase
                    .from('annual_targets')
                    .update({
                        annual_target: targetNum,
                        created_by: currentUser.id,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingId)
                    .select()
                    .single();
            } else {
                console.log('[Targets API POST] Inserting new target');
                result = await supabase
                    .from('annual_targets')
                    .insert({
                        salesperson_user_id: salespersonId,
                        year: yearNum,
                        annual_target: targetNum,
                        created_by: currentUser.id
                    })
                    .select()
                    .single();
            }

            console.log('[Targets API POST] Upsert result:', result.data?.id, 'Error:', result.error?.message);

            if (result.error) {
                return NextResponse.json({
                    success: false,
                    error: 'Database save failed: ' + result.error.message, // Show actual error in toast
                    details: result.error.message,
                    code: result.error.code,
                    hint: result.error.hint
                }, { status: 500 });
            }

            // Step 9: Create notification for target change
            try {
                const notificationType = existingId ? 'target_updated' : 'target_set';
                const oldTarget = body.oldTarget || null;

                await supabase.from('notifications').insert({
                    type: notificationType,
                    title: existingId
                        ? `Target updated for ${salespersonName}`
                        : `New target set for ${salespersonName}`,
                    message: existingId
                        ? `Annual target changed from ₹${oldTarget?.toLocaleString() || 'N/A'} to ₹${targetNum.toLocaleString()} for ${yearNum}`
                        : `Annual target of ₹${targetNum.toLocaleString()} set for ${yearNum}`,
                    user_id: salespersonId, // The ASM this is about - they will see this
                    created_by: currentUser.id,
                    metadata: {
                        salesperson_id: salespersonId,
                        salesperson_name: salespersonName,
                        year: yearNum,
                        new_target: targetNum,
                        old_target: oldTarget,
                        set_by: currentUser.name || currentUser.email
                    }
                });
                console.log('[Targets API POST] Notification created');
            } catch (notifError) {
                // Don't fail the request if notification fails
                console.error('[Targets API POST] Notification error:', notifError.message);
            }

            return NextResponse.json({
                success: true,
                message: existingId ? 'Target updated' : 'Target created',
                target: {
                    id: result.data.id,
                    salespersonName,
                    year: yearNum,
                    annualTarget: targetNum
                }
            });

        } catch (e) {
            console.error('[Targets API POST] Upsert error:', e);
            return NextResponse.json({
                success: false,
                error: 'Upsert failed',
                details: e.message,
                stack: e.stack?.split('\n').slice(0, 3).join(' | ')
            }, { status: 500 });
        }

    } catch (error) {
        console.error('[Targets API POST] Fatal error:', error);
        return NextResponse.json({
            success: false,
            error: 'Server error',
            details: error.message,
            stack: error.stack?.split('\n').slice(0, 3).join(' | ')
        }, { status: 500 });
    }
}
