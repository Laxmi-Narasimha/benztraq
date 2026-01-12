/**
 * Users API Route
 * 
 * Provides user and region data for the application.
 * Uses centralized RBAC utilities for consistent access control.
 * 
 * Endpoints:
 * - GET /api/users - List all active users
 * - GET /api/users?type=regions - List all regions
 * - GET /api/users?type=salespeople - List ASMs for filters (managers only)
 * 
 * @module api/users
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/utils/session';
import {
    isManager,
    getASMsForFilter,
    logAPIAccess,
    logAPIError
} from '@/lib/utils/rbac';

export const dynamic = 'force-dynamic';

// ============================================================================
// CONSTANTS
// ============================================================================

const API_NAME = 'Users API';

// ============================================================================
// MAIN API HANDLER
// ============================================================================

export async function GET(request) {
    let currentUser = null;

    try {
        // =====================================================================
        // STEP 1: Authentication
        // =====================================================================
        currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized'
            }, { status: 401 });
        }

        // =====================================================================
        // STEP 2: Parse Parameters
        // =====================================================================
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        logAPIAccess(API_NAME, currentUser.id, currentUser.role, { type });

        // =====================================================================
        // STEP 3: Initialize Supabase Client
        // =====================================================================
        let supabase;
        try {
            supabase = createAdminClient();
        } catch (dbError) {
            logAPIError(API_NAME, dbError, { step: 'DB Init' });
            return NextResponse.json({
                success: false,
                error: 'Database connection failed'
            }, { status: 500 });
        }

        // =====================================================================
        // STEP 4: Handle Different Query Types
        // =====================================================================

        // -----------------------------------------------------------------
        // TYPE: regions - Return list of regions
        // -----------------------------------------------------------------
        if (type === 'regions') {
            try {
                const { data: regions, error } = await supabase
                    .from('regions')
                    .select('id, name')
                    .order('name', { ascending: true });

                if (error) {
                    logAPIError(API_NAME, error, { step: 'Fetch Regions' });
                    return NextResponse.json({
                        success: false,
                        error: 'Failed to fetch regions',
                        regions: []
                    }, { status: 200 });
                }

                return NextResponse.json({
                    success: true,
                    regions: regions || []
                });
            } catch (regionError) {
                logAPIError(API_NAME, regionError, { step: 'Regions Query' });
                return NextResponse.json({
                    success: false,
                    error: 'Failed to fetch regions',
                    regions: []
                }, { status: 200 });
            }
        }

        // -----------------------------------------------------------------
        // TYPE: salespeople - Return ASMs only for manager filters
        // -----------------------------------------------------------------
        if (type === 'salespeople') {
            // Only managers can get the salespeople list
            if (!isManager(currentUser.role)) {
                return NextResponse.json({
                    success: true,
                    users: [] // Non-managers get empty list
                });
            }

            try {
                const { data: profiles, error } = await supabase
                    .from('profiles')
                    .select('user_id, full_name, email')
                    .eq('is_active', true)
                    .order('full_name');

                if (error) {
                    logAPIError(API_NAME, error, { step: 'Fetch Salespeople' });
                    return NextResponse.json({
                        success: false,
                        error: 'Failed to fetch salespeople',
                        users: []
                    }, { status: 200 });
                }

                // STRICT: Only return the 6 ASM region names
                const asmProfiles = getASMsForFilter(profiles);

                const users = asmProfiles.map(p => ({
                    id: p.user_id,
                    user_id: p.user_id,
                    full_name: p.full_name,
                    name: p.full_name,
                    email: p.email || ''
                }));

                return NextResponse.json({
                    success: true,
                    users
                });
            } catch (spError) {
                logAPIError(API_NAME, spError, { step: 'Salespeople Query' });
                return NextResponse.json({
                    success: false,
                    error: 'Failed to fetch salespeople',
                    users: []
                }, { status: 200 });
            }
        }

        // -----------------------------------------------------------------
        // DEFAULT: Return all active users
        // -----------------------------------------------------------------
        try {
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('user_id, full_name, role:roles(name)')
                .eq('is_active', true)
                .order('full_name');

            if (error) {
                logAPIError(API_NAME, error, { step: 'Fetch Users' });
                return NextResponse.json({
                    success: false,
                    error: 'Failed to fetch users',
                    users: []
                }, { status: 200 });
            }

            // Transform to standard format
            const users = (profiles || []).map(p => ({
                id: p.user_id,
                name: p.full_name,
                role: p.role?.name || 'unknown'
            }));

            return NextResponse.json({
                success: true,
                users
            });
        } catch (usersError) {
            logAPIError(API_NAME, usersError, { step: 'Users Query' });
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch users',
                users: []
            }, { status: 200 });
        }

    } catch (error) {
        logAPIError(API_NAME, error, { userId: currentUser?.id });

        return NextResponse.json({
            success: false,
            error: 'An unexpected error occurred',
            users: [],
            regions: []
        }, { status: 200 });
    }
}
