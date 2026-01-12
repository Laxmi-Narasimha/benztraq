-- Migration: Enhanced Quotation System
-- Adds fields for professional quotations matching Odoo format
-- Version: 2.0 - Complete system integration

-- ============================================================================
-- DOCUMENTS TABLE ENHANCEMENTS
-- ============================================================================

ALTER TABLE documents ADD COLUMN IF NOT EXISTS quotation_number TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT '100% Advance';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS validity_days INTEGER DEFAULT 15;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS country_of_supply TEXT DEFAULT 'India';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS place_of_supply TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS authorized_signatory TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS subtotal NUMERIC(15,2) DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS cgst_total NUMERIC(15,2) DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS sgst_total NUMERIC(15,2) DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS igst_total NUMERIC(15,2) DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS customer_address TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS customer_gstin TEXT;

-- ============================================================================
-- DOCUMENT_LINES TABLE ENHANCEMENTS
-- ============================================================================

ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS line_number INTEGER DEFAULT 1;
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS hsn_code TEXT;
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS gst_rate NUMERIC(5,2) DEFAULT 18;
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS base_amount NUMERIC(15,2) DEFAULT 0;
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS cgst_amount NUMERIC(15,2) DEFAULT 0;
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS sgst_amount NUMERIC(15,2) DEFAULT 0;
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS igst_amount NUMERIC(15,2) DEFAULT 0;
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS line_total NUMERIC(15,2) DEFAULT 0;
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS product_description TEXT;
ALTER TABLE document_lines ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

-- ============================================================================
-- PRODUCTS TABLE ENHANCEMENTS (HSN codes)
-- ============================================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn_code TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS default_gst_rate NUMERIC(5,2) DEFAULT 18;

-- ============================================================================
-- CUSTOMERS TABLE ENHANCEMENTS
-- ============================================================================

ALTER TABLE customers ADD COLUMN IF NOT EXISTS gstin TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS billing_address TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(15,2) DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT '100% Advance';

-- ============================================================================
-- NOTIFICATIONS TABLE (Create if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'info',
    title TEXT NOT NULL,
    message TEXT,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notifications
CREATE POLICY IF NOT EXISTS "Users can view own notifications" 
    ON notifications FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own notifications" 
    ON notifications FOR UPDATE 
    USING (auth.uid() = user_id);

-- Service role can insert notifications for any user
CREATE POLICY IF NOT EXISTS "Service role can insert notifications" 
    ON notifications FOR INSERT 
    WITH CHECK (TRUE);

-- ============================================================================
-- UPDATE EXISTING PRODUCTS WITH COMMON HSN CODES
-- ============================================================================

-- VCI products typically use HSN 39232100
UPDATE products SET hsn_code = '39232100' WHERE item_name ILIKE '%VCI%' AND hsn_code IS NULL;

-- PVC products
UPDATE products SET hsn_code = '39204900' WHERE item_name ILIKE '%PVC%' AND hsn_code IS NULL;

-- PE Films
UPDATE products SET hsn_code = '39201090' WHERE item_name ILIKE '%PE%' AND hsn_code IS NULL;

-- General packaging - cartons
UPDATE products SET hsn_code = '48192000' WHERE item_name ILIKE '%carton%' AND hsn_code IS NULL;

-- Default for remaining
UPDATE products SET hsn_code = '39232100' WHERE hsn_code IS NULL;

-- ============================================================================
-- HELPER FUNCTION: Number to Words (Indian format)
-- ============================================================================

CREATE OR REPLACE FUNCTION number_to_words_indian(amount NUMERIC)
RETURNS TEXT AS $$
DECLARE
    crore BIGINT;
    lakh BIGINT;
    thousand BIGINT;
    hundred BIGINT;
    remainder BIGINT;
    result TEXT := '';
    ones TEXT[] := ARRAY['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
                          'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
                          'Seventeen', 'Eighteen', 'Nineteen'];
    tens TEXT[] := ARRAY['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
BEGIN
    IF amount IS NULL OR amount = 0 THEN
        RETURN 'Zero Rupees Only';
    END IF;
    
    crore := FLOOR(amount / 10000000);
    lakh := FLOOR((amount::BIGINT % 10000000) / 100000);
    thousand := FLOOR((amount::BIGINT % 100000) / 1000);
    hundred := FLOOR((amount::BIGINT % 1000) / 100);
    remainder := amount::BIGINT % 100;
    
    IF crore > 0 THEN
        IF crore < 20 THEN result := result || ones[crore + 1] || ' Crore ';
        ELSE result := result || tens[FLOOR(crore / 10) + 1] || ' ' || ones[(crore % 10) + 1] || ' Crore ';
        END IF;
    END IF;
    
    IF lakh > 0 THEN
        IF lakh < 20 THEN result := result || ones[lakh + 1] || ' Lakh ';
        ELSE result := result || tens[FLOOR(lakh / 10) + 1] || ' ' || ones[(lakh % 10) + 1] || ' Lakh ';
        END IF;
    END IF;
    
    IF thousand > 0 THEN
        IF thousand < 20 THEN result := result || ones[thousand + 1] || ' Thousand ';
        ELSE result := result || tens[FLOOR(thousand / 10) + 1] || ' ' || ones[(thousand % 10) + 1] || ' Thousand ';
        END IF;
    END IF;
    
    IF hundred > 0 THEN
        result := result || ones[hundred + 1] || ' Hundred ';
    END IF;
    
    IF remainder > 0 THEN
        IF remainder < 20 THEN result := result || ones[remainder + 1] || ' ';
        ELSE result := result || tens[FLOOR(remainder / 10) + 1] || ' ' || ones[(remainder % 10) + 1] || ' ';
        END IF;
    END IF;
    
    RETURN TRIM(result) || ' Rupees Only';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- VIEWS FOR REPORTING
-- ============================================================================

-- Quotation summary view
CREATE OR REPLACE VIEW quotation_summary AS
SELECT 
    d.id,
    d.doc_number,
    d.quotation_number,
    d.doc_date,
    d.customer_name_raw AS customer_name,
    d.customer_gstin,
    d.subtotal,
    d.cgst_total,
    d.sgst_total,
    d.grand_total,
    d.status,
    p.full_name AS salesperson_name,
    d.created_at
FROM documents d
LEFT JOIN profiles p ON d.salesperson_user_id = p.user_id
WHERE d.doc_type = 'quotation'
ORDER BY d.created_at DESC;

-- Sales order summary view
CREATE OR REPLACE VIEW sales_order_summary AS
SELECT 
    d.id,
    d.doc_number,
    d.doc_date,
    d.customer_name_raw AS customer_name,
    d.customer_gstin,
    d.subtotal,
    d.cgst_total,
    d.sgst_total,
    d.grand_total,
    d.status,
    p.full_name AS salesperson_name,
    d.created_at
FROM documents d
LEFT JOIN profiles p ON d.salesperson_user_id = p.user_id
WHERE d.doc_type = 'sales_order'
ORDER BY d.created_at DESC;

-- ============================================================================
-- NOTIFY POSTGREST TO RELOAD SCHEMA
-- ============================================================================

NOTIFY pgrst, 'reload schema';

-- Done!
SELECT 'Enhanced quotation system migration complete' AS status;
