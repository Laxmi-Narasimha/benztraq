-- Migration: 037_sales_visits_and_performance.sql
-- Description: Create tables for ASM visit tracking and monthly performance snapshots.
-- Used by the Performance Projections Dashboard.

-- ============================================================================
-- 1. SALES VISITS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS sales_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT,
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    visit_type TEXT NOT NULL DEFAULT 'meeting'
        CHECK (visit_type IN ('meeting', 'cold_call', 'follow_up', 'demo', 'phone_call')),
    outcome TEXT NOT NULL DEFAULT 'no_outcome'
        CHECK (outcome IN ('quotation_sent', 'follow_up_needed', 'order_placed', 'no_outcome')),
    notes TEXT,
    duration_minutes INTEGER,
    quotation_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_sales_visits_user_id ON sales_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_visits_visit_date ON sales_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_sales_visits_user_date ON sales_visits(user_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_sales_visits_customer ON sales_visits(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_visits_type ON sales_visits(visit_type);
CREATE INDEX IF NOT EXISTS idx_sales_visits_outcome ON sales_visits(outcome);

-- ============================================================================
-- 2. ASM MONTHLY SNAPSHOTS TABLE (Materialized view pattern)
-- ============================================================================
CREATE TABLE IF NOT EXISTS asm_monthly_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    user_name TEXT,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year BETWEEN 2024 AND 2030),
    -- Activity metrics
    total_visits INTEGER DEFAULT 0,
    unique_customers_visited INTEGER DEFAULT 0,
    -- Pipeline metrics
    quotations_sent INTEGER DEFAULT 0,
    quotation_value DECIMAL(18,2) DEFAULT 0,
    sales_orders_won INTEGER DEFAULT 0,
    revenue DECIMAL(18,2) DEFAULT 0,
    -- Efficiency metrics
    visit_to_quote_rate DECIMAL(5,2) DEFAULT 0,
    quote_to_order_rate DECIMAL(5,2) DEFAULT 0,
    avg_deal_size DECIMAL(18,2) DEFAULT 0,
    avg_days_to_close DECIMAL(10,2) DEFAULT 0,
    -- Composite score
    activity_score DECIMAL(5,2) DEFAULT 0,
    -- Metadata
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_asm_snapshots_user ON asm_monthly_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_asm_snapshots_year ON asm_monthly_snapshots(year);
CREATE INDEX IF NOT EXISTS idx_asm_snapshots_user_year ON asm_monthly_snapshots(user_id, year);

-- ============================================================================
-- 3. RLS POLICIES
-- ============================================================================
ALTER TABLE sales_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE asm_monthly_snapshots ENABLE ROW LEVEL SECURITY;

-- Public access for service role
DROP POLICY IF EXISTS "public_read_sales_visits" ON sales_visits;
CREATE POLICY "public_read_sales_visits" ON sales_visits FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_write_sales_visits" ON sales_visits;
CREATE POLICY "public_write_sales_visits" ON sales_visits FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "public_update_sales_visits" ON sales_visits;
CREATE POLICY "public_update_sales_visits" ON sales_visits FOR UPDATE USING (true);
DROP POLICY IF EXISTS "public_delete_sales_visits" ON sales_visits;
CREATE POLICY "public_delete_sales_visits" ON sales_visits FOR DELETE USING (true);

DROP POLICY IF EXISTS "public_read_asm_snapshots" ON asm_monthly_snapshots;
CREATE POLICY "public_read_asm_snapshots" ON asm_monthly_snapshots FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_write_asm_snapshots" ON asm_monthly_snapshots;
CREATE POLICY "public_write_asm_snapshots" ON asm_monthly_snapshots FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "public_update_asm_snapshots" ON asm_monthly_snapshots;
CREATE POLICY "public_update_asm_snapshots" ON asm_monthly_snapshots FOR UPDATE USING (true);
DROP POLICY IF EXISTS "public_delete_asm_snapshots" ON asm_monthly_snapshots;
CREATE POLICY "public_delete_asm_snapshots" ON asm_monthly_snapshots FOR DELETE USING (true);

COMMENT ON TABLE sales_visits IS 'Tracks customer visits by ASMs. Used for activity metrics and visit-to-conversion analytics.';
COMMENT ON TABLE asm_monthly_snapshots IS 'Pre-computed monthly performance snapshots for fast dashboard loading.';
