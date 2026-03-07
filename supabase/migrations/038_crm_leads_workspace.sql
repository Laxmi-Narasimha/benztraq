-- CRM Leads Workspace Schema
-- Stores leads tracked by CRM team (replacing Google Sheet)

-- ============================================================================
-- 1. CRM Leads Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS crm_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sr_no SERIAL,
    company TEXT NOT NULL,
    contact_name TEXT,
    product TEXT,
    phone TEXT,
    email TEXT,
    location TEXT,
    country TEXT DEFAULT 'Domestic',
    status TEXT DEFAULT 'In Discussion',
    remarks TEXT,
    source_tab TEXT DEFAULT 'General',  -- Which tab: Isha, Preeti, Shikha, Ergopack etc.
    assigned_to UUID REFERENCES auth.users(id),
    assigned_to_name TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_crm_leads_assigned ON crm_leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_source ON crm_leads(source_tab);
CREATE INDEX IF NOT EXISTS idx_crm_leads_company ON crm_leads(company);

-- ============================================================================
-- 2. CRM Lead Activities / Audit Log
-- ============================================================================
CREATE TABLE IF NOT EXISTS crm_lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES crm_leads(id) ON DELETE CASCADE,
    activity_type TEXT DEFAULT 'note',  -- note, call, email, meeting, status_change, edit
    content TEXT NOT NULL,
    old_value TEXT,       -- for edits: what it was before
    new_value TEXT,       -- for edits: what it changed to
    field_name TEXT,      -- for edits: which field was changed
    activity_date DATE DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES auth.users(id),
    created_by_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_activities_lead ON crm_lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_type ON crm_lead_activities(activity_type);

-- ============================================================================
-- 3. RLS Policies (all CRM users can see/edit all leads)
-- ============================================================================
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_lead_activities ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read all leads
CREATE POLICY crm_leads_select ON crm_leads FOR SELECT USING (true);
CREATE POLICY crm_leads_insert ON crm_leads FOR INSERT WITH CHECK (true);
CREATE POLICY crm_leads_update ON crm_leads FOR UPDATE USING (true);
CREATE POLICY crm_leads_delete ON crm_leads FOR DELETE USING (true);

CREATE POLICY crm_activities_select ON crm_lead_activities FOR SELECT USING (true);
CREATE POLICY crm_activities_insert ON crm_lead_activities FOR INSERT WITH CHECK (true);
