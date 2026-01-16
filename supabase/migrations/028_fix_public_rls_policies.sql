-- =====================================================
-- MIGRATION 028: Fix Public RLS Policies (Security Fix)
-- =====================================================
-- This migration replaces the overly permissive USING (true) policies
-- with proper authenticated-user-based policies.
--
-- PROBLEM: Previous migration created policies that allow anonymous access
-- to sensitive CRM data (leads, stages, teams, etc.)
--
-- SOLUTION: Since the app uses service-role key in API routes (which bypasses RLS),
-- the RLS policies should be restrictive to prevent direct client access
-- while still allowing authenticated users basic read access.
-- =====================================================

-- =====================================================
-- DROP ALL PUBLIC POLICIES ON LEADS
-- =====================================================

DROP POLICY IF EXISTS "public_read_leads" ON leads;
DROP POLICY IF EXISTS "public_write_leads" ON leads;
DROP POLICY IF EXISTS "public_update_leads" ON leads;
DROP POLICY IF EXISTS "public_delete_leads" ON leads;

-- Create authenticated-only policies for leads
-- Users can only see their own leads OR all leads if they're admins
-- Note: Since we use service-role in API routes, these are backup protection

CREATE POLICY "authenticated_read_leads" ON leads 
    FOR SELECT 
    TO authenticated
    USING (
        -- Users can see their own leads
        user_id = auth.uid()
        OR
        -- Or leads where they are the partner contact
        partner_id IN (SELECT id FROM customers WHERE account_manager_id = auth.uid())
        OR
        -- Admins bypass this check (but service-role already bypasses RLS)
        EXISTS (
            SELECT 1 FROM profiles p 
            JOIN roles r ON p.role_id = r.id 
            WHERE p.user_id = auth.uid() 
            AND r.name IN ('developer', 'director', 'vp', 'head_of_sales')
        )
    );

CREATE POLICY "authenticated_insert_leads" ON leads 
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);  -- Any authenticated user can create leads

CREATE POLICY "authenticated_update_leads" ON leads 
    FOR UPDATE 
    TO authenticated
    USING (
        user_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM profiles p 
            JOIN roles r ON p.role_id = r.id 
            WHERE p.user_id = auth.uid() 
            AND r.name IN ('developer', 'director', 'vp', 'head_of_sales')
        )
    );

CREATE POLICY "authenticated_delete_leads" ON leads 
    FOR DELETE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            JOIN roles r ON p.role_id = r.id 
            WHERE p.user_id = auth.uid() 
            AND r.name IN ('developer', 'director', 'vp')
        )
    );

-- =====================================================
-- FIX CRM STAGES POLICIES (if too permissive)
-- =====================================================

-- Stages should be readable by all authenticated users
-- but only writable by managers/admins

DROP POLICY IF EXISTS "public_read_crm_stages" ON crm_stages;
DROP POLICY IF EXISTS "public_write_crm_stages" ON crm_stages;

CREATE POLICY "authenticated_read_crm_stages" ON crm_stages
    FOR SELECT
    TO authenticated
    USING (true);  -- All authenticated users can read stages

CREATE POLICY "manager_write_crm_stages" ON crm_stages
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p 
            JOIN roles r ON p.role_id = r.id 
            WHERE p.user_id = auth.uid() 
            AND r.name IN ('developer', 'director', 'vp', 'head_of_sales', 'manager')
        )
    );

CREATE POLICY "manager_update_crm_stages" ON crm_stages
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            JOIN roles r ON p.role_id = r.id 
            WHERE p.user_id = auth.uid() 
            AND r.name IN ('developer', 'director', 'vp', 'head_of_sales', 'manager')
        )
    );

-- =====================================================
-- FIX SALES TEAMS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "public_read_sales_teams" ON sales_teams;
DROP POLICY IF EXISTS "public_write_sales_teams" ON sales_teams;

CREATE POLICY "authenticated_read_sales_teams" ON sales_teams
    FOR SELECT
    TO authenticated
    USING (true);  -- All authenticated users can read teams

CREATE POLICY "manager_write_sales_teams" ON sales_teams
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p 
            JOIN roles r ON p.role_id = r.id 
            WHERE p.user_id = auth.uid() 
            AND r.name IN ('developer', 'director', 'vp', 'head_of_sales')
        )
    );

-- =====================================================
-- FIX LOST REASONS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "public_read_lost_reasons" ON lost_reasons;

CREATE POLICY "authenticated_read_lost_reasons" ON lost_reasons
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "manager_write_lost_reasons" ON lost_reasons
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p 
            JOIN roles r ON p.role_id = r.id 
            WHERE p.user_id = auth.uid() 
            AND r.name IN ('developer', 'director', 'vp', 'head_of_sales', 'manager')
        )
    );

-- =====================================================
-- FIX UTM TABLES POLICIES
-- =====================================================

-- UTM Campaigns
DROP POLICY IF EXISTS "public_read_utm_campaigns" ON utm_campaigns;

CREATE POLICY "authenticated_read_utm_campaigns" ON utm_campaigns
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "manager_write_utm_campaigns" ON utm_campaigns
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p 
            JOIN roles r ON p.role_id = r.id 
            WHERE p.user_id = auth.uid() 
            AND r.name IN ('developer', 'director', 'vp', 'head_of_sales', 'manager')
        )
    );

-- UTM Sources
DROP POLICY IF EXISTS "public_read_utm_sources" ON utm_sources;

CREATE POLICY "authenticated_read_utm_sources" ON utm_sources
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "manager_write_utm_sources" ON utm_sources
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p 
            JOIN roles r ON p.role_id = r.id 
            WHERE p.user_id = auth.uid() 
            AND r.name IN ('developer', 'director', 'vp', 'head_of_sales', 'manager')
        )
    );

-- UTM Mediums
DROP POLICY IF EXISTS "public_read_utm_mediums" ON utm_mediums;

CREATE POLICY "authenticated_read_utm_mediums" ON utm_mediums
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "manager_write_utm_mediums" ON utm_mediums
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p 
            JOIN roles r ON p.role_id = r.id 
            WHERE p.user_id = auth.uid() 
            AND r.name IN ('developer', 'director', 'vp', 'head_of_sales', 'manager')
        )
    );

-- =====================================================
-- LOOKUP TABLES: Keep read-only for authenticated
-- These are reference data that everyone can read
-- =====================================================

-- Partner industries - already has read policy, just ensure it's authenticated-only
DROP POLICY IF EXISTS "public_read_partner_industries" ON partner_industries;
CREATE POLICY "authenticated_read_partner_industries" ON partner_industries
    FOR SELECT TO authenticated USING (true);

-- Partner categories
DROP POLICY IF EXISTS "public_read_partner_categories" ON partner_categories;
CREATE POLICY "authenticated_read_partner_categories" ON partner_categories
    FOR SELECT TO authenticated USING (true);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Summary of changes:
-- 1. Removed all "public" policies that used USING (true) for writes
-- 2. All read policies now require 'authenticated' role
-- 3. Write policies require manager/admin roles
-- 4. Leads have ownership-based access control
-- =====================================================
