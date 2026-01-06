-- Migration 016: Product Master Schema
-- IMPORTANT: This drops and recreates the products table if it exists without item_code

-- =============================================================================
-- STEP 0: Drop existing products table if it's broken (missing item_code)
-- =============================================================================

-- First, drop dependent tables if they exist
DROP TABLE IF EXISTS item_prices CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS product_uom_conversion CASCADE;
DROP TABLE IF EXISTS product_barcodes CASCADE;

-- Drop the products table to recreate it properly
DROP TABLE IF EXISTS products CASCADE;

-- Also drop price_lists as it will be recreated
DROP TABLE IF EXISTS price_lists CASCADE;

-- =============================================================================
-- STEP 1: Create base tables first (no dependencies)
-- =============================================================================

-- Item Groups
CREATE TABLE IF NOT EXISTS item_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    parent_id UUID REFERENCES item_groups(id) ON DELETE SET NULL,
    is_group BOOLEAN DEFAULT false,
    level INTEGER DEFAULT 0,
    path TEXT,
    image_url TEXT,
    description TEXT,
    default_expense_account VARCHAR(100),
    default_income_account VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_item_groups_parent ON item_groups(parent_id);
CREATE INDEX IF NOT EXISTS idx_item_groups_path ON item_groups(path);

-- Brands
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HSN Codes
CREATE TABLE IF NOT EXISTS hsn_codes (
    hsn_code VARCHAR(10) PRIMARY KEY,
    description TEXT NOT NULL,
    gst_rate DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    cess_rate DECIMAL(5,2) DEFAULT 0,
    effective_from DATE,
    effective_to DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- STEP 2: Create Products table (with item_code column!)
-- =============================================================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identification
    item_code VARCHAR(50) NOT NULL UNIQUE,
    item_name VARCHAR(255) NOT NULL,
    naming_series VARCHAR(50) DEFAULT 'ITEM-.YYYY.-',
    
    -- Classification
    item_group_id UUID REFERENCES item_groups(id) ON DELETE SET NULL,
    brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
    
    -- Type Flags
    is_stock_item BOOLEAN DEFAULT true,
    is_fixed_asset BOOLEAN DEFAULT false,
    is_sales_item BOOLEAN DEFAULT true,
    is_purchase_item BOOLEAN DEFAULT true,
    disabled BOOLEAN DEFAULT false,
    
    -- Description
    description TEXT,
    description_html TEXT,
    image_url TEXT,
    
    -- Units of Measure
    stock_uom VARCHAR(20) NOT NULL DEFAULT 'Nos',
    sales_uom VARCHAR(20),
    purchase_uom VARCHAR(20),
    
    -- Pricing
    standard_rate DECIMAL(15,2) DEFAULT 0,
    valuation_rate DECIMAL(15,2),
    last_purchase_rate DECIMAL(15,2),
    max_discount DECIMAL(5,2) DEFAULT 0,
    
    -- Taxation (India GST)
    hsn_sac_code VARCHAR(10),
    gst_rate DECIMAL(5,2) DEFAULT 18.00,
    is_nil_exempt BOOLEAN DEFAULT false,
    is_non_gst BOOLEAN DEFAULT false,
    
    -- Inventory Control
    maintain_stock BOOLEAN DEFAULT true,
    opening_stock DECIMAL(15,4) DEFAULT 0,
    safety_stock DECIMAL(15,4) DEFAULT 0,
    reorder_level DECIMAL(15,4),
    reorder_qty DECIMAL(15,4),
    lead_time_days INTEGER DEFAULT 0,
    min_order_qty DECIMAL(15,4) DEFAULT 1,
    
    -- Specific Dimensions (Critical for Packaging)
    length DECIMAL(10,2),
    width DECIMAL(10,2),
    height DECIMAL(10,2),
    dimension_uom VARCHAR(10) DEFAULT 'mm',
    thickness_micron DECIMAL(10,2),
    gsm DECIMAL(10,2),
    ply_count INTEGER,
    
    -- Physical Attributes
    weight_per_unit DECIMAL(15,4),
    weight_uom VARCHAR(20) DEFAULT 'Kg',
    
    -- Warranty & Lifecycle
    warranty_period INTEGER,
    shelf_life_in_days INTEGER,
    end_of_life DATE DEFAULT '2099-12-31',
    
    -- Serial & Batch Tracking
    has_serial_no BOOLEAN DEFAULT false,
    serial_no_series VARCHAR(50),
    has_batch_no BOOLEAN DEFAULT false,
    batch_number_series VARCHAR(50),
    has_expiry_date BOOLEAN DEFAULT false,
    
    -- Variants
    has_variants BOOLEAN DEFAULT false,
    variant_of UUID REFERENCES products(id) ON DELETE SET NULL,
    variant_based_on VARCHAR(50) DEFAULT 'Item Attribute',
    
    -- Manufacturing
    include_in_manufacturing BOOLEAN DEFAULT true,
    is_sub_contracted BOOLEAN DEFAULT false,
    default_bom_id UUID,
    
    -- Supplier Details
    delivered_by_supplier BOOLEAN DEFAULT false,
    is_customer_provided BOOLEAN DEFAULT false,
    
    -- Quality
    inspection_required_before_purchase BOOLEAN DEFAULT false,
    inspection_required_before_delivery BOOLEAN DEFAULT false,
    
    -- Foreign Trade
    country_of_origin VARCHAR(100) DEFAULT 'India',
    customs_tariff_number VARCHAR(20),
    
    -- Metadata
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_products_item_code ON products(item_code);
CREATE INDEX idx_products_item_name ON products(item_name);
CREATE INDEX idx_products_item_group ON products(item_group_id);
CREATE INDEX idx_products_hsn ON products(hsn_sac_code);
CREATE INDEX idx_products_disabled ON products(disabled);

-- =============================================================================
-- STEP 3: Create dependent tables
-- =============================================================================

-- Product Barcodes
CREATE TABLE product_barcodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    barcode VARCHAR(100) NOT NULL UNIQUE,
    barcode_type VARCHAR(50) DEFAULT 'EAN',
    uom VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_barcodes_barcode ON product_barcodes(barcode);
CREATE INDEX idx_barcodes_product ON product_barcodes(product_id);

-- Product UOM Conversion
CREATE TABLE product_uom_conversion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    from_uom VARCHAR(20) NOT NULL,
    to_uom VARCHAR(20) NOT NULL,
    conversion_factor DECIMAL(15,6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, from_uom, to_uom)
);

