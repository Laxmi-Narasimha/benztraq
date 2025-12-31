-- Migration: 001_initial_schema.sql
-- Description: Complete database schema for Sales Performance Tracker
-- Tables: profiles, regions, customers, products, documents, document_lines,
--         document_files, extraction_runs, quote_sales_links, annual_targets, ai_reports

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- User roles
CREATE TYPE user_role AS ENUM ('vp', 'director', 'asm');

-- Document types
CREATE TYPE doc_type AS ENUM ('quotation', 'sales_order', 'invoice');

-- Quotation status
CREATE TYPE quotation_status AS ENUM ('draft', 'sent', 'won', 'lost');

-- Sales order status
CREATE TYPE sales_order_status AS ENUM ('open', 'confirmed', 'cancelled');

-- Invoice status
CREATE TYPE invoice_status AS ENUM ('recorded');

-- Extraction status
CREATE TYPE extraction_status AS ENUM ('queued', 'processing', 'needs_review', 'confirmed', 'failed');

-- Link method for quote-sales order connection
CREATE TYPE link_method AS ENUM ('manual', 'auto');

-- Report types
CREATE TYPE report_type AS ENUM ('weekly', 'monthly', 'salesperson_summary', 'customer_summary', 'executive_digest');

-- Report subject types
CREATE TYPE report_subject_type AS ENUM ('team', 'salesperson', 'customer', 'region', 'product');

-- Product categories
CREATE TYPE product_category AS ENUM ('pvc', 'wooden', 'hardware', 'other');

-- ============================================================================
-- TABLE: profiles
-- User profiles extending Supabase Auth
-- ============================================================================
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'asm',
  region_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- TABLE: regions
-- Pre-seeded regions for the application
-- ============================================================================
CREATE TABLE regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key to profiles after regions table exists
ALTER TABLE profiles
  ADD CONSTRAINT fk_profiles_region
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL;

-- ============================================================================
-- TABLE: customers
-- Customer master data
-- ============================================================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  region_id UUID REFERENCES regions(id) ON DELETE SET NULL,
  email TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Index for searching customers
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_region ON customers(region_id);

-- ============================================================================
-- TABLE: products
-- Product master data with autocomplete support
-- ============================================================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  default_uom TEXT,
  category product_category,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Index for product autocomplete (prefix search)
CREATE INDEX idx_products_name ON products(name text_pattern_ops);
CREATE INDEX idx_products_category ON products(category);

-- ============================================================================
-- TABLE: documents
-- Document headers for quotations, sales orders, invoices
-- ============================================================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doc_type doc_type NOT NULL,
  doc_number TEXT,
  doc_date DATE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  region_id UUID NOT NULL REFERENCES regions(id) ON DELETE RESTRICT,
  salesperson_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status TEXT NOT NULL,
  is_partial BOOLEAN NOT NULL DEFAULT false,
  partial_group_ref TEXT,
  remarks TEXT,
  subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
  discount_total NUMERIC(15, 2) DEFAULT 0,
  tax_total NUMERIC(15, 2) DEFAULT 0,
  freight_packing_total NUMERIC(15, 2) DEFAULT 0,
  grand_total NUMERIC(15, 2) NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Performance indexes
CREATE INDEX idx_documents_doc_type_date ON documents(doc_type, doc_date);
CREATE INDEX idx_documents_salesperson_date ON documents(salesperson_user_id, doc_date);
CREATE INDEX idx_documents_customer_date ON documents(customer_id, doc_date);
CREATE INDEX idx_documents_region ON documents(region_id);
CREATE INDEX idx_documents_status ON documents(status);

-- ============================================================================
-- TABLE: document_lines
-- Line items for documents
-- ============================================================================
CREATE TABLE document_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name_raw TEXT NOT NULL,
  description TEXT,
  qty NUMERIC(15, 4) NOT NULL,
  uom TEXT NOT NULL,
  base_unit_price NUMERIC(15, 2),
  unit_price NUMERIC(15, 2) NOT NULL,
  discount_amount NUMERIC(15, 2) DEFAULT 0,
  tax_amount NUMERIC(15, 2) DEFAULT 0,
  freight_packing_amount NUMERIC(15, 2) DEFAULT 0,
  line_total NUMERIC(15, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_document_lines_document ON document_lines(document_id);
CREATE INDEX idx_document_lines_product ON document_lines(product_id);

-- ============================================================================
-- TABLE: document_files
-- PDF files storage metadata
-- ============================================================================
CREATE TABLE document_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  intended_doc_type doc_type NOT NULL,
  storage_path TEXT NOT NULL,
  original_filename TEXT,
  file_hash TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  openai_file_id TEXT,
  extraction_status extraction_status NOT NULL DEFAULT 'queued',
  extraction_error TEXT
);

-- Indexes
CREATE INDEX idx_document_files_document ON document_files(document_id);
CREATE INDEX idx_document_files_status ON document_files(extraction_status);
CREATE INDEX idx_document_files_hash ON document_files(file_hash);

-- ============================================================================
-- TABLE: extraction_runs
-- AI extraction history for auditing
-- ============================================================================
CREATE TABLE extraction_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_file_id UUID NOT NULL REFERENCES document_files(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  raw_response_json JSONB,
  extracted_json JSONB,
  extraction_confidence NUMERIC(3, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_extraction_runs_file ON extraction_runs(document_file_id);

-- ============================================================================
-- TABLE: quote_sales_links
-- Links between quotes and sales orders for comparison
-- ============================================================================
CREATE TABLE quote_sales_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  sales_order_document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  link_method link_method NOT NULL DEFAULT 'manual',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(quote_document_id, sales_order_document_id)
);

CREATE INDEX idx_quote_sales_links_quote ON quote_sales_links(quote_document_id);
CREATE INDEX idx_quote_sales_links_so ON quote_sales_links(sales_order_document_id);

-- ============================================================================
-- TABLE: annual_targets
-- Salesperson annual targets set by VP
-- ============================================================================
CREATE TABLE annual_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salesperson_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  annual_target NUMERIC(15, 2) NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(salesperson_user_id, year)
);

CREATE INDEX idx_annual_targets_salesperson ON annual_targets(salesperson_user_id, year);

-- ============================================================================
-- TABLE: ai_reports
-- Cached AI-generated reports and narratives
-- ============================================================================
CREATE TABLE ai_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_type report_type NOT NULL,
  subject_type report_subject_type NOT NULL,
  subject_id UUID,
  date_start DATE NOT NULL,
  date_end DATE NOT NULL,
  filters JSONB,
  metrics_snapshot JSONB NOT NULL,
  narrative TEXT NOT NULL,
  model TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for finding cached reports
CREATE INDEX idx_ai_reports_lookup ON ai_reports(report_type, subject_type, date_start, date_end);

-- ============================================================================
-- SEED DATA: Regions
-- ============================================================================
INSERT INTO regions (name) VALUES
  ('Gurgaon'),
  ('Jaipur'),
  ('Maharashtra'),
  ('Chennai'),
  ('Indore'),
  ('Noida');

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if current user is a manager (VP or Director)
CREATE OR REPLACE FUNCTION is_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND role IN ('vp', 'director')
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
DECLARE
  user_role_value user_role;
BEGIN
  SELECT role INTO user_role_value FROM profiles WHERE user_id = auth.uid();
  RETURN user_role_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
