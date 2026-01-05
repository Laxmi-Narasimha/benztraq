-- Migration: Clean up and set 5 location-based ASM users
-- Run this in Supabase SQL Editor

-- Step 1: Add missing regions (no description column)
INSERT INTO regions (name) VALUES ('Bangalore') ON CONFLICT (name) DO NOTHING;
INSERT INTO regions (name) VALUES ('Delhi') ON CONFLICT (name) DO NOTHING;
INSERT INTO regions (name) VALUES ('Indore') ON CONFLICT (name) DO NOTHING;
INSERT INTO regions (name) VALUES ('Pune') ON CONFLICT (name) DO NOTHING;

-- Step 2: Update existing ASM users to location names
-- Abhishek -> Indore
UPDATE profiles 
SET full_name = 'Indore',
    region_id = (SELECT id FROM regions WHERE name = 'Indore' LIMIT 1)
WHERE email = 'abhishek@benz-packaging.com';

-- Mani Bhushan -> Jaipur
UPDATE profiles 
SET full_name = 'Jaipur',
    region_id = (SELECT id FROM regions WHERE name = 'Jaipur' LIMIT 1)
WHERE email = 'wh.jaipur@benz-packaging.com';

-- Step 3: Deactivate old generic ASM accounts (will be hidden from filters)
UPDATE profiles 
SET is_active = false 
WHERE email IN (
    'asm1@benz-packaging.com', 
    'asm2@benz-packaging.com', 
    'asm3@benz-packaging.com'
);

-- Step 4: Create new location-based users if they don't exist
-- Get the password hash from an existing user
DO $$
DECLARE
    v_password_hash TEXT;
    v_asm_role_id UUID;
BEGIN
    -- Get password hash from existing user
    SELECT password_hash INTO v_password_hash FROM profiles WHERE is_active = true LIMIT 1;
    SELECT id INTO v_asm_role_id FROM roles WHERE name = 'asm' LIMIT 1;

    -- Bangalore
    INSERT INTO profiles (user_id, email, full_name, role_id, region_id, designation, is_active, organization, companies, password_hash)
    VALUES (
        gen_random_uuid(),
        'banglore@benz-packaging.com',
        'Bangalore',
        v_asm_role_id,
        (SELECT id FROM regions WHERE name = 'Bangalore' LIMIT 1),
        'Area Sales Manager',
        true,
        'benz_packaging',
        ARRAY['benz'],
        v_password_hash
    ) ON CONFLICT (email) DO UPDATE SET full_name = 'Bangalore', is_active = true;

    -- Pune (Maharashtra region)
    INSERT INTO profiles (user_id, email, full_name, role_id, region_id, designation, is_active, organization, companies, password_hash)
    VALUES (
        gen_random_uuid(),
        'pune@benz-packaging.com',
        'Pune',
        v_asm_role_id,
        (SELECT id FROM regions WHERE name = 'Pune' LIMIT 1),
        'Area Sales Manager',
        true,
        'benz_packaging',
        ARRAY['benz'],
        v_password_hash
    ) ON CONFLICT (email) DO UPDATE SET full_name = 'Pune', is_active = true;

    -- Delhi-NCR
    INSERT INTO profiles (user_id, email, full_name, role_id, region_id, designation, is_active, organization, companies, password_hash)
    VALUES (
        gen_random_uuid(),
        'delhi@benz-packaging.com',
        'Delhi-NCR',
        v_asm_role_id,
        (SELECT id FROM regions WHERE name = 'Delhi' LIMIT 1),
        'Area Sales Manager',
        true,
        'benz_packaging',
        ARRAY['benz'],
        v_password_hash
    ) ON CONFLICT (email) DO UPDATE SET full_name = 'Delhi-NCR', is_active = true;

END $$;

-- Step 5: Verify - List all active ASM users (should show 5 locations)
SELECT email, full_name, is_active FROM profiles 
WHERE role_id = (SELECT id FROM roles WHERE name = 'asm') 
ORDER BY full_name;
