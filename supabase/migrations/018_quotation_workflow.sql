-- Migration 018: Quotation and Sales Workflow Schema
-- Creates quotations, sales_orders, invoices tables with items

-- =============================================================================
-- STEP 1: Payment Terms Templates
-- =============================================================================
CREATE TABLE IF NOT EXISTS payment_terms_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    terms JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO payment_terms_templates (name, description, terms) VALUES
('Net 30', 'Payment due in 30 days', '[{"due_days": 30, "percentage": 100}]'),
('Net 45', 'Payment due in 45 days', '[{"due_days": 45, "percentage": 100}]'),
('Net 60', 'Payment due in 60 days', '[{"due_days": 60, "percentage": 100}]'),
('50% Advance', '50% advance, 50% on delivery', '[{"due_days": 0, "percentage": 50}, {"due_days": 7, "percentage": 50}]'),
('100% Advance', 'Full payment in advance', '[{"due_days": 0, "percentage": 100}]')
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- STEP 2: Create Quotations Table (fresh)
-- =============================================================================
DROP TABLE IF EXISTS quotation_items CASCADE;
DROP TABLE IF EXISTS quotations CASCADE;

CREATE TABLE quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Number and Series
    quotation_number VARCHAR(50) UNIQUE,
    naming_series VARCHAR(50) DEFAULT 'QTN-.YYYY.-.#####',
    revision INTEGER DEFAULT 1,
    
    -- Dates
    doc_date DATE DEFAULT CURRENT_DATE,
    valid_until DATE,
    
    -- Customer
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    billing_address_id UUID,
    shipping_address_id UUID,
    contact_id UUID,
    
    -- Pricing
    currency VARCHAR(3) DEFAULT 'INR',
    exchange_rate DECIMAL(10,4) DEFAULT 1,
    price_list_id UUID REFERENCES price_lists(id) ON DELETE SET NULL,
    
    -- Totals
    total_qty DECIMAL(15,4) DEFAULT 0,
    base_total DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    net_total DECIMAL(15,2) DEFAULT 0,
    total_taxes DECIMAL(15,2) DEFAULT 0,
    grand_total DECIMAL(15,2) DEFAULT 0,
    rounded_total DECIMAL(15,2) DEFAULT 0,
    
    -- GST Details
    place_of_supply VARCHAR(100),
    company_gstin VARCHAR(15),
    customer_gstin VARCHAR(15),
    is_reverse_charge BOOLEAN DEFAULT false,
    
    -- Status and Workflow
    status VARCHAR(50) DEFAULT 'Draft',
    workflow_state VARCHAR(50) DEFAULT 'Draft',
    converted_to_order BOOLEAN DEFAULT false,
    sales_order_id UUID,
    
    -- Assignment
    assigned_to UUID,
    region_id UUID REFERENCES regions(id) ON DELETE SET NULL,
    
    -- Terms
    terms_and_conditions TEXT,
    payment_terms_id UUID REFERENCES payment_terms_templates(id) ON DELETE SET NULL,
    remarks TEXT,
    
    -- Metadata
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quotations_number ON quotations(quotation_number);
CREATE INDEX idx_quotations_customer ON quotations(customer_id);
CREATE INDEX idx_quotations_status ON quotations(status);

-- =============================================================================
-- STEP 3: Quotation Items Table
-- =============================================================================
CREATE TABLE quotation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    
    -- Item reference
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    item_code VARCHAR(50),
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Quantity
    qty DECIMAL(15,4) NOT NULL DEFAULT 1,
    uom VARCHAR(20) NOT NULL DEFAULT 'Nos',
    conversion_factor DECIMAL(15,6) DEFAULT 1,
    stock_qty DECIMAL(15,4),
    stock_uom VARCHAR(20),
    
    -- Pricing
    price_list_rate DECIMAL(15,2) DEFAULT 0,
    rate DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    amount DECIMAL(15,2) DEFAULT 0,
    
    -- Tax (GST)
    hsn_sac_code VARCHAR(10),
    gst_rate DECIMAL(5,2) DEFAULT 18.00,
    cgst_rate DECIMAL(5,2),
    cgst_amount DECIMAL(15,2) DEFAULT 0,
    sgst_rate DECIMAL(5,2),
    sgst_amount DECIMAL(15,2) DEFAULT 0,
    igst_rate DECIMAL(5,2),
    igst_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quotation_items_quotation ON quotation_items(quotation_id);
CREATE INDEX idx_quotation_items_product ON quotation_items(product_id);

-- =============================================================================
-- STEP 4: Create Sales Orders Table (fresh)
-- =============================================================================
DROP TABLE IF EXISTS sales_order_items CASCADE;
DROP TABLE IF EXISTS sales_orders CASCADE;

