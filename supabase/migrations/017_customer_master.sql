-- Migration 017: Enhanced Customer Master Schema
-- Enhanced customer management with addresses, contacts, and engagement metrics

-- =============================================================================
-- SECTION 1: Customer Groups
-- =============================================================================
CREATE TABLE IF NOT EXISTS customer_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    parent_id UUID REFERENCES customer_groups(id) ON DELETE SET NULL,
    is_group BOOLEAN DEFAULT false,
    default_price_list_id UUID REFERENCES price_lists(id) ON DELETE SET NULL,
    default_payment_terms VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- SECTION 2: Industries
-- =============================================================================
CREATE TABLE IF NOT EXISTS industries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed common industries
INSERT INTO industries (name, description) VALUES
('Automotive', 'Automobile and auto parts manufacturing'),
('Pharmaceutical', 'Pharmaceutical and healthcare'),
('Electronics', 'Electronics and electrical equipment'),
('Machinery', 'Industrial machinery and equipment'),
('FMCG', 'Fast-moving consumer goods'),
('Textiles', 'Textiles and apparel'),
('Aerospace', 'Aerospace and defense'),
('Food Processing', 'Food and beverage processing'),
('Chemical', 'Chemical manufacturing'),
('Steel', 'Steel and metal products')
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- SECTION 3: Enhanced Customers Table
-- =============================================================================

-- First, check if customers table exists and add new columns
DO $$
BEGIN
    -- Add new columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'customer_code') THEN
        ALTER TABLE customers ADD COLUMN customer_code VARCHAR(20) UNIQUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'naming_series') THEN
        ALTER TABLE customers ADD COLUMN naming_series VARCHAR(50) DEFAULT 'CUST-.#####';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'customer_type') THEN
        ALTER TABLE customers ADD COLUMN customer_type VARCHAR(50) DEFAULT 'Company';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'customer_group_id') THEN
        ALTER TABLE customers ADD COLUMN customer_group_id UUID REFERENCES customer_groups(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'industry_id') THEN
        ALTER TABLE customers ADD COLUMN industry_id UUID REFERENCES industries(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'gstin') THEN
        ALTER TABLE customers ADD COLUMN gstin VARCHAR(15);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'pan') THEN
        ALTER TABLE customers ADD COLUMN pan VARCHAR(10);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'tax_category') THEN
        ALTER TABLE customers ADD COLUMN tax_category VARCHAR(50) DEFAULT 'Regular';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'is_sez') THEN
        ALTER TABLE customers ADD COLUMN is_sez BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'credit_limit') THEN
        ALTER TABLE customers ADD COLUMN credit_limit DECIMAL(15,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'credit_days') THEN
        ALTER TABLE customers ADD COLUMN credit_days INTEGER DEFAULT 30;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'account_manager_id') THEN
        ALTER TABLE customers ADD COLUMN account_manager_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'sales_team') THEN
        ALTER TABLE customers ADD COLUMN sales_team JSONB DEFAULT '[]';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'status') THEN
        ALTER TABLE customers ADD COLUMN status VARCHAR(50) DEFAULT 'Active';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'disabled') THEN
        ALTER TABLE customers ADD COLUMN disabled BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'first_order_date') THEN
        ALTER TABLE customers ADD COLUMN first_order_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'last_order_date') THEN
        ALTER TABLE customers ADD COLUMN last_order_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'total_orders') THEN
        ALTER TABLE customers ADD COLUMN total_orders INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'total_revenue') THEN
        ALTER TABLE customers ADD COLUMN total_revenue DECIMAL(15,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'outstanding_amount') THEN
        ALTER TABLE customers ADD COLUMN outstanding_amount DECIMAL(15,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'custom_fields') THEN
        ALTER TABLE customers ADD COLUMN custom_fields JSONB DEFAULT '{}';
    END IF;
END $$;

