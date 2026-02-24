-- Complete product columns migration
-- Run this SQL in Supabase SQL Editor
-- All statements use IF NOT EXISTS — safe to run multiple times

-- Product type (Product / Service)
ALTER TABLE products ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'Product';

-- ─── Pricing ───
ALTER TABLE products ADD COLUMN IF NOT EXISTS buying_price NUMERIC(12,2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS landed_cost NUMERIC(12,2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_inclusive_tax BOOLEAN DEFAULT FALSE;

-- ─── Dimensions ───
ALTER TABLE products ADD COLUMN IF NOT EXISTS length NUMERIC(10,2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS width NUMERIC(10,2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS height NUMERIC(10,2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS dimension_uom TEXT DEFAULT 'cm';

-- ─── Weights ───
ALTER TABLE products ADD COLUMN IF NOT EXISTS gross_weight NUMERIC(10,3) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS net_weight NUMERIC(10,3) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_uom TEXT DEFAULT 'kg';

-- ─── Packaging Specifications ───
ALTER TABLE products ADD COLUMN IF NOT EXISTS thickness_micron NUMERIC(10,2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS gsm NUMERIC(10,2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS ply_count INTEGER DEFAULT NULL;

-- ─── Metadata ───
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS internal_notes TEXT DEFAULT NULL;

-- ─── Tracking & Invoicing ───
ALTER TABLE products ADD COLUMN IF NOT EXISTS tracking_method TEXT DEFAULT 'none';
ALTER TABLE products ADD COLUMN IF NOT EXISTS invoicing_policy TEXT DEFAULT 'ordered';

-- ─── Stock Management ───
ALTER TABLE products ADD COLUMN IF NOT EXISTS initial_stock NUMERIC(12,2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_point NUMERIC(12,2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS overstock_point NUMERIC(12,2) DEFAULT NULL;
