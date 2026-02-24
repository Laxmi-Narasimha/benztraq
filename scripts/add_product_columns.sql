-- Add missing columns to the products table for the expanded Create Product form
-- Run this SQL in Supabase SQL Editor

-- Product type (Product / Service)
ALTER TABLE products ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'Product';

-- Pricing fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS buying_price NUMERIC(12,2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS landed_cost NUMERIC(12,2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_inclusive_tax BOOLEAN DEFAULT FALSE;

-- Weight fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS gross_weight NUMERIC(10,3) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS net_weight NUMERIC(10,3) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_uom TEXT DEFAULT 'kg';

-- Metadata fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS internal_notes TEXT DEFAULT NULL;

-- Tracking & invoicing
ALTER TABLE products ADD COLUMN IF NOT EXISTS tracking_method TEXT DEFAULT 'none';
ALTER TABLE products ADD COLUMN IF NOT EXISTS invoicing_policy TEXT DEFAULT 'ordered';

-- Stock management
ALTER TABLE products ADD COLUMN IF NOT EXISTS initial_stock NUMERIC(12,2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_point NUMERIC(12,2) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS overstock_point NUMERIC(12,2) DEFAULT NULL;