-- Item Attributes
CREATE TABLE IF NOT EXISTS item_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    values JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Variants
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    attributes JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, variant_product_id)
);

-- Price Lists
CREATE TABLE price_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    currency VARCHAR(3) DEFAULT 'INR',
    is_buying BOOLEAN DEFAULT false,
    is_selling BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    enabled BOOLEAN DEFAULT true,
    valid_from DATE,
    valid_to DATE,
    customer_id UUID,
    territory_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Item Prices
CREATE TABLE item_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
    uom VARCHAR(20),
    min_qty DECIMAL(15,4) DEFAULT 1,
    price_list_rate DECIMAL(15,2) NOT NULL,
    valid_from DATE,
    valid_to DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, price_list_id, uom, min_qty, valid_from)
);

CREATE INDEX idx_item_prices_product ON item_prices(product_id);
CREATE INDEX idx_item_prices_price_list ON item_prices(price_list_id);

-- =============================================================================
-- STEP 4: Insert Seed Data
-- =============================================================================

-- Item Groups Seed
INSERT INTO item_groups (name, is_group, level, path) VALUES
('All Item Groups', true, 0, 'All'),
('Packaging Materials', true, 1, 'All/Packaging')
ON CONFLICT (name) DO NOTHING;

INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'VCI Films', id, false, 2, 'All/Packaging/VCI Films'
FROM item_groups WHERE name = 'Packaging Materials'
ON CONFLICT (name) DO NOTHING;

INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'VCI Bags', id, true, 2, 'All/Packaging/VCI Bags'
FROM item_groups WHERE name = 'Packaging Materials'
ON CONFLICT (name) DO NOTHING;

INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'VCI Papers', id, false, 2, 'All/Packaging/VCI Papers'
FROM item_groups WHERE name = 'Packaging Materials'
ON CONFLICT (name) DO NOTHING;

INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'Wooden Packaging', id, true, 2, 'All/Packaging/Wooden'
FROM item_groups WHERE name = 'Packaging Materials'
ON CONFLICT (name) DO NOTHING;

INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'Corrugated Packaging', id, true, 2, 'All/Packaging/Corrugated'
FROM item_groups WHERE name = 'Packaging Materials'
ON CONFLICT (name) DO NOTHING;

INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'Desiccants', id, false, 2, 'All/Packaging/Desiccants'
FROM item_groups WHERE name = 'Packaging Materials'
ON CONFLICT (name) DO NOTHING;

INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'Machines', id, false, 2, 'All/Packaging/Machines'
FROM item_groups WHERE name = 'Packaging Materials'
ON CONFLICT (name) DO NOTHING;

-- HSN Codes Seed
INSERT INTO hsn_codes (hsn_code, description, gst_rate) VALUES
('39201019', 'Plastic films - VCI/Barrier films', 18.00),
('39232100', 'Plastic bags and sacks', 18.00),
('39232990', 'Plastic packaging articles', 18.00),
('48052500', 'Paper/paperboard for packaging - VCI Paper', 12.00),
('84221100', 'Strapping machines', 18.00),
('84229090', 'Other packaging machinery', 18.00),
('39269099', 'Other plastic articles - Desiccants', 18.00),
('44151000', 'Wooden packaging cases/crates', 18.00),
('44152000', 'Wooden pallets', 18.00),
('39202020', 'Stretch films', 18.00)
ON CONFLICT (hsn_code) DO UPDATE SET 
    description = EXCLUDED.description,
    gst_rate = EXCLUDED.gst_rate;

-- Item Attributes Seed
INSERT INTO item_attributes (name, values) VALUES
('Color', '["Blue", "Yellow", "Green", "Transparent", "Pink", "White"]'),
('Micron', '["50", "75", "80", "100", "120", "150"]'),
('Print Type', '["Printed", "Unprinted"]'),
('Material', '["LDPE", "HDPE", "VCI", "Non-VCI"]')
ON CONFLICT (name) DO NOTHING;

-- Price Lists Seed
INSERT INTO price_lists (name, currency, is_selling, is_default, enabled) VALUES
('Standard Selling', 'INR', true, true, true),
('Standard Buying', 'INR', false, false, true)
ON CONFLICT (name) DO NOTHING;

-- Brands Seed
INSERT INTO brands (name, description) VALUES
('Benz', 'Benz Packaging Solutions In-house'),
('Branopac', 'Branopac Germany VCI'),
('Cortec', 'Cortec Corporation VCI'),
('Propatech', 'Propatech VCI Products')
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- DONE! Verify with:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'products';
-- =============================================================================
