-- =====================================================
-- MIGRATION 029: Schema Standardization
-- =====================================================
-- Fixes schema conflicts and standardizes column names
-- across older and newer migrations
-- =====================================================

-- =====================================================
-- 1. SALES_TEAMS: Standardize is_active → active
-- =====================================================
-- Old migration (003) used: is_active
-- New migration (027) used: active
-- Standardize to 'active' for consistency with Odoo pattern

-- Add 'active' column if it doesn't exist
ALTER TABLE sales_teams ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

-- Copy data from is_active to active if is_active exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales_teams' AND column_name = 'is_active'
    ) THEN
        UPDATE sales_teams SET active = is_active WHERE active IS NULL;
    END IF;
END $$;

-- Add sequence column if missing
ALTER TABLE sales_teams ADD COLUMN IF NOT EXISTS sequence INTEGER DEFAULT 10;

-- =====================================================
-- 2. DOCUMENTS: Standardize status → state
-- =====================================================
-- Old migration (001) used: status, grand_total, salesperson_user_id
-- New migration (027) used: state, amount_total, salesperson_id
-- Keep both for backward compatibility, create aliases via views

-- Add new columns if they don't exist
ALTER TABLE documents ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'draft';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS amount_total DECIMAL(18,2);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS salesperson_id UUID;

-- Sync data from old to new columns
UPDATE documents 
SET 
    state = COALESCE(state, status),
    amount_total = COALESCE(amount_total, grand_total),
    salesperson_id = COALESCE(salesperson_id, salesperson_user_id)
WHERE state IS NULL OR amount_total IS NULL OR salesperson_id IS NULL;

-- =====================================================
-- 3. CRM_STAGES: Ensure 'active' column exists
-- =====================================================
ALTER TABLE crm_stages ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

-- =====================================================
-- 4. PROFILES: Add sales_team_id for team membership
-- =====================================================
-- This allows the sales-team-service.js to query team members

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sales_team_id UUID REFERENCES sales_teams(id);

-- =====================================================
-- 5. Create helper function for role checking
-- =====================================================
-- Standardized role checking across the app

CREATE OR REPLACE FUNCTION is_admin_role(role_name TEXT) 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN role_name IN ('developer', 'director', 'vp', 'head_of_sales');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION is_manager_role(role_name TEXT) 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN role_name IN ('developer', 'director', 'vp', 'head_of_sales', 'manager');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 6. Standardize LEADS table columns
-- =====================================================
-- Ensure all required columns exist

ALTER TABLE leads ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'lead';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS probability DECIMAL(5,2) DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS expected_revenue DECIMAL(18,2) DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS date_closed TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS date_open TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS team_id UUID;

-- =====================================================
-- 7. Create index for common queries
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_sales_team_id ON profiles(sales_team_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_team_id ON leads(team_id);
CREATE INDEX IF NOT EXISTS idx_documents_salesperson_id ON documents(salesperson_id);
CREATE INDEX IF NOT EXISTS idx_documents_state ON documents(state);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Summary:
-- 1. Standardized sales_teams.active column
-- 2. Added document state/amount_total/salesperson_id columns
-- 3. Added profiles.sales_team_id for team membership
-- 4. Created helper functions for role checking
-- 5. Added indexes for performance
-- =====================================================
