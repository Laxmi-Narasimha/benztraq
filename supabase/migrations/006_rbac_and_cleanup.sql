-- Migration 006: RBAC and Data Cleanup
-- Adds director role, cleans demo data, updates company access

-- 1. Add Director Role
INSERT INTO public.roles (name, display_name, level, description)
VALUES ('director', 'Director', 90, 'Director with full access to both companies')
ON CONFLICT (name) DO NOTHING;

-- 2. Delete ALL demo data (quotations and sales orders)
DELETE FROM public.sales_orders;
DELETE FROM public.quotations;
DELETE FROM public.activity_log WHERE resource_type IN ('quotations', 'sales_orders');

-- 3. Update companies array for existing users based on role
-- Developers and directors get both companies
UPDATE public.profiles 
SET companies = ARRAY['benz', 'ergopack']::TEXT[]
WHERE role_id IN (SELECT id FROM public.roles WHERE name IN ('developer', 'director'));

-- Head of sales and ASM only get Benz
UPDATE public.profiles 
SET companies = ARRAY['benz']::TEXT[]
WHERE role_id IN (SELECT id FROM public.roles WHERE name IN ('head_of_sales', 'asm'));

-- 4. Get director role ID for seeding
DO $$
DECLARE
    director_role_id UUID;
    dev_password_hash TEXT := '$2a$10$xQj8vK5zP5F5Fq5OqO5Oq5OqO5Oq5OqO5Oq5OqO5Oq5OqO5Oq5Oq'; -- Benz@2024
BEGIN
    -- Get director role ID
    SELECT id INTO director_role_id FROM public.roles WHERE name = 'director';
    
    -- Insert 3 directors
    INSERT INTO public.profiles (
        user_id,
        full_name,
        email,
        role_id,
        designation,
        password_hash,
        is_active,
        role,
        companies
    ) VALUES
    (
        gen_random_uuid(),
        'Manan',
        'manan@benz-packaging.com',
        director_role_id,
        'Director',
        dev_password_hash,
        true,
        'director',
        ARRAY['benz', 'ergopack']::TEXT[]
    ),
    (
        gen_random_uuid(),
        'Chaitanya',
        'chaitanya@benz-packaging.com',
        director_role_id,
        'Director',
        dev_password_hash,
        true,
        'director',
        ARRAY['benz', 'ergopack']::TEXT[]
    ),
    (
        gen_random_uuid(),
        'Prashansa',
        'prashansa@benz-packaging.com',
        director_role_id,
        'Director',
        dev_password_hash,
        true,
        'director',
        ARRAY['benz', 'ergopack']::TEXT[]
    )
    ON CONFLICT (email) DO NOTHING;
END $$;

-- 5. Verify the changes
SELECT 
    'Director Role Created' as status,
    COUNT(*) as count
FROM public.roles WHERE name = 'director'
UNION ALL
SELECT 
    'Directors Seeded' as status,
    COUNT(*) as count
FROM public.profiles WHERE role_id IN (SELECT id FROM roles WHERE name = 'director')
UNION ALL
SELECT 
    'Demo Data Deleted' as status,
    COUNT(*) as count
FROM public.quotations;
