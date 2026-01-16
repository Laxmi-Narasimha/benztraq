-- ============================================================================
-- ODOO-STYLE QUOTATION SYSTEM MIGRATION
-- Comprehensive schema matching Odoo's sale.order and sale.order.line models
-- ============================================================================

-- ============================================================================
-- PHASE 1: PAYMENT TERMS LOOKUP TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    days INTEGER DEFAULT 0,
    note TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default payment terms (Odoo-style)
INSERT INTO payment_terms (name, code, days, note) VALUES
    ('Immediate Payment', 'immediate', 0, 'Payment due immediately'),
    ('100% Advance', 'advance', 0, 'Full payment before delivery'),
    ('50% Advance', 'advance_50', 0, '50% advance, 50% on delivery'),
    ('15 Days', 'net15', 15, 'Payment due within 15 days'),
    ('30 Days', 'net30', 30, 'Payment due within 30 days'),
    ('45 Days', 'net45', 45, 'Payment due within 45 days'),
    ('60 Days', 'net60', 60, 'Payment due within 60 days'),
    ('90 Days', 'net90', 90, 'Payment due within 90 days')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- PHASE 2: INDIAN STATES LOOKUP (for fiscal position)
-- ============================================================================

CREATE TABLE IF NOT EXISTS indian_states (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    gst_code TEXT NOT NULL
);

INSERT INTO indian_states (code, name, gst_code) VALUES
    ('AN', 'Andaman and Nicobar Islands', '35'),
    ('AP', 'Andhra Pradesh', '37'),
    ('AR', 'Arunachal Pradesh', '12'),
    ('AS', 'Assam', '18'),
    ('BR', 'Bihar', '10'),
    ('CG', 'Chhattisgarh', '22'),
    ('CH', 'Chandigarh', '04'),
    ('DD', 'Dadra and Nagar Haveli and Daman and Diu', '26'),
    ('DL', 'Delhi', '07'),
    ('GA', 'Goa', '30'),
    ('GJ', 'Gujarat', '24'),
    ('HP', 'Himachal Pradesh', '02'),
    ('HR', 'Haryana', '06'),
    ('JH', 'Jharkhand', '20'),
    ('JK', 'Jammu and Kashmir', '01'),
    ('KA', 'Karnataka', '29'),
    ('KL', 'Kerala', '32'),
    ('LA', 'Ladakh', '38'),
    ('LD', 'Lakshadweep', '31'),
    ('MH', 'Maharashtra', '27'),
    ('ML', 'Meghalaya', '17'),
    ('MN', 'Manipur', '14'),
    ('MP', 'Madhya Pradesh', '23'),
    ('MZ', 'Mizoram', '15'),
    ('NL', 'Nagaland', '13'),
    ('OD', 'Odisha', '21'),
    ('PB', 'Punjab', '03'),
    ('PY', 'Puducherry', '34'),
    ('RJ', 'Rajasthan', '08'),
    ('SK', 'Sikkim', '11'),
    ('TN', 'Tamil Nadu', '33'),
    ('TS', 'Telangana', '36'),
    ('TR', 'Tripura', '16'),
    ('UK', 'Uttarakhand', '05'),
    ('UP', 'Uttar Pradesh', '09'),
    ('WB', 'West Bengal', '19')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, gst_code = EXCLUDED.gst_code;

-- ============================================================================
-- PHASE 3: ENHANCED DOCUMENTS TABLE (sale.order equivalent)
-- ============================================================================

-- Order identification (Odoo: name, origin, reference)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS name TEXT;  -- Auto-generated order number
ALTER TABLE documents ADD COLUMN IF NOT EXISTS origin TEXT;  -- Source document reference
ALTER TABLE documents ADD COLUMN IF NOT EXISTS client_order_ref TEXT;  -- Customer's reference/PO number

