-- Migration: 009_fix_status_cache.sql
-- Description: Fix "Could not find the 'status' column" error by ensuring column exists and forcing schema reload.

-- 1. Ensure status column exists (idempotent)
ALTER TABLE public.documents 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- 2. Force PostgREST schema cache reload
-- This is critical when columns are added but API doesn't see them
NOTIFY pgrst, 'reload schema';

-- Verification (Optional - just to generate output)
SELECT 'Schema reload triggered' as result;
