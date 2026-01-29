-- ============================================================================
-- BENZTRAQ TARGETS SYSTEM CLEANUP
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: View current state (for verification)
SELECT 'BEFORE CLEANUP - Targets' as step;
SELECT t.id, t.year, t.annual_target, p.full_name, p.email, p.role 
FROM annual_targets t 
LEFT JOIN profiles p ON t.salesperson_user_id = p.user_id
WHERE t.year = 2026
ORDER BY p.full_name;

-- Step 2: Define valid ASM names
-- The ONLY valid ASM regions are:
-- Karnataka, Madhya Pradesh, Maharashtra, Noida, Rajasthan, West Zone

-- Step 3: Delete targets for NON-ASM users (Directors, Developers, Isha, etc.)
DELETE FROM annual_targets 
WHERE salesperson_user_id IN (
  SELECT user_id FROM profiles 
  WHERE full_name NOT IN ('Karnataka', 'Madhya Pradesh', 'Maharashtra', 'Noida', 'Rajasthan', 'West Zone')
);

-- Step 4: Delete targets for profiles without emails (duplicates)
DELETE FROM annual_targets 
WHERE salesperson_user_id IN (
  SELECT user_id FROM profiles 
  WHERE (email IS NULL OR email = '')
  AND full_name IN ('Karnataka', 'Madhya Pradesh', 'Maharashtra', 'Noida', 'Rajasthan', 'West Zone')
);

-- Step 5: Mark duplicate ASM profiles (without email) as inactive
UPDATE profiles 
SET is_active = false, role = 'inactive'
WHERE (email IS NULL OR email = '')
AND full_name IN ('Karnataka', 'Madhya Pradesh', 'Maharashtra', 'Noida', 'Rajasthan', 'West Zone');

-- Step 6: Ensure Isha is marked as Ergopack only (not visible in Benz Packaging targets)
-- We'll use a tag or role to differentiate
UPDATE profiles
SET asm = 'ergopack_only'
WHERE email = 'isha@benz-packaging.com' OR full_name ILIKE '%isha%';

-- Step 7: Ensure valid ASM profiles have role = 'asm'
UPDATE profiles
SET role = 'asm'
WHERE full_name IN ('Karnataka', 'Madhya Pradesh', 'Maharashtra', 'Noida', 'Rajasthan', 'West Zone')
AND email IS NOT NULL AND email != ''
AND is_active = true;

-- Step 8: Add target tracking columns if they don't exist
ALTER TABLE annual_targets 
ADD COLUMN IF NOT EXISTS set_by_user_id UUID,
ADD COLUMN IF NOT EXISTS set_by_name TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Step 9: Create target_logs table for activity tracking
CREATE TABLE IF NOT EXISTS target_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id UUID REFERENCES annual_targets(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted'
  salesperson_user_id UUID,
  salesperson_name TEXT,
  year INTEGER,
  old_value NUMERIC,
  new_value NUMERIC,
  changed_by_user_id UUID,
  changed_by_name TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Step 10: Create index for faster log queries
CREATE INDEX IF NOT EXISTS idx_target_logs_salesperson ON target_logs(salesperson_user_id);
CREATE INDEX IF NOT EXISTS idx_target_logs_changed_by ON target_logs(changed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_target_logs_changed_at ON target_logs(changed_at DESC);

-- Step 11: Verify cleanup
SELECT 'AFTER CLEANUP - Targets' as step;
SELECT t.id, t.year, t.annual_target, p.full_name, p.email, p.role 
FROM annual_targets t 
LEFT JOIN profiles p ON t.salesperson_user_id = p.user_id
WHERE t.year = 2026
ORDER BY p.full_name;

-- Step 12: Verify valid ASM profiles
SELECT 'VALID ASM PROFILES' as step;
SELECT user_id, full_name, email, role, is_active
FROM profiles
WHERE full_name IN ('Karnataka', 'Madhya Pradesh', 'Maharashtra', 'Noida', 'Rajasthan', 'West Zone')
AND is_active = true
ORDER BY full_name;
