-- Migration: 034b_inventory_store_user.sql
-- Description: Create store manager profile and permissions
-- MUST be run AFTER 034_inventory_module.sql has been committed
-- (PostgreSQL requires new enum values to be committed before use)

-- ============================================================================
-- STEP 1: Create store manager user profile
-- ============================================================================
DO $$
DECLARE
  v_store_role_id UUID;
  v_user_id UUID;
BEGIN
  SELECT id INTO v_store_role_id FROM public.roles WHERE name = 'store_manager';
  v_user_id := gen_random_uuid();

  INSERT INTO public.profiles (
    user_id, full_name, email, role_id, role, is_active, organization, companies
  ) VALUES (
    v_user_id,
    'Store Manager',
    'store@benz-packaging.com',
    v_store_role_id,
    'store_manager'::user_role,
    true,
    'benz_packaging',
    ARRAY['benz']
  )
  ON CONFLICT (email) DO UPDATE SET
    role_id = EXCLUDED.role_id,
    role = EXCLUDED.role,
    is_active = true,
    updated_at = now();
END $$;

-- ============================================================================
-- STEP 2: Add permissions for store_manager role
-- ============================================================================
DO $$
DECLARE
  v_store_role_id UUID;
BEGIN
  SELECT id INTO v_store_role_id FROM public.roles WHERE name = 'store_manager';
  
  INSERT INTO public.permissions (role_id, resource, can_read, can_write, can_create, can_delete, scope)
  VALUES 
    (v_store_role_id, 'inventory', true, true, true, false, 'all'),
    (v_store_role_id, 'dashboard', true, false, false, false, 'own'),
    (v_store_role_id, 'documents', true, false, false, false, 'own'),
    (v_store_role_id, 'customers', true, false, false, false, 'all'),
    (v_store_role_id, 'products', true, false, false, false, 'all')
  ON CONFLICT DO NOTHING;
END $$;
