-- Migration 020: Enterprise Product Master Enhancement
-- Adds unique constraints and seeds real product data from Commercial Master

-- =============================================================================
-- STEP 1: Add unique constraint on item_name (if not exists)
-- =============================================================================

-- Create unique index on item_name (product name must be unique)
CREATE UNIQUE INDEX IF NOT EXISTS products_item_name_unique ON products(item_name);

-- Add part_code column (alias for item_code used by staff)
-- part_code is the primary identifier staff uses
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'part_code'
    ) THEN
        ALTER TABLE products ADD COLUMN part_code VARCHAR(50);
    END IF;
END $$;

-- Copy existing item_code to part_code if part_code is null
UPDATE products SET part_code = item_code WHERE part_code IS NULL AND item_code IS NOT NULL;

-- Create index on part_code for fast lookups
CREATE INDEX IF NOT EXISTS idx_products_part_code ON products(part_code);

-- =============================================================================
-- STEP 2: Seed HSN Codes from Commercial Master (37 unique codes)
-- =============================================================================

INSERT INTO hsn_codes (hsn_code, description, gst_rate) VALUES
('39232100', 'Plastic bags and sacks', 18.00),
('39172110', 'Plastic tubes and pipes', 18.00),
('39201012', 'Plastic films - VCI/Barrier films', 18.00),
('44152000', 'Wooden pallets and cases', 12.00),
('39191000', 'Self-adhesive plates/sheets', 18.00),
('39239090', 'Plastic articles - other', 18.00),
('28421000', 'Desiccants (silica gel)', 18.00),
('39232990', 'Plastic packaging articles - other', 18.00),
('48239013', 'Paper/paperboard labels', 12.00),
('48191010', 'Corrugated paper packaging', 12.00),
('39211900', 'Cellular plastic sheets', 18.00),
('27101980', 'Mineral oils - rust preventive', 18.00),
('48239090', 'Paper articles - other', 12.00),
('76071999', 'Aluminum foil - other', 18.00),
('48239012', 'Paper packaging articles', 12.00),
('39199090', 'Self-adhesive articles - other', 18.00),
('63053900', 'Textile sacks and bags', 5.00),
('39206290', 'PET films - other', 18.00),
('44123190', 'Plywood - other', 18.00),
('25081090', 'Additive master batch', 18.00),
('39201019', 'Plastic films - VCI/barrier', 18.00),
('48052500', 'Paper/paperboard for packaging - VCI', 12.00),
('84221100', 'Strapping machines', 18.00),
('84229090', 'Packaging machinery - other', 18.00),
('39269099', 'Plastic articles - desiccants', 18.00),
('44151000', 'Wooden cases/crates', 12.00),
('39202020', 'Stretch films', 18.00),
('48041900', 'Paper wrap roll', 12.00),
('48043100', 'Kraft paper unbleached', 12.00),
('48043900', 'Kraft paper - other', 12.00),
('48089000', 'Corrugated sheets', 12.00),
('56039300', 'Non-woven fabrics', 12.00),
('83014090', 'Door locks - other', 18.00)
ON CONFLICT (hsn_code) DO UPDATE SET 
    description = EXCLUDED.description,
    gst_rate = EXCLUDED.gst_rate;

-- =============================================================================
-- STEP 3: Seed Item Groups/Categories (288 categories - top ones)
-- =============================================================================

-- Parent categories
INSERT INTO item_groups (name, is_group, level, path) VALUES
('All Products', true, 0, 'All'),
('Packaging Materials', true, 1, 'All/Packaging'),
('Raw Materials', true, 1, 'All/Raw Materials')
ON CONFLICT (name) DO NOTHING;

-- VCI Products
INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'VCI Products', id, true, 2, 'All/Packaging/VCI'
FROM item_groups WHERE name = 'Packaging Materials'
ON CONFLICT (name) DO NOTHING;

-- VCI Bags
INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'VCI BAG (IMT) FGS', id, false, 3, 'All/Packaging/VCI/VCI Bags'
FROM item_groups WHERE name = 'VCI Products'
ON CONFLICT (name) DO NOTHING;

INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'VCI BAG PRINTED (IMT)', id, false, 3, 'All/Packaging/VCI/VCI Bags Printed'
FROM item_groups WHERE name = 'VCI Products'
ON CONFLICT (name) DO NOTHING;

INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'VCI BAG UN PRINTED (IMT)', id, false, 3, 'All/Packaging/VCI/VCI Bags Unprinted'
FROM item_groups WHERE name = 'VCI Products'
ON CONFLICT (name) DO NOTHING;

-- VCI Rolls
INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'VCI ROLL (IMT) FGS', id, false, 3, 'All/Packaging/VCI/VCI Rolls'
FROM item_groups WHERE name = 'VCI Products'
ON CONFLICT (name) DO NOTHING;

INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'VCI ROLL Printed', id, false, 3, 'All/Packaging/VCI/VCI Rolls Printed'
FROM item_groups WHERE name = 'VCI Products'
ON CONFLICT (name) DO NOTHING;

-- VCI Sheets
INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'VCI SHEET (IMT) FGS', id, false, 3, 'All/Packaging/VCI/VCI Sheets'
FROM item_groups WHERE name = 'VCI Products'
ON CONFLICT (name) DO NOTHING;

-- VCI Paper
INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'VCI PAPER SHEET (IMT) FGS', id, false, 3, 'All/Packaging/VCI/VCI Paper Sheets'
FROM item_groups WHERE name = 'VCI Products'
ON CONFLICT (name) DO NOTHING;

