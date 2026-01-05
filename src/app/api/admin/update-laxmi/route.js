/**
 * Update Laxmi Profile API Route
 * Updates the Laxmi profile name and ensures full developer access
 * 
 * POST /api/admin/update-laxmi
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request) {
    try {
        const supabase = createAdminClient();

        // Update Laxmi's profile name from "Laxmi (Developer)" to "Laxmi"
        const { data, error } = await supabase
            .from('profiles')
            .update({
                full_name: 'Laxmi',
                is_active: true,
                companies: ['benz', 'ergopack']  // Full access to both companies
            })
            .eq('email', 'laxmi@benz-packaging.com')
            .select('user_id, email, full_name, role, companies')
            .single();

        if (error) {
            return NextResponse.json({
                success: false,
                error: error.message
            }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            message: 'Updated Laxmi profile successfully',
            profile: data
        });

    } catch (error) {
        console.error('Update Laxmi error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
