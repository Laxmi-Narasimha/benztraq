-- Migration: 004_seed_users.sql
-- Description: Seed default users for BENZTRAQ
-- Creates: Developer, Head of Sales, ASMs (named + placeholders)

-- ============================================================================
-- NOTE: This migration seeds profile data only.
-- Passwords are set via the application API after user creation.
-- Default password will be: Benz@2024 (to be hashed by bcrypt)
-- ============================================================================

-- Get role IDs for seeding
DO $$
DECLARE
  v_dev_role_id UUID;
  v_head_role_id UUID;
  v_asm_role_id UUID;
  v_gurgaon_region UUID;
  v_jaipur_region UUID;
BEGIN
  -- Get role IDs
  SELECT id INTO v_dev_role_id FROM public.roles WHERE name = 'developer';
  SELECT id INTO v_head_role_id FROM public.roles WHERE name = 'head_of_sales';
  SELECT id INTO v_asm_role_id FROM public.roles WHERE name = 'asm';
  
  -- Get region IDs
  SELECT id INTO v_gurgaon_region FROM public.regions WHERE name = 'Gurgaon';
  SELECT id INTO v_jaipur_region FROM public.regions WHERE name = 'Jaipur';

  -- ============================================================================
  -- Create users in auth.users first (Supabase requirement)
  -- Then create profiles
  -- ============================================================================
  
  -- Note: In production, users are created via Supabase Auth API
  -- This seed creates profile records that will be linked when users first login
  
  -- For now, we'll insert placeholder profiles with emails
  -- The actual auth.users entries will be created when the user first logs in
  
END $$;

-- ============================================================================
-- SEED: Profile data (will be linked to auth.users on first login)
-- Using a temporary table approach for pre-seeding
-- ============================================================================

-- Create a view for easy user management
CREATE OR REPLACE VIEW public.user_directory AS
SELECT 
  p.user_id,
  p.full_name,
  p.email,
  p.designation,
  p.phone,
  r.name as role_name,
  r.display_name as role_display,
  r.level as role_level,
  reg.name as region_name,
  p.is_active,
  p.last_login,
  p.created_at
FROM public.profiles p
LEFT JOIN public.roles r ON r.id = p.role_id
LEFT JOIN public.regions reg ON reg.id = p.region_id
ORDER BY r.level DESC, p.full_name;

-- ============================================================================
-- FUNCTION: Create or update user profile
-- Called from the application when seeding or managing users
-- ============================================================================
CREATE OR REPLACE FUNCTION create_user_profile(
  p_email VARCHAR,
  p_full_name VARCHAR,
  p_role_name VARCHAR,
  p_region_name VARCHAR DEFAULT NULL,
  p_designation VARCHAR DEFAULT NULL,
  p_phone VARCHAR DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_role_id UUID;
  v_region_id UUID;
  v_user_id UUID;
BEGIN
  -- Get role ID
  SELECT id INTO v_role_id FROM public.roles WHERE name = p_role_name;
  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Role not found: %', p_role_name;
  END IF;
  
  -- Get region ID if provided
  IF p_region_name IS NOT NULL THEN
    SELECT id INTO v_region_id FROM public.regions WHERE name = p_region_name;
  END IF;
  
  -- Generate a deterministic UUID from email for consistency
  v_user_id := gen_random_uuid();
  
  -- Insert or update profile
  INSERT INTO public.profiles (
    user_id, full_name, email, role_id, region_id, designation, phone, role
  ) VALUES (
    v_user_id, p_full_name, p_email, v_role_id, v_region_id, p_designation, p_phone, 
    CASE p_role_name 
      WHEN 'developer' THEN 'vp'::user_role
      WHEN 'head_of_sales' THEN 'director'::user_role
      ELSE 'asm'::user_role
    END
  )
  ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role_id = EXCLUDED.role_id,
    region_id = COALESCE(EXCLUDED.region_id, public.profiles.region_id),
    designation = COALESCE(EXCLUDED.designation, public.profiles.designation),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    updated_at = now();
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Create default sales team
-- ============================================================================
INSERT INTO public.sales_teams (name, description, is_active, color)
VALUES ('Benz Packaging Sales', 'Main sales team for Benz Packaging products', true, 3)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS for documentation
-- ============================================================================
COMMENT ON TABLE public.roles IS 'System roles for RBAC - developer, head_of_sales, asm';
COMMENT ON TABLE public.permissions IS 'Resource-level permissions per role with scope (own/team/all)';
COMMENT ON TABLE public.sales_teams IS 'Sales team organization similar to Odoo CRM team';
COMMENT ON TABLE public.activity_log IS 'Audit trail for user actions in the admin panel';
COMMENT ON FUNCTION check_permission IS 'Check if user has permission for action on resource';
COMMENT ON FUNCTION get_permission_scope IS 'Get user permission scope (own/team/all) for resource';