-- Partner/Customer fields (Odoo: partner_id, partner_invoice_id, partner_shipping_id)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES customers(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS partner_gstin TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS partner_state_code TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS invoice_address TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS shipping_address TEXT;

-- Date fields (Odoo: date_order, validity_date, commitment_date)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS date_order TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE documents ADD COLUMN IF NOT EXISTS validity_date DATE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS commitment_date DATE;  -- Expected delivery

-- Workflow state (Odoo: state)
-- draft = Quotation, sent = Quotation Sent, sale = Sales Order, done = Locked, cancel = Cancelled
ALTER TABLE documents ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'draft' 
    CHECK (state IN ('draft', 'sent', 'sale', 'done', 'cancel'));

-- Fiscal position (Odoo: fiscal_position_id) - determines IGST vs CGST/SGST
ALTER TABLE documents ADD COLUMN IF NOT EXISTS fiscal_position TEXT DEFAULT 'intrastate'
    CHECK (fiscal_position IN ('intrastate', 'interstate', 'export', 'sez'));
ALTER TABLE documents ADD COLUMN IF NOT EXISTS place_of_supply TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS company_state_code TEXT DEFAULT 'HR';  -- Haryana for Benz

-- Currency fields (Odoo: currency_id, currency_rate)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS currency_id TEXT DEFAULT 'INR';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS currency_rate NUMERIC(12,6) DEFAULT 1.000000;

-- Payment terms (Odoo: payment_term_id)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS payment_term_id UUID REFERENCES payment_terms(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS payment_term_note TEXT;

-- Financial totals (Odoo: amount_untaxed, amount_tax, amount_total)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS amount_untaxed NUMERIC(15,2) DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS amount_tax NUMERIC(15,2) DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS amount_total NUMERIC(15,2) DEFAULT 0;

-- Indian GST breakdown
ALTER TABLE documents ADD COLUMN IF NOT EXISTS cgst_total NUMERIC(15,2) DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS sgst_total NUMERIC(15,2) DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS igst_total NUMERIC(15,2) DEFAULT 0;

-- Terms and conditions (Odoo: note)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS internal_note TEXT;

-- Salesperson and team (Odoo: user_id, team_id)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS salesperson_id UUID REFERENCES auth.users(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS sales_team TEXT;

-- Tracking fields
ALTER TABLE documents ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS confirmed_by UUID REFERENCES auth.users(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

-- ============================================================================
-- PHASE 4: ENHANCED DOCUMENT_LINES TABLE (sale.order.line equivalent)
-- ============================================================================

-- Line ordering (Odoo: sequence)
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS sequence INTEGER DEFAULT 10;

-- Product information (Odoo: product_id, name, product_uom)
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS name TEXT;  -- Product description/label
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS product_uom TEXT DEFAULT 'Units';
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS hsn_code TEXT;

-- Quantities (Odoo: product_uom_qty, qty_delivered, qty_invoiced)
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS product_uom_qty NUMERIC(15,3) DEFAULT 1;
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS qty_delivered NUMERIC(15,3) DEFAULT 0;
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS qty_to_deliver NUMERIC(15,3) GENERATED ALWAYS AS (product_uom_qty - qty_delivered) STORED;
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS qty_invoiced NUMERIC(15,3) DEFAULT 0;
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS qty_to_invoice NUMERIC(15,3) GENERATED ALWAYS AS (product_uom_qty - qty_invoiced) STORED;

-- Pricing (Odoo: price_unit, discount)
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS price_unit NUMERIC(15,2) DEFAULT 0;
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS discount NUMERIC(5,2) DEFAULT 0;

-- Tax configuration (Odoo: tax_id - we store as individual rates for Indian GST)
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS gst_rate NUMERIC(5,2) DEFAULT 18;

-- Computed amounts (Odoo: price_subtotal, price_tax, price_total)
-- These are stored (not computed on-the-fly) for performance, like Odoo
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS price_subtotal NUMERIC(15,2) DEFAULT 0;
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS price_tax NUMERIC(15,2) DEFAULT 0;
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS price_total NUMERIC(15,2) DEFAULT 0;

-- GST breakdown (CGST + SGST for intrastate, IGST for interstate)
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS cgst_amount NUMERIC(15,2) DEFAULT 0;
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS sgst_amount NUMERIC(15,2) DEFAULT 0;
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS igst_amount NUMERIC(15,2) DEFAULT 0;

-- Line state tracking
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- PHASE 5: ENHANCED CUSTOMERS TABLE
-- ============================================================================

ALTER TABLE customers ADD COLUMN IF NOT EXISTS gstin TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS state_code TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS state_name TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS pan TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS billing_address TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(15,2) DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS default_payment_term_id UUID REFERENCES payment_terms(id);

-- ============================================================================
-- PHASE 6: ENHANCED PRODUCTS TABLE
-- ============================================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn_code TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS default_gst_rate NUMERIC(5,2) DEFAULT 18;
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_uom TEXT DEFAULT 'Units';
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_ok BOOLEAN DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS default_code TEXT;  -- Internal reference/SKU

-- ============================================================================
-- PHASE 7: SEQUENCE FOR ORDER NUMBERS
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS sale_order_seq START 1000;

-- Function to generate order number (like Odoo's ir.sequence)
CREATE OR REPLACE FUNCTION generate_order_number(prefix TEXT DEFAULT 'SO')
RETURNS TEXT AS $$
DECLARE
    seq_num INTEGER;
    year_part TEXT;
BEGIN
    seq_num := nextval('sale_order_seq');
    year_part := to_char(CURRENT_DATE, 'YYMM');
    RETURN prefix || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PHASE 8: TRIGGER FOR AUTO-COMPUTING LINE TOTALS
-- ============================================================================

CREATE OR REPLACE FUNCTION compute_line_amounts()
RETURNS TRIGGER AS $$
DECLARE
    base_amount NUMERIC(15,2);
    tax_amount NUMERIC(15,2);
    doc_fiscal_position TEXT;
BEGIN
    -- Get the fiscal position from the parent document
    SELECT COALESCE(fiscal_position, 'intrastate') INTO doc_fiscal_position
    FROM documents WHERE id = NEW.document_id;
    
    -- Calculate base amount after discount
    base_amount := ROUND((NEW.product_uom_qty * NEW.price_unit * (1 - COALESCE(NEW.discount, 0) / 100))::NUMERIC, 2);
    
    -- Calculate tax based on fiscal position
    IF doc_fiscal_position = 'interstate' OR doc_fiscal_position = 'export' THEN
        -- IGST only
        NEW.igst_amount := ROUND((base_amount * COALESCE(NEW.gst_rate, 18) / 100)::NUMERIC, 2);
        NEW.cgst_amount := 0;
        NEW.sgst_amount := 0;
    ELSE
        -- CGST + SGST (split equally)
        NEW.cgst_amount := ROUND((base_amount * COALESCE(NEW.gst_rate, 18) / 200)::NUMERIC, 2);
        NEW.sgst_amount := ROUND((base_amount * COALESCE(NEW.gst_rate, 18) / 200)::NUMERIC, 2);
        NEW.igst_amount := 0;
    END IF;
    
    tax_amount := NEW.cgst_amount + NEW.sgst_amount + NEW.igst_amount;
    
    NEW.price_subtotal := base_amount;
    NEW.price_tax := tax_amount;
    NEW.price_total := base_amount + tax_amount;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_compute_line_amounts ON document_lines;
CREATE TRIGGER trigger_compute_line_amounts
    BEFORE INSERT OR UPDATE OF product_uom_qty, price_unit, discount, gst_rate
    ON document_lines
    FOR EACH ROW
    EXECUTE FUNCTION compute_line_amounts();

-- ============================================================================
-- PHASE 9: TRIGGER FOR AUTO-COMPUTING DOCUMENT TOTALS
-- ============================================================================

CREATE OR REPLACE FUNCTION compute_document_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE documents SET
        amount_untaxed = COALESCE((SELECT SUM(price_subtotal) FROM document_lines WHERE document_id = NEW.document_id AND NOT COALESCE(is_cancelled, FALSE)), 0),
        amount_tax = COALESCE((SELECT SUM(price_tax) FROM document_lines WHERE document_id = NEW.document_id AND NOT COALESCE(is_cancelled, FALSE)), 0),
        amount_total = COALESCE((SELECT SUM(price_total) FROM document_lines WHERE document_id = NEW.document_id AND NOT COALESCE(is_cancelled, FALSE)), 0),
        cgst_total = COALESCE((SELECT SUM(cgst_amount) FROM document_lines WHERE document_id = NEW.document_id AND NOT COALESCE(is_cancelled, FALSE)), 0),
        sgst_total = COALESCE((SELECT SUM(sgst_amount) FROM document_lines WHERE document_id = NEW.document_id AND NOT COALESCE(is_cancelled, FALSE)), 0),
        igst_total = COALESCE((SELECT SUM(igst_amount) FROM document_lines WHERE document_id = NEW.document_id AND NOT COALESCE(is_cancelled, FALSE)), 0)
    WHERE id = NEW.document_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_compute_document_totals ON document_lines;
CREATE TRIGGER trigger_compute_document_totals
    AFTER INSERT OR UPDATE OR DELETE
    ON document_lines
    FOR EACH ROW
    EXECUTE FUNCTION compute_document_totals();

-- ============================================================================
-- PHASE 10: INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_documents_name ON documents(name);
CREATE INDEX IF NOT EXISTS idx_documents_state ON documents(state);
CREATE INDEX IF NOT EXISTS idx_documents_partner_id ON documents(partner_id);
CREATE INDEX IF NOT EXISTS idx_documents_date_order ON documents(date_order DESC);
CREATE INDEX IF NOT EXISTS idx_documents_salesperson_id ON documents(salesperson_id);

CREATE INDEX IF NOT EXISTS idx_document_lines_document_id ON document_lines(document_id);
CREATE INDEX IF NOT EXISTS idx_document_lines_product_id ON document_lines(product_id);
CREATE INDEX IF NOT EXISTS idx_document_lines_sequence ON document_lines(document_id, sequence);

CREATE INDEX IF NOT EXISTS idx_customers_gstin ON customers(gstin);
CREATE INDEX IF NOT EXISTS idx_customers_state_code ON customers(state_code);

CREATE INDEX IF NOT EXISTS idx_products_hsn_code ON products(hsn_code);

-- ============================================================================
-- PHASE 11: UPDATE EXISTING PRODUCTS WITH HSN CODES
-- ============================================================================

-- VCI products
UPDATE products SET hsn_code = '39232100', default_gst_rate = 18 
WHERE item_name ILIKE '%VCI%' AND hsn_code IS NULL;

-- PVC products
UPDATE products SET hsn_code = '39204900', default_gst_rate = 18 
WHERE item_name ILIKE '%PVC%' AND hsn_code IS NULL;

-- PE/Polyethylene products
UPDATE products SET hsn_code = '39201090', default_gst_rate = 18 
WHERE item_name ILIKE '%PE%' AND hsn_code IS NULL;

-- Default HSN for remaining
UPDATE products SET hsn_code = '39232100', default_gst_rate = 18 
WHERE hsn_code IS NULL;

-- ============================================================================
-- DONE!
-- ============================================================================
SELECT 'Odoo-style quotation system migration complete!' AS status;
