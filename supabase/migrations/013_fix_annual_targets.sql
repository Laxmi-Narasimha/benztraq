-- Migration: Fix annual_targets table to use profiles instead of auth.users
-- Run this in Supabase SQL Editor

-- Step 1: Drop the existing constraints if they exist
ALTER TABLE annual_targets DROP CONSTRAINT IF EXISTS annual_targets_salesperson_user_id_fkey;
ALTER TABLE annual_targets DROP CONSTRAINT IF EXISTS annual_targets_created_by_fkey;

-- Step 2: Add new constraints referencing profiles
-- Note: Using profiles(user_id) instead of auth.users(id)
ALTER TABLE annual_targets 
ADD CONSTRAINT annual_targets_salesperson_fkey 
FOREIGN KEY (salesperson_user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE annual_targets 
ADD CONSTRAINT annual_targets_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES profiles(user_id) ON DELETE SET NULL;

-- Step 3: Create the table if it doesn't exist (safe to run)
CREATE TABLE IF NOT EXISTS annual_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salesperson_user_id UUID NOT NULL,
    year INTEGER NOT NULL,
    annual_target NUMERIC(15, 2) NOT NULL,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(salesperson_user_id, year)
);

-- Step 4: Create index if not exists
CREATE INDEX IF NOT EXISTS idx_annual_targets_salesperson ON annual_targets(salesperson_user_id, year);
CREATE INDEX IF NOT EXISTS idx_annual_targets_year ON annual_targets(year);

-- Step 5: Verify
SELECT 'annual_targets table ready' as status;
