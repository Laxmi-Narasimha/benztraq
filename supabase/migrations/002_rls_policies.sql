-- Migration: 002_rls_policies.sql
-- Description: Row Level Security policies for all tables
-- Implements role-based access control:
--   - VP and Director: Full access to all data
--   - ASM: Access only to their own data

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_sales_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE annual_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Managers can view all profiles
CREATE POLICY "Managers can view all profiles"
  ON profiles FOR SELECT
  USING (is_manager());

-- Users can update their own profile (limited fields - handled at app level)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Managers can update any profile
CREATE POLICY "Managers can update any profile"
  ON profiles FOR UPDATE
  USING (is_manager());

-- Only managers can insert profiles (via admin actions)
CREATE POLICY "Managers can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (is_manager());

-- ============================================================================
-- REGIONS POLICIES
-- All users can view regions (reference data)
-- Only managers can modify regions
-- ============================================================================

CREATE POLICY "Anyone can view regions"
  ON regions FOR SELECT
  USING (true);

CREATE POLICY "Managers can manage regions"
  ON regions FOR ALL
  USING (is_manager())
  WITH CHECK (is_manager());

-- ============================================================================
-- CUSTOMERS POLICIES
-- ============================================================================

-- All authenticated users can view customers
CREATE POLICY "Authenticated users can view customers"
  ON customers FOR SELECT
  USING (auth.role() = 'authenticated');

-- All authenticated users can insert customers (log creation at app level)
CREATE POLICY "Authenticated users can create customers"
  ON customers FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Managers can update/delete customers
CREATE POLICY "Managers can update customers"
  ON customers FOR UPDATE
  USING (is_manager());

CREATE POLICY "Managers can delete customers"
  ON customers FOR DELETE
  USING (is_manager());

-- ============================================================================
-- PRODUCTS POLICIES
-- ============================================================================

-- All authenticated users can view products (for autocomplete)
CREATE POLICY "Authenticated users can view products"
  ON products FOR SELECT
  USING (auth.role() = 'authenticated');

-- All authenticated users can create products (for new product entries)
CREATE POLICY "Authenticated users can create products"
  ON products FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Managers can update/delete products
CREATE POLICY "Managers can update products"
  ON products FOR UPDATE
  USING (is_manager());

CREATE POLICY "Managers can delete products"
  ON products FOR DELETE
  USING (is_manager());

-- ============================================================================
-- DOCUMENTS POLICIES
-- Core access control for sales data
-- ============================================================================

-- Managers can view all documents
CREATE POLICY "Managers can view all documents"
  ON documents FOR SELECT
  USING (is_manager());

-- ASM can view only their own documents
CREATE POLICY "ASM can view own documents"
  ON documents FOR SELECT
  USING (
    NOT is_manager() 
    AND salesperson_user_id = auth.uid()
  );

-- Managers can insert documents for any salesperson
CREATE POLICY "Managers can insert any document"
  ON documents FOR INSERT
  WITH CHECK (is_manager());

-- ASM can insert documents only as their own
CREATE POLICY "ASM can insert own documents"
  ON documents FOR INSERT
  WITH CHECK (
    NOT is_manager() 
    AND salesperson_user_id = auth.uid()
  );

-- Managers can update any document
CREATE POLICY "Managers can update any document"
  ON documents FOR UPDATE
  USING (is_manager());

-- ASM can update only their own documents
CREATE POLICY "ASM can update own documents"
  ON documents FOR UPDATE
  USING (
    NOT is_manager() 
    AND salesperson_user_id = auth.uid()
  );

-- Managers can delete any document
CREATE POLICY "Managers can delete any document"
  ON documents FOR DELETE
  USING (is_manager());

-- ASM can delete only their own documents
CREATE POLICY "ASM can delete own documents"
  ON documents FOR DELETE
  USING (
    NOT is_manager() 
    AND salesperson_user_id = auth.uid()
  );

-- ============================================================================
-- DOCUMENT_LINES POLICIES
-- Lines inherit access from parent document
-- ============================================================================

-- View lines for documents user can access
CREATE POLICY "View lines for accessible documents"
  ON document_lines FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_lines.document_id
      AND (
        is_manager()
        OR documents.salesperson_user_id = auth.uid()
      )
    )
  );

-- Insert lines for documents user can access
CREATE POLICY "Insert lines for accessible documents"
  ON document_lines FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_lines.document_id
      AND (
        is_manager()
        OR documents.salesperson_user_id = auth.uid()
      )
    )
  );