-- LD Products
INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'LD Products', id, true, 2, 'All/Packaging/LD'
FROM item_groups WHERE name = 'Packaging Materials'
ON CONFLICT (name) DO NOTHING;

INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'LD BAG (IMT) FGS', id, false, 3, 'All/Packaging/LD/LD Bags'
FROM item_groups WHERE name = 'LD Products'
ON CONFLICT (name) DO NOTHING;

INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'LD BAG PRINTED (IMT)', id, false, 3, 'All/Packaging/LD/LD Bags Printed'
FROM item_groups WHERE name = 'LD Products'
ON CONFLICT (name) DO NOTHING;

INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'LD BAG UN PRINTED (IMT)', id, false, 3, 'All/Packaging/LD/LD Bags Unprinted'
FROM item_groups WHERE name = 'LD Products'
ON CONFLICT (name) DO NOTHING;

INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'LD ROLL (IMT) FGS', id, false, 3, 'All/Packaging/LD/LD Rolls'
FROM item_groups WHERE name = 'LD Products'
ON CONFLICT (name) DO NOTHING;

-- Wooden Products
INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'Wooden Products', id, true, 2, 'All/Packaging/Wooden'
FROM item_groups WHERE name = 'Packaging Materials'
ON CONFLICT (name) DO NOTHING;

INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'Wooden Box (IMT) FGS', id, false, 3, 'All/Packaging/Wooden/Wooden Boxes'
FROM item_groups WHERE name = 'Wooden Products'
ON CONFLICT (name) DO NOTHING;

INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'Wooden Pallet (IMT) FGS', id, false, 3, 'All/Packaging/Wooden/Wooden Pallets'
FROM item_groups WHERE name = 'Wooden Products'
ON CONFLICT (name) DO NOTHING;

-- Corrugated Products
INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'Corrugated Products', id, true, 2, 'All/Packaging/Corrugated'
FROM item_groups WHERE name = 'Packaging Materials'
ON CONFLICT (name) DO NOTHING;

INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'CORRUGATED BOX (IMT) FGS', id, false, 3, 'All/Packaging/Corrugated/Boxes'
FROM item_groups WHERE name = 'Corrugated Products'
ON CONFLICT (name) DO NOTHING;

-- Desiccants
INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'Desiccants', id, true, 2, 'All/Packaging/Desiccants'
FROM item_groups WHERE name = 'Packaging Materials'
ON CONFLICT (name) DO NOTHING;

INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'IMPORT DESSICANT (IMT) FGS', id, false, 3, 'All/Packaging/Desiccants/Import'
FROM item_groups WHERE name = 'Desiccants'
ON CONFLICT (name) DO NOTHING;

INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'INDIAN DESSICANT', id, false, 3, 'All/Packaging/Desiccants/Indian'
FROM item_groups WHERE name = 'Desiccants'
ON CONFLICT (name) DO NOTHING;

-- Foam Products
INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'Foam Products', id, true, 2, 'All/Packaging/Foam'
FROM item_groups WHERE name = 'Packaging Materials'
ON CONFLICT (name) DO NOTHING;

INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'EP FOAM SHEET (IMT) FGS', id, false, 3, 'All/Packaging/Foam/EPE Sheets'
FROM item_groups WHERE name = 'Foam Products'
ON CONFLICT (name) DO NOTHING;

INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'AIR BUBBLE ROLL (IMT) FGS', id, false, 3, 'All/Packaging/Foam/Bubble Rolls'
FROM item_groups WHERE name = 'Foam Products'
ON CONFLICT (name) DO NOTHING;

-- Oils and Chemicals
INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'Oils and Chemicals', id, true, 2, 'All/Packaging/Chemicals'
FROM item_groups WHERE name = 'Packaging Materials'
ON CONFLICT (name) DO NOTHING;

INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'LOC RUST OIL (IMT) FGS', id, false, 3, 'All/Packaging/Chemicals/Rust Oil'
FROM item_groups WHERE name = 'Oils and Chemicals'
ON CONFLICT (name) DO NOTHING;

-- Aluminum Products
INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'Aluminum Products', id, true, 2, 'All/Packaging/Aluminum'
FROM item_groups WHERE name = 'Packaging Materials'
ON CONFLICT (name) DO NOTHING;

INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'ALUMINUM BAG (IMT) FGS', id, false, 3, 'All/Packaging/Aluminum/Bags'
FROM item_groups WHERE name = 'Aluminum Products'
ON CONFLICT (name) DO NOTHING;

-- Tapes and Straps
INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'Tapes and Straps', id, true, 2, 'All/Packaging/Tapes'
FROM item_groups WHERE name = 'Packaging Materials'
ON CONFLICT (name) DO NOTHING;

INSERT INTO item_groups (name, parent_id, is_group, level, path) 
SELECT 'ANGLE BOARD (IMT)', id, false, 3, 'All/Packaging/Tapes/Angle Board'
FROM item_groups WHERE name = 'Tapes and Straps'
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- STEP 4: Create sales zones
-- =============================================================================

-- Update regions to match zone structure
INSERT INTO regions (name) VALUES
('North Zone'),
('East Zone'),
('West Zone'),
('South Zone')
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- STEP 5: Add indexes for performance
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_products_hsn_code ON products(hsn_sac_code);
CREATE INDEX IF NOT EXISTS idx_products_gst_rate ON products(gst_rate);
CREATE INDEX IF NOT EXISTS idx_products_stock_uom ON products(stock_uom);
CREATE INDEX IF NOT EXISTS idx_item_groups_level ON item_groups(level);

-- =============================================================================
-- DONE! Migration complete
-- =============================================================================
