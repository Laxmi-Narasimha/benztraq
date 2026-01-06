-- Migration 019: Row-Level Security and Teams Structure
-- Implements RLS policies for data isolation by user/team/role

-- =============================================================================
-- SECTION 1: Add missing columns to support RLS
-- =============================================================================

-- Add created_by to customers if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'created_by') THEN
        ALTER TABLE customers ADD COLUMN created_by UUID;
    END IF;
END $$;

-- =============================================================================
-- SECTION 2: Teams Structure
-- =============================================================================
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    region_id UUID,
    manager_id UUID,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);

-- =============================================================================
-- SECTION 3: Helper Functions for RLS
-- =============================================================================

-- Get current user ID from auth context
CREATE OR REPLACE FUNCTION current_user_id() 
RETURNS UUID AS $$
BEGIN
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user has admin role
CREATE OR REPLACE FUNCTION is_admin_user(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles p
        JOIN roles r ON p.role_id = r.id
        WHERE p.user_id = check_user_id
        AND r.name IN ('developer', 'director', 'vp')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is head of sales
CREATE OR REPLACE FUNCTION is_head_of_sales(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles p
        JOIN roles r ON p.role_id = r.id
        WHERE p.user_id = check_user_id
        AND r.name IN ('head_of_sales', 'vp', 'director', 'developer')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get user's region ID
CREATE OR REPLACE FUNCTION get_user_region_id(check_user_id UUID)
RETURNS UUID AS $$
DECLARE
    result_region_id UUID;
BEGIN
    SELECT p.region_id INTO result_region_id
    FROM profiles p
    WHERE p.user_id = check_user_id;
    
    RETURN result_region_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =============================================================================
-- SECTION 4: Enable RLS on Tables
-- =============================================================================
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- SECTION 5: RLS Policies for Quotations
-- =============================================================================

DROP POLICY IF EXISTS quotations_own_select ON quotations;
CREATE POLICY quotations_own_select ON quotations
    FOR SELECT USING (
        created_by = current_user_id()
        OR assigned_to = current_user_id()
        OR is_admin_user(current_user_id())
        OR is_head_of_sales(current_user_id())
    );

DROP POLICY IF EXISTS quotations_insert ON quotations;
CREATE POLICY quotations_insert ON quotations
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS quotations_update ON quotations;
CREATE POLICY quotations_update ON quotations
    FOR UPDATE USING (
        created_by = current_user_id()
        OR assigned_to = current_user_id()
        OR is_admin_user(current_user_id())
    );

-- =============================================================================
-- SECTION 6: RLS Policies for Sales Orders
-- =============================================================================

DROP POLICY IF EXISTS sales_orders_select ON sales_orders;
CREATE POLICY sales_orders_select ON sales_orders
    FOR SELECT USING (
        created_by = current_user_id()
        OR is_admin_user(current_user_id())
        OR is_head_of_sales(current_user_id())
    );

DROP POLICY IF EXISTS sales_orders_insert ON sales_orders;
CREATE POLICY sales_orders_insert ON sales_orders
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS sales_orders_update ON sales_orders;
CREATE POLICY sales_orders_update ON sales_orders
    FOR UPDATE USING (
        created_by = current_user_id()
        OR is_admin_user(current_user_id())
    );

-- =============================================================================
-- SECTION 7: RLS Policies for Invoices
-- =============================================================================

DROP POLICY IF EXISTS invoices_select ON invoices;
CREATE POLICY invoices_select ON invoices
    FOR SELECT USING (
        created_by = current_user_id()
        OR is_admin_user(current_user_id())
        OR is_head_of_sales(current_user_id())
    );

DROP POLICY IF EXISTS invoices_insert ON invoices;
CREATE POLICY invoices_insert ON invoices
    FOR INSERT WITH CHECK (true);

-- =============================================================================
-- SECTION 8: RLS Policies for Customers (simplified)
-- =============================================================================

DROP POLICY IF EXISTS customers_select ON customers;
CREATE POLICY customers_select ON customers
    FOR SELECT USING (true);  -- All can view customers

DROP POLICY IF EXISTS customers_insert ON customers;
CREATE POLICY customers_insert ON customers
    FOR INSERT WITH CHECK (
        is_head_of_sales(current_user_id())
        OR is_admin_user(current_user_id())
    );

DROP POLICY IF EXISTS customers_update ON customers;
CREATE POLICY customers_update ON customers
    FOR UPDATE USING (
        is_admin_user(current_user_id())
        OR is_head_of_sales(current_user_id())
    );

-- =============================================================================
-- SECTION 9: RLS Policies for Products (simplified)
-- =============================================================================

DROP POLICY IF EXISTS products_select ON products;
CREATE POLICY products_select ON products
    FOR SELECT USING (true);  -- All can view products

DROP POLICY IF EXISTS products_insert ON products;
CREATE POLICY products_insert ON products
    FOR INSERT WITH CHECK (
        is_admin_user(current_user_id())
        OR is_head_of_sales(current_user_id())
    );

DROP POLICY IF EXISTS products_update ON products;
CREATE POLICY products_update ON products
    FOR UPDATE USING (
        is_admin_user(current_user_id())
        OR is_head_of_sales(current_user_id())
    );

-- =============================================================================
-- SECTION 10: Seed Teams Data
-- =============================================================================
INSERT INTO teams (name, description) 
SELECT 'All Teams', 'Default team for all users'
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE name = 'All Teams');

-- Create regional teams
INSERT INTO teams (name, region_id, description)
SELECT 
    r.name || ' Team',
    r.id,
    'Sales team for ' || r.name || ' region'
FROM regions r
WHERE NOT EXISTS (
    SELECT 1 FROM teams t WHERE t.region_id = r.id
);

-- =============================================================================
-- DONE!
-- =============================================================================
