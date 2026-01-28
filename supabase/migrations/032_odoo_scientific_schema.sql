-- Migration to align customers table with Odoo res.partner schema
-- and create res_partner_bank table

-- 1. Update customers table with Odoo fields
ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS company_type VARCHAR(20) DEFAULT 'company' CHECK (company_type IN ('person', 'company')),
    ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES customers(id),
    ADD COLUMN IF NOT EXISTS function VARCHAR, -- Job Position
    ADD COLUMN IF NOT EXISTS l10n_in_gst_treatment VARCHAR(50) CHECK (l10n_in_gst_treatment IN ('regular', 'composition', 'unregistered', 'consumer', 'overseas', 'special_economic_zone', 'deemed_export', 'uin_holders')),
    ADD COLUMN IF NOT EXISTS l10n_in_pan VARCHAR(10),
    ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE, -- Registration Date
    ADD COLUMN IF NOT EXISTS ref VARCHAR, -- Reference
    ADD COLUMN IF NOT EXISTS website VARCHAR,
    ADD COLUMN IF NOT EXISTS industry_id UUID, -- Placeholder for now, foreign key later if table exists
    ADD COLUMN IF NOT EXISTS comment TEXT,
    ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

-- 2. Add Company-Dependent Properties (Stored as simple columns for now)
ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS property_payment_term_id UUID, -- Link to account_payment_term if exists
    ADD COLUMN IF NOT EXISTS property_product_pricelist UUID, -- Link to product_pricelist if exists
    ADD COLUMN IF NOT EXISTS property_account_position_id UUID, -- Link to account_fiscal_position
    ADD COLUMN IF NOT EXISTS property_account_receivable_id UUID, -- Link to account_account
    ADD COLUMN IF NOT EXISTS property_account_payable_id UUID, -- Link to account_account
    ADD COLUMN IF NOT EXISTS property_stock_customer UUID, -- Link to stock_location
    ADD COLUMN IF NOT EXISTS property_stock_supplier UUID, -- Link to stock_location
    ADD COLUMN IF NOT EXISTS property_purchase_currency_id UUID; -- Link to res_currency

-- 3. Add Child Contact differentiation
-- 'type' determines if it's a primary address, invoice address, delivery address, etc.
ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'contact' CHECK (type IN ('contact', 'invoice', 'delivery', 'other', 'private', 'followup'));

-- 4. Create res_partner_bank table
CREATE TABLE IF NOT EXISTS res_partner_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    acc_number VARCHAR NOT NULL,
    bank_name VARCHAR, 
    allow_out_payment BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Add Indexes for frequently searched fields
CREATE INDEX IF NOT EXISTS idx_customers_parent_id ON customers(parent_id);
CREATE INDEX IF NOT EXISTS idx_customers_company_type ON customers(company_type);
CREATE INDEX IF NOT EXISTS idx_customers_vat ON customers(vat); -- Assuming vat column exists from previous
CREATE INDEX IF NOT EXISTS idx_res_partner_bank_partner_id ON res_partner_bank(partner_id);

-- Odoo uses 'vat' for GSTIN/Tax ID. Ensure it exists or map it.
-- If 'gstin' exists from previous, we can keep it or alias it. Best to stick to Odoo 'vat'.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'vat') THEN
        ALTER TABLE customers ADD COLUMN vat VARCHAR;
    END IF;
END $$;