-- =============================================================================
-- SECTION 4: Customer Addresses
-- =============================================================================
CREATE TABLE IF NOT EXISTS customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    address_title VARCHAR(100),
    address_type VARCHAR(50) DEFAULT 'Billing',
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    state_code VARCHAR(2),
    pincode VARCHAR(10),
    country VARCHAR(100) DEFAULT 'India',
    gstin VARCHAR(15),
    is_primary_address BOOLEAN DEFAULT false,
    is_shipping_address BOOLEAN DEFAULT false,
    phone VARCHAR(20),
    email_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customer_addresses_customer ON customer_addresses(customer_id);
CREATE INDEX idx_customer_addresses_primary ON customer_addresses(customer_id, is_primary_address);

-- =============================================================================
-- SECTION 5: Customer Contacts
-- =============================================================================
CREATE TABLE IF NOT EXISTS customer_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    salutation VARCHAR(10),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    designation VARCHAR(100),
    department VARCHAR(100),
    email_id VARCHAR(255),
    phone VARCHAR(20),
    mobile_no VARCHAR(20),
    is_primary_contact BOOLEAN DEFAULT false,
    is_billing_contact BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customer_contacts_customer ON customer_contacts(customer_id);
CREATE INDEX idx_customer_contacts_primary ON customer_contacts(customer_id, is_primary_contact);

-- =============================================================================
-- SECTION 6: Customer Groups Seed Data
-- =============================================================================
INSERT INTO customer_groups (name, is_group, default_payment_terms) VALUES
('All Customer Groups', true, 'Net 30'),
('OEM', false, 'Net 45'),
('Tier 1 Suppliers', false, 'Net 30'),
('Tier 2 Suppliers', false, 'Net 30'),
('Distributors', false, 'Net 15'),
('Direct Customers', false, 'Net 30'),
('Export Customers', false, 'Advance Payment'),
('Government', false, 'Net 60')
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- SECTION 7: GST State Codes
-- =============================================================================
CREATE TABLE IF NOT EXISTS gst_state_codes (
    state_code VARCHAR(2) PRIMARY KEY,
    state_name VARCHAR(100) NOT NULL UNIQUE,
    is_ut BOOLEAN DEFAULT false
);

INSERT INTO gst_state_codes (state_code, state_name, is_ut) VALUES
('01', 'Jammu and Kashmir', true),
('02', 'Himachal Pradesh', false),
('03', 'Punjab', false),
('04', 'Chandigarh', true),
('05', 'Uttarakhand', false),
('06', 'Haryana', false),
('07', 'Delhi', true),
('08', 'Rajasthan', false),
('09', 'Uttar Pradesh', false),
('10', 'Bihar', false),
('11', 'Sikkim', false),
('12', 'Arunachal Pradesh', false),
('13', 'Nagaland', false),
('14', 'Manipur', false),
('15', 'Mizoram', false),
('16', 'Tripura', false),
('17', 'Meghalaya', false),
('18', 'Assam', false),
('19', 'West Bengal', false),
('20', 'Jharkhand', false),
('21', 'Odisha', false),
('22', 'Chhattisgarh', false),
('23', 'Madhya Pradesh', false),
('24', 'Gujarat', false),
('26', 'Dadra and Nagar Haveli', true),
('27', 'Maharashtra', false),
('29', 'Karnataka', false),
('30', 'Goa', false),
('31', 'Lakshadweep', true),
('32', 'Kerala', false),
('33', 'Tamil Nadu', false),
('34', 'Puducherry', true),
('35', 'Andaman and Nicobar Islands', true),
('36', 'Telangana', false),
('37', 'Andhra Pradesh', false)
ON CONFLICT (state_code) DO NOTHING;

-- =============================================================================
-- SECTION 8: Create indexes for customers table new columns
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_group ON customers(customer_group_id);
CREATE INDEX IF NOT EXISTS idx_customers_industry ON customers(industry_id);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_account_manager ON customers(account_manager_id);