CREATE TABLE sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Number and Series
    order_number VARCHAR(50) UNIQUE,
    naming_series VARCHAR(50) DEFAULT 'SO-.YYYY.-.#####',
    
    -- Dates
    doc_date DATE DEFAULT CURRENT_DATE,
    delivery_date DATE,
    
    -- References
    quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL,
    po_number VARCHAR(100),
    po_date DATE,
    
    -- Customer
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    billing_address_id UUID,
    shipping_address_id UUID,
    
    -- Totals
    total_qty DECIMAL(15,4) DEFAULT 0,
    grand_total DECIMAL(15,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(50) DEFAULT 'Draft',
    delivery_status VARCHAR(50) DEFAULT 'Not Delivered',
    billing_status VARCHAR(50) DEFAULT 'Not Billed',
    per_delivered DECIMAL(5,2) DEFAULT 0,
    per_billed DECIMAL(5,2) DEFAULT 0,
    
    -- Assignment
    assigned_to UUID,
    region_id UUID REFERENCES regions(id) ON DELETE SET NULL,
    
    -- Metadata
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sales_orders_number ON sales_orders(order_number);
CREATE INDEX idx_sales_orders_customer ON sales_orders(customer_id);

-- =============================================================================
-- STEP 5: Sales Order Items Table
-- =============================================================================
CREATE TABLE sales_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    quotation_item_id UUID REFERENCES quotation_items(id) ON DELETE SET NULL,
    
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    item_code VARCHAR(50),
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    qty DECIMAL(15,4) NOT NULL DEFAULT 1,
    uom VARCHAR(20) NOT NULL DEFAULT 'Nos',
    rate DECIMAL(15,2) NOT NULL DEFAULT 0,
    amount DECIMAL(15,2) DEFAULT 0,
    
    hsn_sac_code VARCHAR(10),
    gst_rate DECIMAL(5,2) DEFAULT 18.00,
    cgst_amount DECIMAL(15,2) DEFAULT 0,
    sgst_amount DECIMAL(15,2) DEFAULT 0,
    igst_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    
    delivered_qty DECIMAL(15,4) DEFAULT 0,
    billed_qty DECIMAL(15,4) DEFAULT 0,
    
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sales_order_items_order ON sales_order_items(sales_order_id);

-- =============================================================================
-- STEP 6: Create Invoices Table (fresh)
-- =============================================================================
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Number and Series
    invoice_number VARCHAR(50) UNIQUE,
    naming_series VARCHAR(50) DEFAULT 'INV-.YYYY.-.#####',
    
    -- Dates
    doc_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    
    -- References
    sales_order_id UUID REFERENCES sales_orders(id) ON DELETE SET NULL,
    
    -- Customer
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    
    -- Totals
    grand_total DECIMAL(15,2) DEFAULT 0,
    
    -- E-Invoice (GST)
    irn VARCHAR(100),
    ack_number VARCHAR(50),
    einvoice_status VARCHAR(50),
    eway_bill_number VARCHAR(50),
    
    -- Payment
    status VARCHAR(50) DEFAULT 'Draft',
    payment_status VARCHAR(50) DEFAULT 'Unpaid',
    outstanding_amount DECIMAL(15,2) DEFAULT 0,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    
    -- Metadata
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);

-- =============================================================================
-- STEP 7: Invoice Items Table
-- =============================================================================
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    sales_order_item_id UUID REFERENCES sales_order_items(id) ON DELETE SET NULL,
    
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    item_code VARCHAR(50),
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    qty DECIMAL(15,4) NOT NULL DEFAULT 1,
    uom VARCHAR(20) NOT NULL DEFAULT 'Nos',
    rate DECIMAL(15,2) NOT NULL DEFAULT 0,
    amount DECIMAL(15,2) DEFAULT 0,
    
    hsn_sac_code VARCHAR(10),
    gst_rate DECIMAL(5,2) DEFAULT 18.00,
    cgst_amount DECIMAL(15,2) DEFAULT 0,
    sgst_amount DECIMAL(15,2) DEFAULT 0,
    igst_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

-- =============================================================================
-- STEP 8: Terms Templates
-- =============================================================================
CREATE TABLE IF NOT EXISTS terms_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    terms TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    applicable_for VARCHAR(50) DEFAULT 'All',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO terms_templates (name, terms, is_default, applicable_for) VALUES
('Standard Terms', E'1. Prices are valid for 30 days from quotation date.\n2. Delivery within 2-3 weeks from order confirmation.\n3. Payment as per agreed terms.\n4. All disputes subject to Indore jurisdiction.', true, 'Quotation'),
('Export Terms', E'1. FOB Indore / CIF as agreed.\n2. Payment by LC or advance.\n3. Delivery 4-6 weeks from LC receipt.\n4. Freight and insurance as per agreement.', false, 'Quotation')
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- DONE!
-- =============================================================================
