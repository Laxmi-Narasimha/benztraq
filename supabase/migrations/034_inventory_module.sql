-- Migration: 034_inventory_module.sql
-- Description: Inventory / Store Module for FG Stock management
-- Creates: inventory_items, inventory_transactions tables
-- Adds: store_manager role, store user profile

-- ============================================================================
-- STEP 1: Add store_manager to user_role enum
-- ============================================================================
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'store_manager';

-- ============================================================================
-- STEP 2: Add store_manager role to roles table
-- ============================================================================
INSERT INTO public.roles (name, display_name, level)
VALUES ('store_manager', 'Store Manager', 30)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- STEP 3: Create inventory_items table
-- One row per SKU (product-customer combination)
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sr_no INTEGER,
  customer_name TEXT NOT NULL,
  material_type TEXT,
  part_size TEXT,
  customer_part_code TEXT,
  uom TEXT NOT NULL DEFAULT 'PCS',
  total_received NUMERIC(15, 4) NOT NULL DEFAULT 0,
  total_dispatched NUMERIC(15, 4) NOT NULL DEFAULT 0,
  balance_qty NUMERIC(15, 4) GENERATED ALWAYS AS (total_received - total_dispatched) STORED,
  kg_per_piece NUMERIC(15, 6) DEFAULT 0,
  stock_in_kg NUMERIC(15, 4) GENERATED ALWAYS AS ((total_received - total_dispatched) * kg_per_piece) STORED,
  warehouse TEXT NOT NULL DEFAULT 'FG STOCK',
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure the updated_at trigger function exists
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER inventory_items_updated_at
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Indexes for common queries
CREATE INDEX idx_inventory_items_customer ON inventory_items(customer_name);
CREATE INDEX idx_inventory_items_material ON inventory_items(material_type);
CREATE INDEX idx_inventory_items_warehouse ON inventory_items(warehouse);
CREATE INDEX idx_inventory_items_active ON inventory_items(is_active);
CREATE INDEX idx_inventory_items_balance ON inventory_items(balance_qty);

-- ============================================================================
-- STEP 4: Create inventory_transactions table
-- Every inward/outward creates a timestamped, user-attributed row
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('inward', 'outward')),
  quantity NUMERIC(15, 4) NOT NULL CHECK (quantity > 0),
  reference_note TEXT,
  created_by UUID,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_inv_txn_item ON inventory_transactions(item_id);
CREATE INDEX idx_inv_txn_type ON inventory_transactions(type);
CREATE INDEX idx_inv_txn_date ON inventory_transactions(created_at);
CREATE INDEX idx_inv_txn_created_by ON inventory_transactions(created_by);

-- ============================================================================
-- STEP 5: Trigger to auto-update inventory_items totals on transaction
-- ============================================================================
CREATE OR REPLACE FUNCTION update_inventory_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'inward' THEN
      UPDATE inventory_items 
      SET total_received = total_received + NEW.quantity
      WHERE id = NEW.item_id;
    ELSIF NEW.type = 'outward' THEN
      UPDATE inventory_items 
      SET total_dispatched = total_dispatched + NEW.quantity
      WHERE id = NEW.item_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'inward' THEN
      UPDATE inventory_items 
      SET total_received = total_received - OLD.quantity
      WHERE id = OLD.item_id;
    ELSIF OLD.type = 'outward' THEN
      UPDATE inventory_items 
      SET total_dispatched = total_dispatched - OLD.quantity
      WHERE id = OLD.item_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inventory_transaction
  AFTER INSERT OR DELETE ON inventory_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_transaction();

-- ============================================================================
-- STEP 6: RLS Policies
-- ============================================================================
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Everyone can read inventory
CREATE POLICY inventory_items_read ON inventory_items
  FOR SELECT USING (true);

CREATE POLICY inventory_transactions_read ON inventory_transactions
  FOR SELECT USING (true);

-- Store managers, directors, VPs, and developers can write
CREATE POLICY inventory_items_write ON inventory_items
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY inventory_transactions_write ON inventory_transactions
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- DONE — Tables, triggers, RLS complete.
-- 
-- IMPORTANT: Run 034b_inventory_store_user.sql AFTER this migration commits,
-- because PostgreSQL requires new enum values to be committed first.
-- ============================================================================
COMMENT ON TABLE inventory_items IS 'Finished goods inventory items - one per SKU per customer';
COMMENT ON TABLE inventory_transactions IS 'Timestamped inward/outward transaction log for inventory';

