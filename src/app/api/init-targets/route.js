/**
 * Initialize Targets Table
 * 
 * Creates the annual_targets table if it doesn't exist.
 * Call this endpoint once to set up the table in production.
 * 
 * GET /api/init-targets
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CREATE_TABLE_SQL = `
-- Create annual_targets table if it doesn't exist
CREATE TABLE IF NOT EXISTS annual_targets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    salesperson_user_id UUID NOT NULL,
    year INTEGER NOT NULL,
    annual_target NUMERIC(15,2) NOT NULL DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT annual_targets_unique UNIQUE (salesperson_user_id, year)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_annual_targets_salesperson 
    ON annual_targets(salesperson_user_id, year);
CREATE INDEX IF NOT EXISTS idx_annual_targets_year 
    ON annual_targets(year);

-- Enable RLS but allow all operations for now
ALTER TABLE annual_targets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "allow_all_for_now" ON annual_targets;

-- Create permissive policy
CREATE POLICY "allow_all_for_now" ON annual_targets
    FOR ALL USING (true) WITH CHECK (true);
`;

export async function GET(request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json({
                success: false,
                error: 'Missing Supabase credentials',
                hasUrl: !!supabaseUrl,
                hasKey: !!supabaseServiceKey
            }, { status: 500 });
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // Try to execute the SQL
        const { data, error } = await supabaseAdmin.rpc('exec_sql', {
            sql: CREATE_TABLE_SQL
        });

        if (error) {
            // RPC might not exist, try alternative approach
            console.log('[Init Targets] RPC failed, trying direct table check:', error.message);

            // Just try to query the table to check if it exists
            const { data: tableCheck, error: tableError } = await supabaseAdmin
                .from('annual_targets')
                .select('id')
                .limit(1);

            if (tableError) {
                return NextResponse.json({
                    success: false,
                    error: 'Table does not exist and cannot be created via API',
                    details: tableError.message,
                    code: tableError.code,
                    solution: 'Please run the following SQL in your Supabase SQL Editor:',
                    sql: CREATE_TABLE_SQL
                }, { status: 200 });
            }

            return NextResponse.json({
                success: true,
                message: 'Table already exists!',
                existing_records: tableCheck?.length || 0
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Table created or already exists',
            data
        });

    } catch (error) {
        console.error('[Init Targets] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            solution: 'Please run the SQL manually in Supabase SQL Editor',
            sql: CREATE_TABLE_SQL
        }, { status: 200 });
    }
}