-- Update lines for documents user can access
CREATE POLICY "Update lines for accessible documents"
  ON document_lines FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_lines.document_id
      AND (
        is_manager()
        OR documents.salesperson_user_id = auth.uid()
      )
    )
  );

-- Delete lines for documents user can access
CREATE POLICY "Delete lines for accessible documents"
  ON document_lines FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_lines.document_id
      AND (
        is_manager()
        OR documents.salesperson_user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- DOCUMENT_FILES POLICIES
-- ============================================================================

-- Managers can view all files
CREATE POLICY "Managers can view all files"
  ON document_files FOR SELECT
  USING (is_manager());

-- ASM can view files they uploaded
CREATE POLICY "ASM can view own files"
  ON document_files FOR SELECT
  USING (
    NOT is_manager()
    AND uploaded_by = auth.uid()
  );

-- Users can insert their own files
CREATE POLICY "Users can insert own files"
  ON document_files FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

-- Users can update their own files
CREATE POLICY "Users can update own files"
  ON document_files FOR UPDATE
  USING (uploaded_by = auth.uid() OR is_manager());

-- ============================================================================
-- EXTRACTION_RUNS POLICIES
-- ============================================================================

-- Access based on parent document file access
CREATE POLICY "View extraction runs for accessible files"
  ON extraction_runs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM document_files
      WHERE document_files.id = extraction_runs.document_file_id
      AND (
        is_manager()
        OR document_files.uploaded_by = auth.uid()
      )
    )
  );

-- Insert for accessible files
CREATE POLICY "Insert extraction runs for accessible files"
  ON extraction_runs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM document_files
      WHERE document_files.id = extraction_runs.document_file_id
      AND (
        is_manager()
        OR document_files.uploaded_by = auth.uid()
      )
    )
  );

-- ============================================================================
-- QUOTE_SALES_LINKS POLICIES
-- ============================================================================

-- Managers can view all links
CREATE POLICY "Managers can view all links"
  ON quote_sales_links FOR SELECT
  USING (is_manager());

-- ASM can view links for their documents
CREATE POLICY "ASM can view own links"
  ON quote_sales_links FOR SELECT
  USING (
    NOT is_manager()
    AND (
      EXISTS (
        SELECT 1 FROM documents
        WHERE documents.id = quote_sales_links.quote_document_id
        AND documents.salesperson_user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM documents
        WHERE documents.id = quote_sales_links.sales_order_document_id
        AND documents.salesperson_user_id = auth.uid()
      )
    )
  );

-- Authenticated users can insert links
CREATE POLICY "Authenticated users can insert links"
  ON quote_sales_links FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- ANNUAL_TARGETS POLICIES
-- ============================================================================

-- Managers can view all targets
CREATE POLICY "Managers can view all targets"
  ON annual_targets FOR SELECT
  USING (is_manager());

-- ASM can view their own targets
CREATE POLICY "ASM can view own targets"
  ON annual_targets FOR SELECT
  USING (
    NOT is_manager()
    AND salesperson_user_id = auth.uid()
  );

-- Only managers can insert/update/delete targets
CREATE POLICY "Managers can manage targets"
  ON annual_targets FOR ALL
  USING (is_manager())
  WITH CHECK (is_manager());

-- ============================================================================
-- AI_REPORTS POLICIES
-- ============================================================================

-- Managers can view all reports
CREATE POLICY "Managers can view all reports"
  ON ai_reports FOR SELECT
  USING (is_manager());

-- ASM can view reports about themselves
CREATE POLICY "ASM can view own reports"
  ON ai_reports FOR SELECT
  USING (
    NOT is_manager()
    AND subject_type = 'salesperson'
    AND subject_id = auth.uid()
  );

-- Authenticated users can insert reports
CREATE POLICY "Authenticated users can insert reports"
  ON ai_reports FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- STORAGE POLICIES (for documents bucket)
-- Run these in Supabase Dashboard > Storage > Policies
-- ============================================================================

-- Note: Storage policies need to be configured in Supabase Dashboard
-- The following are the recommended policies:

-- 1. Allow authenticated users to upload files to documents bucket
-- Policy: authenticated users can upload
-- Target: INSERT
-- Check: auth.role() = 'authenticated'

-- 2. Allow users to view their own files or managers to view all
-- Policy: authenticated users can view
-- Target: SELECT
-- Check: (storage.foldername(name))[1] = auth.uid()::text OR is_manager()

-- 3. Allow users to delete their own files or managers to delete all
-- Policy: authenticated users can delete
-- Target: DELETE
-- Check: (storage.foldername(name))[1] = auth.uid()::text OR is_manager()
