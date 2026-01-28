-- Migration 033: Fix Customers Table - Add Missing Odoo Fields
-- This migration adds all missing columns that the API expects

-- ============================================================================
-- SECTION 1: Add Missing Core Contact Fields to Customers Table
-- These fields are expected by the API but were missing from the schema
-- ============================================================================

DO $$
BEGIN
    -- Contact Information
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'email') THEN
        ALTER TABLE customers ADD COLUMN email VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'phone') THEN
        ALTER TABLE customers ADD COLUMN phone VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'mobile') THEN
        ALTER TABLE customers ADD COLUMN mobile VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'website') THEN
        ALTER TABLE customers ADD COLUMN website VARCHAR(255);
    END IF;

    -- Address Fields (Odoo-style flat address on the partner itself)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'street') THEN
        ALTER TABLE customers ADD COLUMN street VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'street2') THEN
        ALTER TABLE customers ADD COLUMN street2 VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'city') THEN
        ALTER TABLE customers ADD COLUMN city VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'zip') THEN
        ALTER TABLE customers ADD COLUMN zip VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'state_code') THEN
        ALTER TABLE customers ADD COLUMN state_code VARCHAR(10);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'country_id') THEN
        ALTER TABLE customers ADD COLUMN country_id VARCHAR(10) DEFAULT 'IN';
    END IF;

    -- Odoo Partner Type Fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'company_type') THEN
        ALTER TABLE customers ADD COLUMN company_type VARCHAR(20) DEFAULT 'company';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'is_company') THEN
        ALTER TABLE customers ADD COLUMN is_company BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'parent_id') THEN
        ALTER TABLE customers ADD COLUMN parent_id UUID REFERENCES customers(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'type') THEN
        ALTER TABLE customers ADD COLUMN type VARCHAR(20) DEFAULT 'contact';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'function') THEN
        ALTER TABLE customers ADD COLUMN function VARCHAR(100);
    END IF;

    -- Indian Localization Fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'vat') THEN
        ALTER TABLE customers ADD COLUMN vat VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'l10n_in_gst_treatment') THEN
        ALTER TABLE customers ADD COLUMN l10n_in_gst_treatment VARCHAR(50) DEFAULT 'consumer';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'l10n_in_pan') THEN
        ALTER TABLE customers ADD COLUMN l10n_in_pan VARCHAR(10);
    END IF;

    -- Business Properties (Odoo company_dependent)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'property_payment_term_id') THEN
        ALTER TABLE customers ADD COLUMN property_payment_term_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'property_product_pricelist') THEN
        ALTER TABLE customers ADD COLUMN property_product_pricelist UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'property_account_position_id') THEN
        ALTER TABLE customers ADD COLUMN property_account_position_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'property_stock_customer') THEN
        ALTER TABLE customers ADD COLUMN property_stock_customer UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'property_stock_supplier') THEN
        ALTER TABLE customers ADD COLUMN property_stock_supplier UUID;
    END IF;

    -- Metadata
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'comment') THEN
        ALTER TABLE customers ADD COLUMN comment TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'active') THEN
        ALTER TABLE customers ADD COLUMN active BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'created_by') THEN
        ALTER TABLE customers ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- ============================================================================
-- SECTION 2: Create res_partner_bank Table (if not exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS res_partner_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    acc_number VARCHAR NOT NULL,
    bank_name VARCHAR,
    allow_out_payment BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 3: Add Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_customers_parent_id ON customers(parent_id);
CREATE INDEX IF NOT EXISTS idx_customers_company_type ON customers(company_type);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_vat ON customers(vat);
CREATE INDEX IF NOT EXISTS idx_res_partner_bank_partner ON res_partner_bank(partner_id);

-- ============================================================================
-- SECTION 4: Update existing records to have default values
-- ============================================================================
UPDATE customers SET company_type = 'company' WHERE company_type IS NULL;
UPDATE customers SET is_company = true WHERE is_company IS NULL;
UPDATE customers SET type = 'contact' WHERE type IS NULL;
UPDATE customers SET active = true WHERE active IS NULL;
UPDATE customers SET l10n_in_gst_treatment = 'consumer' WHERE l10n_in_gst_treatment IS NULL;
