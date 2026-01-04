-- Migration: 007_ergopack_activity_tracking.sql
-- Description: Add activity seen tracking for notifications

-- ============================================================================
-- ACTIVITY SEEN TABLE
-- Tracks which users have seen which activities
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ergopack_activity_seen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.ergopack_activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  seen_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unique constraint - one record per user per activity
  UNIQUE(activity_id, user_id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_ergopack_activity_seen_user ON public.ergopack_activity_seen(user_id);
CREATE INDEX IF NOT EXISTS idx_ergopack_activity_seen_activity ON public.ergopack_activity_seen(activity_id);

-- ============================================================================
-- VIEW: Contacts with latest activity info
-- ============================================================================
CREATE OR REPLACE VIEW public.ergopack_contacts_with_activity AS
SELECT 
  c.*,
  -- Creator info
  creator.full_name as created_by_name,
  -- Updater info
  updater.full_name as updated_by_name,
  -- Latest activity
  latest_act.activity_type as latest_activity_type,
  latest_act.id as latest_activity_id,
  latest_act.created_at as latest_activity_at,
  latest_act.created_by as latest_activity_by,
  activity_creator.full_name as latest_activity_by_name
FROM public.ergopack_contacts c
LEFT JOIN public.profiles creator ON c.created_by = creator.user_id
LEFT JOIN public.profiles updater ON c.updated_by = updater.user_id
LEFT JOIN LATERAL (
  SELECT * FROM public.ergopack_activities 
  WHERE contact_id = c.id 
  ORDER BY created_at DESC 
  LIMIT 1
) latest_act ON true
LEFT JOIN public.profiles activity_creator ON latest_act.created_by = activity_creator.user_id;

-- Grant access
GRANT SELECT ON public.ergopack_contacts_with_activity TO authenticated;
GRANT ALL ON public.ergopack_activity_seen TO authenticated;
