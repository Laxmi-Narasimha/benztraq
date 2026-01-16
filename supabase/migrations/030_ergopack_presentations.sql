-- Migration: 030_ergopack_presentations.sql
-- Description: Add company presentation file support to ergopack_contacts
-- Features: File storage path, upload tracking, and cleanup

-- ============================================================================
-- Add presentation file fields to ergopack_contacts
-- ============================================================================
ALTER TABLE public.ergopack_contacts
  ADD COLUMN IF NOT EXISTS presentation_file_path TEXT,
  ADD COLUMN IF NOT EXISTS presentation_file_name TEXT,
  ADD COLUMN IF NOT EXISTS presentation_uploaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS presentation_uploaded_by UUID REFERENCES public.profiles(user_id);

-- Add comment for documentation
COMMENT ON COLUMN public.ergopack_contacts.presentation_file_path IS 'Storage path for company presentation PDF';
COMMENT ON COLUMN public.ergopack_contacts.presentation_file_name IS 'Original filename of uploaded presentation';
COMMENT ON COLUMN public.ergopack_contacts.presentation_uploaded_at IS 'When the presentation was uploaded';
COMMENT ON COLUMN public.ergopack_contacts.presentation_uploaded_by IS 'Who uploaded the presentation';

-- ============================================================================
-- Add quotation file fields to ergopack_contacts
-- ============================================================================
ALTER TABLE public.ergopack_contacts
  ADD COLUMN IF NOT EXISTS quotation_file_path TEXT,
  ADD COLUMN IF NOT EXISTS quotation_file_name TEXT,
  ADD COLUMN IF NOT EXISTS quotation_uploaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS quotation_uploaded_by UUID REFERENCES public.profiles(user_id);

-- Add comment for documentation
COMMENT ON COLUMN public.ergopack_contacts.quotation_file_path IS 'Storage path for saved quotation PDF';
COMMENT ON COLUMN public.ergopack_contacts.quotation_file_name IS 'Filename of saved quotation';
COMMENT ON COLUMN public.ergopack_contacts.quotation_uploaded_at IS 'When the quotation was saved';
COMMENT ON COLUMN public.ergopack_contacts.quotation_uploaded_by IS 'Who saved the quotation';

-- ============================================================================
-- Create storage buckets (run manually in Supabase dashboard)
-- ============================================================================
-- Note: Supabase storage buckets should be created via the dashboard or
-- using the storage-js client. 
-- 
-- Bucket 1: ergopack-presentations
-- Bucket 2: ergopack-quotations
-- 
-- Bucket settings:
-- - Public: false (authenticated access only)
-- - Allowed MIME types: application/pdf
-- - Max file size: 10MB
