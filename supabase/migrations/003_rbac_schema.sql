-- Migration: 003_rbac_schema.sql
-- Description: Role-Based Access Control for BENZTRAQ
-- Adds: roles, permissions tables, updates profiles, seeds default users

-- ============================================================================
-- TABLE: roles
-- System roles for access control (inspired by Odoo's res.groups)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  level INTEGER NOT NULL DEFAULT 0, -- Higher = more permissions (10=dev, 5=head, 1=asm)
  is_system BOOLEAN DEFAULT false,  -- Cannot be deleted if true
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TABLE: permissions
-- Resource-level permissions per role (inspired by Odoo's ir.model.access)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  resource VARCHAR(100) NOT NULL, -- 'users', 'documents', 'leads', etc.
  can_read BOOLEAN DEFAULT false,
  can_write BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  scope VARCHAR(20) DEFAULT 'own', -- 'own', 'team', 'all'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role_id, resource)
);

-- ============================================================================
-- UPDATE: profiles table
-- Add new columns for auth and role assignment
-- ============================================================================
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS designation VARCHAR(100),
  ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.profiles(user_id),
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ============================================================================
-- TABLE: sales_teams
-- Sales team organization (inspired by Odoo's crm.team)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sales_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  leader_id UUID REFERENCES public.profiles(user_id),
  region_id UUID REFERENCES public.regions(id),
  is_active BOOLEAN DEFAULT true,
  color INTEGER DEFAULT 1,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TABLE: team_members
-- Junction table for team membership
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.sales_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- ============================================================================
-- TABLE: activity_log
-- Audit trail for admin actions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(user_id),
  action VARCHAR(50) NOT NULL, -- 'login', 'logout', 'create_user', etc.
  resource_type VARCHAR(50),
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user ON public.activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON public.activity_log(action, created_at DESC);

-- ============================================================================
-- SEED: Default Roles
-- ============================================================================
INSERT INTO public.roles (name, display_name, description, level, is_system) VALUES
  ('developer', 'Developer', 'Full system access - can manage users, roles, and all settings', 10, true),
  ('head_of_sales', 'Head of Sales', 'View all team performance and aggregate data, manage ASMs', 5, true),
  ('asm', 'Area Sales Manager', 'Manage own leads, quotations, sales orders, and customers', 1, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SEED: Permissions for each role
-- ============================================================================

-- Developer: Full access to ALL resources with 'all' scope
INSERT INTO public.permissions (role_id, resource, can_read, can_write, can_create, can_delete, scope)
SELECT r.id, res.name, true, true, true, true, 'all'
FROM public.roles r
CROSS JOIN (VALUES 
  ('users'), ('roles'), ('permissions'), ('documents'), ('leads'), 
  ('quotations'), ('sales_orders'), ('customers'), ('teams'), 
  ('targets'), ('reports'), ('settings'), ('activity_log')
) AS res(name)
WHERE r.name = 'developer'
ON CONFLICT (role_id, resource) DO NOTHING;

-- Head of Sales: Read all, write team data
INSERT INTO public.permissions (role_id, resource, can_read, can_write, can_create, can_delete, scope)
SELECT r.id, res.resource, res.can_read, res.can_write, res.can_create, res.can_delete, res.scope
FROM public.roles r
CROSS JOIN (VALUES 
  ('users', true, false, false, false, 'team'),
  ('documents', true, true, true, false, 'team'),
  ('leads', true, true, true, false, 'team'),
  ('quotations', true, true, true, false, 'team'),
  ('sales_orders', true, true, true, false, 'team'),
  ('customers', true, true, true, false, 'all'),
  ('teams', true, false, false, false, 'team'),
  ('targets', true, true, false, false, 'team'),
  ('reports', true, false, false, false, 'team')
) AS res(resource, can_read, can_write, can_create, can_delete, scope)
WHERE r.name = 'head_of_sales'
ON CONFLICT (role_id, resource) DO NOTHING;

-- ASM: Own data only
INSERT INTO public.permissions (role_id, resource, can_read, can_write, can_create, can_delete, scope)
SELECT r.id, res.resource, res.can_read, res.can_write, res.can_create, res.can_delete, res.scope
FROM public.roles r
CROSS JOIN (VALUES 
  ('documents', true, true, true, false, 'own'),
  ('leads', true, true, true, false, 'own'),
  ('quotations', true, true, true, false, 'own'),
  ('sales_orders', true, true, true, false, 'own'),
  ('customers', true, true, true, false, 'own'),
  ('targets', true, false, false, false, 'own'),
  ('reports', true, false, false, false, 'own')
) AS res(resource, can_read, can_write, can_create, can_delete, scope)
WHERE r.name = 'asm'
ON CONFLICT (role_id, resource) DO NOTHING;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check user permission for a resource
CREATE OR REPLACE FUNCTION check_permission(
  p_user_id UUID,
  p_resource VARCHAR,
  p_action VARCHAR -- 'read', 'write', 'create', 'delete'
) RETURNS BOOLEAN AS $$
DECLARE
  v_has_permission BOOLEAN;
BEGIN
  SELECT 
    CASE p_action
      WHEN 'read' THEN perm.can_read
      WHEN 'write' THEN perm.can_write
      WHEN 'create' THEN perm.can_create
      WHEN 'delete' THEN perm.can_delete
      ELSE false
    END INTO v_has_permission
  FROM public.profiles prof
  JOIN public.permissions perm ON perm.role_id = prof.role_id
  WHERE prof.user_id = p_user_id
    AND perm.resource = p_resource
    AND prof.is_active = true;
  
  RETURN COALESCE(v_has_permission, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's permission scope for a resource
CREATE OR REPLACE FUNCTION get_permission_scope(
  p_user_id UUID,
  p_resource VARCHAR
) RETURNS VARCHAR AS $$
DECLARE
  v_scope VARCHAR;
BEGIN
  SELECT perm.scope INTO v_scope
  FROM public.profiles prof
  JOIN public.permissions perm ON perm.role_id = prof.role_id
  WHERE prof.user_id = p_user_id
    AND perm.resource = p_resource
    AND prof.is_active = true;
  
  RETURN COALESCE(v_scope, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at for roles
CREATE TRIGGER roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Update updated_at for sales_teams
CREATE TRIGGER sales_teams_updated_at
  BEFORE UPDATE ON public.sales_teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
