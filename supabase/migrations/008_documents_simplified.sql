-- Migration: 008_documents_simplified.sql
-- Description: Update documents table for simplified quotation/sales order form
-- Makes customer_id and region_id optional, adds direct text fields for simple form

-- ============================================================================
-- ADD MISSING COLUMNS FOR SIMPLIFIED FORM
-- ============================================================================

-- Add columns for direct text input (when not using customer/region lookup)
ALTER TABLE public.documents 
  ADD COLUMN IF NOT EXISTS customer_name_raw TEXT,
  ADD COLUMN IF NOT EXISTS product_name TEXT,
  ADD COLUMN IF NOT EXISTS quantity NUMERIC(15, 4) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS uom TEXT DEFAULT 'pcs',
  ADD COLUMN IF NOT EXISTS unit_price NUMERIC(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_value NUMERIC(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS organization TEXT DEFAULT 'benz_packaging',
  ADD COLUMN IF NOT EXISTS original_quotation_id UUID REFERENCES public.documents(id);

-- ============================================================================
-- MAKE CUSTOMER_ID AND REGION_ID OPTIONAL
-- ============================================================================
ALTER TABLE public.documents 
  ALTER COLUMN customer_id DROP NOT NULL,
  ALTER COLUMN region_id DROP NOT NULL;

-- ============================================================================
-- SET DEFAULT STATUS FOR DOCUMENTS WITHOUT ONE
-- ============================================================================
UPDATE public.documents SET status = 'draft' WHERE status IS NULL;

-- ============================================================================
-- INDEXES FOR NEW COLUMNS
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_documents_organization ON public.documents(organization);
CREATE INDEX IF NOT EXISTS idx_documents_customer_name_raw ON public.documents(customer_name_raw);

-- ============================================================================
-- Comment for reference
-- ============================================================================
COMMENT ON TABLE public.documents IS 'Document headers - Status values: draft, sent, won, lost for quotations; open, confirmed, cancelled for sales orders';
