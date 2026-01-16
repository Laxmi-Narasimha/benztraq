-- =====================================================
-- ODOO COMPLETE CRM/SALES SYSTEM MIGRATION
-- Exact replication of Odoo sale.order, crm.lead, res.partner
-- FIXED: Removed all invalid FK references
-- =====================================================

-- =====================================================
-- 1. LOOKUP TABLES (Required first for FK references)
-- =====================================================

-- 1.1 Sales Teams (crm.team) - Created FIRST so crm_stages can reference it
CREATE TABLE IF NOT EXISTS sales_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sequence INTEGER DEFAULT 10,
    active BOOLEAN DEFAULT TRUE,
    company_id UUID,
    
    -- CRM Configuration
    use_leads BOOLEAN DEFAULT TRUE,
    use_opportunities BOOLEAN DEFAULT TRUE,
    
    -- Lead Assignment
    assignment_enabled BOOLEAN DEFAULT FALSE,
    assignment_max INTEGER DEFAULT 30,
    assignment_domain TEXT,
    
    -- Performance Metrics (computed)
    opportunities_count INTEGER DEFAULT 0,
    opportunities_amount DECIMAL(18,2) DEFAULT 0,
    
    -- Custom Properties
    lead_properties_definition JSONB,
    
    -- Color for UI
    color INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 CRM Stages (crm.stage) - Now can reference sales_teams
CREATE TABLE IF NOT EXISTS crm_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sequence INTEGER DEFAULT 10,
    is_won BOOLEAN DEFAULT FALSE,
    fold BOOLEAN DEFAULT FALSE,
    team_id UUID REFERENCES sales_teams(id) ON DELETE SET NULL,
    requirements TEXT,
    company_id UUID,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 Lost Reasons (crm.lost.reason)
CREATE TABLE IF NOT EXISTS lost_reasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    leads_count INTEGER DEFAULT 0,
    company_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.4 Partner Industries (res.partner.industry)
CREATE TABLE IF NOT EXISTS partner_industries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    full_name TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'partner_industries_name_key') THEN
        ALTER TABLE partner_industries ADD CONSTRAINT partner_industries_name_key UNIQUE (name);
    END IF;
END $$;

-- 1.5 Partner Categories/Tags (res.partner.category)
CREATE TABLE IF NOT EXISTS partner_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    color INTEGER DEFAULT 0,
    parent_id UUID REFERENCES partner_categories(id),
    active BOOLEAN DEFAULT TRUE,
    company_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. UTM TRACKING TABLES (Marketing Attribution)
-- =====================================================

-- 2.1 UTM Campaigns (utm.campaign)
CREATE TABLE IF NOT EXISTS utm_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    title TEXT,
    user_id UUID, -- No FK, stores auth.users UUID
    stage_id INTEGER,
    is_auto_campaign BOOLEAN DEFAULT FALSE,
    color INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    company_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 UTM Sources (utm.source)
CREATE TABLE IF NOT EXISTS utm_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'utm_sources_name_key') THEN
        ALTER TABLE utm_sources ADD CONSTRAINT utm_sources_name_key UNIQUE (name);
    END IF;
END $$;

-- 2.3 UTM Mediums (utm.medium)
CREATE TABLE IF NOT EXISTS utm_mediums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'utm_mediums_name_key') THEN
        ALTER TABLE utm_mediums ADD CONSTRAINT utm_mediums_name_key UNIQUE (name);
    END IF;
END $$;

-- =====================================================
-- 3. PRICELISTS (product.pricelist)
-- =====================================================

CREATE TABLE IF NOT EXISTS pricelists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    currency_id TEXT DEFAULT 'INR',
    active BOOLEAN DEFAULT TRUE,
    company_id UUID,
    
    -- Discount Policy
    discount_policy TEXT DEFAULT 'with_discount',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 Pricelist Items (product.pricelist.item)
