-- Migration: 005_ergopack_schema.sql
-- Description: Ergopack India contact tracking module
-- Features: Company contacts, activity log, status tracking

-- ============================================================================
-- ERGOPACK CONTACTS TABLE
-- Tracks companies contacted by Ergopack India team
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ergopack_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  website VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'India',
  industry VARCHAR(100),
  company_size VARCHAR(50), -- small, medium, large, enterprise
  
  -- Status pipeline
  status VARCHAR(50) DEFAULT 'new',
  -- new, contacted, interested, negotiating, proposal_sent, won, lost, dormant
  
  -- Source tracking
  source VARCHAR(100), -- linkedin, exhibition, referral, cold_call, website, indiamart
  
  -- Notes and priority
  notes TEXT,
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
  
  -- Audit fields
  created_by UUID REFERENCES public.profiles(user_id),
  updated_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_ergopack_contacts_status ON public.ergopack_contacts(status);
CREATE INDEX IF NOT EXISTS idx_ergopack_contacts_city ON public.ergopack_contacts(city);
CREATE INDEX IF NOT EXISTS idx_ergopack_contacts_updated ON public.ergopack_contacts(updated_at DESC);

-- ============================================================================
-- ERGOPACK ACTIVITIES TABLE
-- Activity log for each contact (calls, emails, meetings, notes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ergopack_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.ergopack_contacts(id) ON DELETE CASCADE,
  
  -- Activity details
  activity_type VARCHAR(50) NOT NULL, -- call, email, meeting, note, status_change, follow_up
  title VARCHAR(255),
  description TEXT,
  
  -- For status changes
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  
  -- Scheduling (for follow-ups)
  scheduled_date DATE,
  completed BOOLEAN DEFAULT false,
  
  -- Audit
  created_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for timeline queries
CREATE INDEX IF NOT EXISTS idx_ergopack_activities_contact ON public.ergopack_activities(contact_id, created_at DESC);

-- ============================================================================
-- TRIGGER: Auto-update updated_at on contacts
-- ============================================================================
CREATE OR REPLACE FUNCTION update_ergopack_contact_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ergopack_contact_updated ON public.ergopack_contacts;
CREATE TRIGGER ergopack_contact_updated
  BEFORE UPDATE ON public.ergopack_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_ergopack_contact_timestamp();

-- ============================================================================
-- Add company field to profiles for multi-company access
-- ============================================================================
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS companies TEXT[] DEFAULT '{}';

-- ============================================================================
-- STATUS OPTIONS (for reference)
-- ============================================================================
COMMENT ON TABLE public.ergopack_contacts IS 'Ergopack India contact tracking - Status values: new, contacted, interested, negotiating, proposal_sent, won, lost, dormant';
COMMENT ON TABLE public.ergopack_activities IS 'Activity log for Ergopack contacts - Types: call, email, meeting, note, status_change, follow_up';
