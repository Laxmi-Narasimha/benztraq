-- Migration: Update users to location-based names and add new regions
-- Run this to update existing users and add missing regions

-- Add missing regions
INSERT INTO regions (name, description)
VALUES 
    ('Bangalore', 'Karnataka region'),
    ('Delhi', 'Delhi-NCR region'),
    ('Indore', 'Madhya Pradesh region')
ON CONFLICT (name) DO NOTHING;

-- Update Abhishek to Indore
UPDATE profiles 
SET full_name = 'Indore',
    region_id = (SELECT id FROM regions WHERE name = 'Indore' LIMIT 1)
WHERE email = 'abhishek@benz-packaging.com';

-- Update Mani Bhushan to Jaipur
UPDATE profiles 
SET full_name = 'Jaipur'
WHERE email = 'wh.jaipur@benz-packaging.com';

-- Update old ASMs or insert new location-based users
-- Bangalore
INSERT INTO profiles (user_id, email, full_name, role_id, region_id, designation, is_active, organization, companies, password_hash)
SELECT 
    gen_random_uuid(),
    'bangalore@benz-packaging.com',
    'Bangalore',
    (SELECT id FROM roles WHERE name = 'asm'),
    (SELECT id FROM regions WHERE name = 'Bangalore'),
    'Area Sales Manager',
    true,
    'benz_packaging',
    ARRAY['benz'],
    (SELECT password_hash FROM profiles WHERE email = 'abhishek@benz-packaging.com' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'bangalore@benz-packaging.com');

-- Maharashtra (update existing or insert)
INSERT INTO profiles (user_id, email, full_name, role_id, region_id, designation, is_active, organization, companies, password_hash)
SELECT 
    gen_random_uuid(),
    'maharashtra@benz-packaging.com',
    'Maharashtra',
    (SELECT id FROM roles WHERE name = 'asm'),
    (SELECT id FROM regions WHERE name = 'Maharashtra'),
    'Area Sales Manager',
    true,
    'benz_packaging',
    ARRAY['benz'],
    (SELECT password_hash FROM profiles WHERE email = 'abhishek@benz-packaging.com' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'maharashtra@benz-packaging.com');

-- Delhi-NCR
INSERT INTO profiles (user_id, email, full_name, role_id, region_id, designation, is_active, organization, companies, password_hash)
SELECT 
    gen_random_uuid(),
    'delhi@benz-packaging.com',
    'Delhi-NCR',
    (SELECT id FROM roles WHERE name = 'asm'),
    (SELECT id FROM regions WHERE name = 'Delhi'),
    'Area Sales Manager',
    true,
    'benz_packaging',
    ARRAY['benz'],
    (SELECT password_hash FROM profiles WHERE email = 'abhishek@benz-packaging.com' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'delhi@benz-packaging.com');

-- Update asm1 to Maharashtra if it exists
UPDATE profiles 
SET full_name = 'Maharashtra'
WHERE email = 'asm1@benz-packaging.com';

-- Optionally deactivate old generic ASM accounts
UPDATE profiles SET is_active = false WHERE email IN ('asm2@benz-packaging.com', 'asm3@benz-packaging.com');