CREATE TABLE IF NOT EXISTS pricelist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pricelist_id UUID NOT NULL REFERENCES pricelists(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    category_id UUID,
    
    -- Price Computation
    compute_price TEXT DEFAULT 'fixed',
    fixed_price DECIMAL(18,2),
    percent_price DECIMAL(5,2),
    
    -- Validity
    date_start DATE,
    date_end DATE,
    min_quantity DECIMAL(18,3) DEFAULT 0,
    
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. QUOTE TEMPLATES (sale.order.template)
-- =====================================================

CREATE TABLE IF NOT EXISTS quote_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    note TEXT,
    number_of_days INTEGER DEFAULT 30,
    
    -- Online Features
    require_signature BOOLEAN DEFAULT FALSE,
    require_payment BOOLEAN DEFAULT FALSE,
    prepayment_percent DECIMAL(5,2) DEFAULT 0,
    
    -- Mail Template
    mail_template_id UUID,
    
    active BOOLEAN DEFAULT TRUE,
    company_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quote Template Lines (sale.order.template.line)
CREATE TABLE IF NOT EXISTS quote_template_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES quote_templates(id) ON DELETE CASCADE,
    sequence INTEGER DEFAULT 10,
    
    -- Product Info
    product_id UUID REFERENCES products(id),
    name TEXT,
    quantity DECIMAL(18,3) DEFAULT 1,
    
    -- Display
    display_type TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. ENHANCE CUSTOMERS TABLE (res.partner)
-- =====================================================

-- Add all Odoo res.partner fields
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_company BOOLEAN DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_type TEXT DEFAULT 'person';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES customers(id);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS child_ids UUID[];

-- Contact Info
ALTER TABLE customers ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS street2 TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS zip TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS country_id TEXT DEFAULT 'IN';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS mobile TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS function TEXT;

-- Location
ALTER TABLE customers ADD COLUMN IF NOT EXISTS partner_latitude DECIMAL(10,7);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS partner_longitude DECIMAL(10,7);

-- Business Info
ALTER TABLE customers ADD COLUMN IF NOT EXISTS industry_id UUID REFERENCES partner_industries(id);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_registry TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ref TEXT;

-- GST (Indian Localization - l10n_in)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS l10n_in_gst_treatment TEXT DEFAULT 'consumer';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS l10n_in_pan TEXT;

-- Sales Specific (sale/models/res_partner.py)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS sale_order_count INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS sale_warn TEXT DEFAULT 'no-message';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS sale_warn_msg TEXT;

-- Credit Management
ALTER TABLE customers ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(18,2) DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS use_partner_credit_limit BOOLEAN DEFAULT FALSE;

-- Categories/Tags
ALTER TABLE customers ADD COLUMN IF NOT EXISTS category_ids UUID[];

-- Display
ALTER TABLE customers ADD COLUMN IF NOT EXISTS color INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS employee BOOLEAN DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS comment TEXT;

-- Type (for contact types)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'contact';

-- =====================================================
-- 6. CREATE/ENHANCE LEADS TABLE (crm.lead)
-- =====================================================

-- First ensure leads table exists
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Core Fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'lead';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_id UUID;

-- Probabilities
ALTER TABLE leads ADD COLUMN IF NOT EXISTS probability DECIMAL(5,2) DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS automated_probability DECIMAL(5,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_automated_probability BOOLEAN DEFAULT TRUE;

-- Revenue
ALTER TABLE leads ADD COLUMN IF NOT EXISTS expected_revenue DECIMAL(18,2) DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS prorated_revenue DECIMAL(18,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS recurring_revenue DECIMAL(18,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS recurring_revenue_monthly DECIMAL(18,2);

-- Priority
ALTER TABLE leads ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT '0';

-- Stage & Pipeline
ALTER TABLE leads ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES crm_stages(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lost_reason_id UUID REFERENCES lost_reasons(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS color INTEGER DEFAULT 0;

-- Assignment (stores auth.users UUID)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES sales_teams(id);

-- Customer Link
ALTER TABLE leads ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES customers(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS partner_name TEXT;

-- Contact Info (for lead without partner)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_from TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS mobile TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_state TEXT DEFAULT 'correct';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone_state TEXT DEFAULT 'correct';

-- Address (for leads without partner)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS street2 TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS state_id UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS zip TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS country_id TEXT DEFAULT 'IN';

-- UTM Tracking
ALTER TABLE leads ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES utm_campaigns(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES utm_sources(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS medium_id UUID REFERENCES utm_mediums(id);

-- Dates
ALTER TABLE leads ADD COLUMN IF NOT EXISTS date_deadline DATE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS date_open TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS date_closed TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS date_last_stage_update TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS date_conversion TIMESTAMPTZ;

-- Activity Tracking
ALTER TABLE leads ADD COLUMN IF NOT EXISTS day_open INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS day_close INTEGER;

-- Custom Properties
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_properties JSONB;

-- Description
ALTER TABLE leads ADD COLUMN IF NOT EXISTS description TEXT;

-- Website Info
ALTER TABLE leads ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS referred TEXT;

-- =====================================================
-- 7. ENHANCE DOCUMENTS TABLE (sale.order)
-- =====================================================

-- Core Workflow
ALTER TABLE documents ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'draft';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS locked BOOLEAN DEFAULT FALSE;

-- Partners (Invoice/Shipping)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS partner_invoice_id UUID REFERENCES customers(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS partner_shipping_id UUID REFERENCES customers(id);

-- Fiscal & Pricing
ALTER TABLE documents ADD COLUMN IF NOT EXISTS fiscal_position_id UUID;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS pricelist_id UUID REFERENCES pricelists(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS currency_id TEXT DEFAULT 'INR';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS currency_rate DECIMAL(12,6) DEFAULT 1.0;

-- Team & Assignment (stores auth.users UUID)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES sales_teams(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS salesperson_id UUID;

-- Dates
ALTER TABLE documents ADD COLUMN IF NOT EXISTS date_order TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE documents ADD COLUMN IF NOT EXISTS validity_date DATE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS expected_date TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS commitment_date TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_expired BOOLEAN DEFAULT FALSE;

-- Payment
ALTER TABLE documents ADD COLUMN IF NOT EXISTS payment_term_id UUID;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS prepayment_percent DECIMAL(5,2) DEFAULT 0;

-- Signature & Confirmation
ALTER TABLE documents ADD COLUMN IF NOT EXISTS require_signature BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS require_payment BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS signature TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS signed_by TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS signed_on TIMESTAMPTZ;

-- Quote Template
ALTER TABLE documents ADD COLUMN IF NOT EXISTS quote_template_id UUID REFERENCES quote_templates(id);

-- Amounts (Computed)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS amount_untaxed DECIMAL(18,2) DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS amount_tax DECIMAL(18,2) DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS amount_total DECIMAL(18,2) DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS amount_to_invoice DECIMAL(18,2) DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS amount_invoiced DECIMAL(18,2) DEFAULT 0;

-- GST Breakdown (Indian)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS cgst_amount DECIMAL(18,2) DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS sgst_amount DECIMAL(18,2) DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS igst_amount DECIMAL(18,2) DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS cess_amount DECIMAL(18,2) DEFAULT 0;

-- Tax Totals (JSON for display)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tax_totals JSONB;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tax_calculation_rounding_method TEXT DEFAULT 'round_per_line';

-- Invoice Status
ALTER TABLE documents ADD COLUMN IF NOT EXISTS invoice_status TEXT DEFAULT 'no';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS invoice_count INTEGER DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS invoice_ids UUID[];

-- Origin & Reference
ALTER TABLE documents ADD COLUMN IF NOT EXISTS origin TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS client_order_ref TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS reference TEXT;

-- Tags
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tag_ids UUID[];

-- UTM Tracking
ALTER TABLE documents ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES utm_campaigns(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES utm_sources(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS medium_id UUID REFERENCES utm_mediums(id);

-- Notes
ALTER TABLE documents ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS terms TEXT;

-- CRM Lead Link
ALTER TABLE documents ADD COLUMN IF NOT EXISTS opportunity_id UUID REFERENCES leads(id);

-- Amount in Words (Indian format)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS amount_in_words TEXT;

-- =====================================================
-- 8. ENHANCE DOCUMENT_LINES TABLE (sale.order.line)
-- =====================================================

-- Sequence
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS sequence INTEGER DEFAULT 10;

-- Product Details
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS product_uom TEXT DEFAULT 'Units';
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'consu';

-- Packaging
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS product_packaging_id UUID;
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS product_packaging_qty DECIMAL(18,3);

-- Taxes
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS tax_id UUID[];
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS price_tax DECIMAL(18,2) DEFAULT 0;

-- Prices (Odoo exact fields)
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS price_unit DECIMAL(18,4) DEFAULT 0;
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS price_subtotal DECIMAL(18,2) DEFAULT 0;
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS price_total DECIMAL(18,2) DEFAULT 0;
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS price_reduce_taxexcl DECIMAL(18,4);
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS price_reduce_taxinc DECIMAL(18,4);

-- Discount
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS discount DECIMAL(5,2) DEFAULT 0;
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(18,2) DEFAULT 0;

-- GST Breakdown (Indian)
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS cgst_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS cgst_amount DECIMAL(18,2) DEFAULT 0;
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS sgst_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS sgst_amount DECIMAL(18,2) DEFAULT 0;
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS igst_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS igst_amount DECIMAL(18,2) DEFAULT 0;
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS cess_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS cess_amount DECIMAL(18,2) DEFAULT 0;

-- Delivery & Invoice Tracking
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS qty_delivered DECIMAL(18,3) DEFAULT 0;
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS qty_delivered_method TEXT;
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS qty_invoiced DECIMAL(18,3) DEFAULT 0;
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS qty_to_invoice DECIMAL(18,3);
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS invoice_line_status TEXT DEFAULT 'no';

-- Invoice Lines Link
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS invoice_lines UUID[];
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS untaxed_amount_invoiced DECIMAL(18,2);
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS untaxed_amount_to_invoice DECIMAL(18,2);

-- Display (for sections/notes)
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS display_type TEXT;
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS is_downpayment BOOLEAN DEFAULT FALSE;

-- Customer Lead Time
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS customer_lead DECIMAL(10,2) DEFAULT 0;

-- State (readonly copy from order)
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS line_state TEXT;

-- =====================================================
-- 9. ENHANCE PRODUCTS TABLE
-- =====================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_ok BOOLEAN DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS purchase_ok BOOLEAN DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'consu';

-- Pricing
ALTER TABLE products ADD COLUMN IF NOT EXISTS list_price DECIMAL(18,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS standard_price DECIMAL(18,2) DEFAULT 0;

-- Descriptions
ALTER TABLE products ADD COLUMN IF NOT EXISTS description_sale TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description_purchase TEXT;

-- Codes
ALTER TABLE products ADD COLUMN IF NOT EXISTS default_code TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT;

-- Physical
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight DECIMAL(10,4);
ALTER TABLE products ADD COLUMN IF NOT EXISTS volume DECIMAL(10,4);

-- Taxes
ALTER TABLE products ADD COLUMN IF NOT EXISTS taxes_id UUID[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_taxes_id UUID[];

-- Indian Localization
ALTER TABLE products ADD COLUMN IF NOT EXISTS l10n_in_hsn_code TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS l10n_in_hsn_description TEXT;

-- =====================================================
-- 10. INSERT DEFAULT DATA
-- =====================================================

-- Default CRM Stages
INSERT INTO crm_stages (name, sequence, is_won, fold) 
SELECT 'New', 1, FALSE, FALSE WHERE NOT EXISTS (SELECT 1 FROM crm_stages WHERE name = 'New');
INSERT INTO crm_stages (name, sequence, is_won, fold) 
SELECT 'Qualified', 2, FALSE, FALSE WHERE NOT EXISTS (SELECT 1 FROM crm_stages WHERE name = 'Qualified');
INSERT INTO crm_stages (name, sequence, is_won, fold) 
SELECT 'Proposition', 3, FALSE, FALSE WHERE NOT EXISTS (SELECT 1 FROM crm_stages WHERE name = 'Proposition');
INSERT INTO crm_stages (name, sequence, is_won, fold) 
SELECT 'Negotiation', 4, FALSE, FALSE WHERE NOT EXISTS (SELECT 1 FROM crm_stages WHERE name = 'Negotiation');
INSERT INTO crm_stages (name, sequence, is_won, fold) 
SELECT 'Won', 5, TRUE, TRUE WHERE NOT EXISTS (SELECT 1 FROM crm_stages WHERE name = 'Won');
INSERT INTO crm_stages (name, sequence, is_won, fold) 
SELECT 'Lost', 6, FALSE, TRUE WHERE NOT EXISTS (SELECT 1 FROM crm_stages WHERE name = 'Lost');

-- Default Lost Reasons
INSERT INTO lost_reasons (name) 
SELECT 'Too Expensive' WHERE NOT EXISTS (SELECT 1 FROM lost_reasons WHERE name = 'Too Expensive');
INSERT INTO lost_reasons (name) 
SELECT 'Product not available' WHERE NOT EXISTS (SELECT 1 FROM lost_reasons WHERE name = 'Product not available');
INSERT INTO lost_reasons (name) 
SELECT 'Not responsive' WHERE NOT EXISTS (SELECT 1 FROM lost_reasons WHERE name = 'Not responsive');
INSERT INTO lost_reasons (name) 
SELECT 'Competitor' WHERE NOT EXISTS (SELECT 1 FROM lost_reasons WHERE name = 'Competitor');
INSERT INTO lost_reasons (name) 
SELECT 'Other' WHERE NOT EXISTS (SELECT 1 FROM lost_reasons WHERE name = 'Other');

-- Default UTM Sources
INSERT INTO utm_sources (name) 
SELECT 'Search engine' WHERE NOT EXISTS (SELECT 1 FROM utm_sources WHERE name = 'Search engine');
INSERT INTO utm_sources (name) 
SELECT 'Direct' WHERE NOT EXISTS (SELECT 1 FROM utm_sources WHERE name = 'Direct');
INSERT INTO utm_sources (name) 
SELECT 'Referral' WHERE NOT EXISTS (SELECT 1 FROM utm_sources WHERE name = 'Referral');
INSERT INTO utm_sources (name) 
SELECT 'Website' WHERE NOT EXISTS (SELECT 1 FROM utm_sources WHERE name = 'Website');

-- Default UTM Mediums
INSERT INTO utm_mediums (name) 
SELECT 'Website' WHERE NOT EXISTS (SELECT 1 FROM utm_mediums WHERE name = 'Website');
INSERT INTO utm_mediums (name) 
SELECT 'Email' WHERE NOT EXISTS (SELECT 1 FROM utm_mediums WHERE name = 'Email');
INSERT INTO utm_mediums (name) 
SELECT 'Phone' WHERE NOT EXISTS (SELECT 1 FROM utm_mediums WHERE name = 'Phone');

-- Default Industries
INSERT INTO partner_industries (name, full_name) 
SELECT 'Manufacturing', 'Manufacturing Industry' WHERE NOT EXISTS (SELECT 1 FROM partner_industries WHERE name = 'Manufacturing');
INSERT INTO partner_industries (name, full_name) 
SELECT 'IT Services', 'Information Technology' WHERE NOT EXISTS (SELECT 1 FROM partner_industries WHERE name = 'IT Services');
INSERT INTO partner_industries (name, full_name) 
SELECT 'Retail', 'Retail Trade' WHERE NOT EXISTS (SELECT 1 FROM partner_industries WHERE name = 'Retail');
INSERT INTO partner_industries (name, full_name) 
SELECT 'Healthcare', 'Healthcare Services' WHERE NOT EXISTS (SELECT 1 FROM partner_industries WHERE name = 'Healthcare');

-- Default Partner Categories
INSERT INTO partner_categories (name, color) 
SELECT 'VIP', 1 WHERE NOT EXISTS (SELECT 1 FROM partner_categories WHERE name = 'VIP');
INSERT INTO partner_categories (name, color) 
SELECT 'Regular', 2 WHERE NOT EXISTS (SELECT 1 FROM partner_categories WHERE name = 'Regular');
INSERT INTO partner_categories (name, color) 
SELECT 'Prospect', 3 WHERE NOT EXISTS (SELECT 1 FROM partner_categories WHERE name = 'Prospect');

-- =====================================================
-- 11. INDEXES FOR PERFORMANCE
-- =====================================================

-- Leads indexes
CREATE INDEX IF NOT EXISTS idx_leads_stage_id ON leads(stage_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_team_id ON leads(team_id);
CREATE INDEX IF NOT EXISTS idx_leads_partner_id ON leads(partner_id);
CREATE INDEX IF NOT EXISTS idx_leads_type ON leads(type);
CREATE INDEX IF NOT EXISTS idx_leads_active ON leads(active);
CREATE INDEX IF NOT EXISTS idx_leads_date_deadline ON leads(date_deadline);
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_state ON documents(state);
CREATE INDEX IF NOT EXISTS idx_documents_team_id ON documents(team_id);
CREATE INDEX IF NOT EXISTS idx_documents_salesperson_id ON documents(salesperson_id);
CREATE INDEX IF NOT EXISTS idx_documents_opportunity_id ON documents(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_documents_pricelist_id ON documents(pricelist_id);
CREATE INDEX IF NOT EXISTS idx_documents_date_order ON documents(date_order);

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_parent_id ON customers(parent_id);
CREATE INDEX IF NOT EXISTS idx_customers_industry_id ON customers(industry_id);
CREATE INDEX IF NOT EXISTS idx_customers_is_company ON customers(is_company);

-- CRM Stages indexes
CREATE INDEX IF NOT EXISTS idx_crm_stages_sequence ON crm_stages(sequence);
CREATE INDEX IF NOT EXISTS idx_crm_stages_is_won ON crm_stages(is_won);

-- Sales Teams indexes
CREATE INDEX IF NOT EXISTS idx_sales_teams_active ON sales_teams(active);

-- =====================================================
-- 12. TRIGGERS FOR AUTO-COMPUTATION
-- =====================================================

-- Function to compute line totals
CREATE OR REPLACE FUNCTION compute_document_line_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate base subtotal
    NEW.price_subtotal := COALESCE(NEW.qty, 0) * COALESCE(NEW.price_unit, COALESCE(NEW.unit_price, 0)) * 
                          (1 - COALESCE(NEW.discount, 0) / 100);
    
    -- Calculate discount amount
    NEW.discount_amount := COALESCE(NEW.qty, 0) * COALESCE(NEW.price_unit, COALESCE(NEW.unit_price, 0)) * 
                           COALESCE(NEW.discount, 0) / 100;
    
    -- Calculate tax amounts (GST)
    NEW.cgst_amount := COALESCE(NEW.price_subtotal, 0) * COALESCE(NEW.cgst_rate, 0) / 100;
    NEW.sgst_amount := COALESCE(NEW.price_subtotal, 0) * COALESCE(NEW.sgst_rate, 0) / 100;
    NEW.igst_amount := COALESCE(NEW.price_subtotal, 0) * COALESCE(NEW.igst_rate, 0) / 100;
    NEW.cess_amount := COALESCE(NEW.price_subtotal, 0) * COALESCE(NEW.cess_rate, 0) / 100;
    
    -- Total tax
    NEW.price_tax := COALESCE(NEW.cgst_amount, 0) + COALESCE(NEW.sgst_amount, 0) + COALESCE(NEW.igst_amount, 0) + COALESCE(NEW.cess_amount, 0);
    
    -- Total price
    NEW.price_total := COALESCE(NEW.price_subtotal, 0) + COALESCE(NEW.price_tax, 0);
    
    -- Qty to invoice
    NEW.qty_to_invoice := COALESCE(NEW.qty, 0) - COALESCE(NEW.qty_invoiced, 0);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for line computation
DROP TRIGGER IF EXISTS trg_compute_line_totals ON document_lines;
CREATE TRIGGER trg_compute_line_totals
    BEFORE INSERT OR UPDATE ON document_lines
    FOR EACH ROW
    EXECUTE FUNCTION compute_document_line_totals();

-- Function to compute document totals from lines
CREATE OR REPLACE FUNCTION compute_document_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_untaxed DECIMAL(18,2);
    v_tax DECIMAL(18,2);
    v_total DECIMAL(18,2);
    v_cgst DECIMAL(18,2);
    v_sgst DECIMAL(18,2);
    v_igst DECIMAL(18,2);
    v_cess DECIMAL(18,2);
BEGIN
    -- Calculate sums from lines
    SELECT 
        COALESCE(SUM(price_subtotal), 0),
        COALESCE(SUM(price_tax), 0),
        COALESCE(SUM(price_total), 0),
        COALESCE(SUM(cgst_amount), 0),
        COALESCE(SUM(sgst_amount), 0),
        COALESCE(SUM(igst_amount), 0),
        COALESCE(SUM(cess_amount), 0)
    INTO v_untaxed, v_tax, v_total, v_cgst, v_sgst, v_igst, v_cess
    FROM document_lines
    WHERE document_id = COALESCE(NEW.document_id, OLD.document_id);
    
    -- Update document
    UPDATE documents
    SET 
        amount_untaxed = v_untaxed,
        amount_tax = v_tax,
        amount_total = v_total,
        cgst_amount = v_cgst,
        sgst_amount = v_sgst,
        igst_amount = v_igst,
        cess_amount = v_cess,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.document_id, OLD.document_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for document total computation
DROP TRIGGER IF EXISTS trg_compute_doc_totals ON document_lines;
CREATE TRIGGER trg_compute_doc_totals
    AFTER INSERT OR UPDATE OR DELETE ON document_lines
    FOR EACH ROW
    EXECUTE FUNCTION compute_document_totals();

-- =====================================================
-- 13. RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE crm_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE utm_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE utm_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE utm_mediums ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricelists ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Public read policies for lookup tables
DROP POLICY IF EXISTS "public_read_crm_stages" ON crm_stages;
CREATE POLICY "public_read_crm_stages" ON crm_stages FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_sales_teams" ON sales_teams;
CREATE POLICY "public_read_sales_teams" ON sales_teams FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_lost_reasons" ON lost_reasons;
CREATE POLICY "public_read_lost_reasons" ON lost_reasons FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_utm_sources" ON utm_sources;
CREATE POLICY "public_read_utm_sources" ON utm_sources FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_utm_mediums" ON utm_mediums;
CREATE POLICY "public_read_utm_mediums" ON utm_mediums FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_utm_campaigns" ON utm_campaigns;
CREATE POLICY "public_read_utm_campaigns" ON utm_campaigns FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_pricelists" ON pricelists;
CREATE POLICY "public_read_pricelists" ON pricelists FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_quote_templates" ON quote_templates;
CREATE POLICY "public_read_quote_templates" ON quote_templates FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_partner_industries" ON partner_industries;
CREATE POLICY "public_read_partner_industries" ON partner_industries FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_partner_categories" ON partner_categories;
CREATE POLICY "public_read_partner_categories" ON partner_categories FOR SELECT USING (true);

-- Leads policies
DROP POLICY IF EXISTS "public_read_leads" ON leads;
CREATE POLICY "public_read_leads" ON leads FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_write_leads" ON leads;
CREATE POLICY "public_write_leads" ON leads FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_leads" ON leads;
CREATE POLICY "public_update_leads" ON leads FOR UPDATE USING (true);

DROP POLICY IF EXISTS "public_delete_leads" ON leads;
CREATE POLICY "public_delete_leads" ON leads FOR DELETE USING (true);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
