-- ASM Cleanup and Setup Script
-- This creates exactly 6 ASMs with the correct emails and region names

-- STEP 1: Deactivate ALL ASM accounts first
UPDATE profiles 
SET is_active = false 
WHERE role_id IN (SELECT id FROM roles WHERE name = 'asm');

-- STEP 2: Ensure the 6 regions exist
INSERT INTO regions (name)
SELECT name FROM (VALUES 
    ('Madhya Pradesh'),
    ('Noida'),
    ('Maharashtra'),
    ('Rajasthan'),
    ('Karnataka'),
    ('West Zone')
) AS r(name)
WHERE NOT EXISTS (SELECT 1 FROM regions WHERE regions.name = r.name);

-- STEP 3: Update existing ASM profiles to correct emails and regions

-- Madhya Pradesh ASM
UPDATE profiles 
SET 
    full_name = 'Madhya Pradesh',
    is_active = true,
    region_id = (SELECT id FROM regions WHERE name = 'Madhya Pradesh')
WHERE email = 'abhishek@benz-packaging.com';

-- Maharashtra ASM  
UPDATE profiles 
SET 
    full_name = 'Maharashtra',
    is_active = true,
    region_id = (SELECT id FROM regions WHERE name = 'Maharashtra')
WHERE email = 'rfq@benz-packaging.com';

-- Karnataka ASM
UPDATE profiles 
SET 
    full_name = 'Karnataka',
    is_active = true,
    region_id = (SELECT id FROM regions WHERE name = 'Karnataka')
WHERE email = 'banglore@benz-packaging.com';

-- Noida ASM
UPDATE profiles 
SET 
    full_name = 'Noida',
    is_active = true,
    region_id = (SELECT id FROM regions WHERE name = 'Noida')
WHERE email = 'it@benz-packaging.com';

-- Rajasthan ASM
UPDATE profiles 
SET 
    full_name = 'Rajasthan',
    is_active = true,
    region_id = (SELECT id FROM regions WHERE name = 'Rajasthan')
WHERE email = 'wh.jaipur@benz-packaging.com';

-- West Zone ASM (placeholder - using a new email)
-- First check if west zone user exists, if not we'll need to create via auth
UPDATE profiles 
SET 
    full_name = 'West Zone',
    is_active = true,
    region_id = (SELECT id FROM regions WHERE name = 'West Zone')
WHERE email = 'west@benz-packaging.com';

-- STEP 4: Verify the results
-- Run this query to see the 6 active ASMs:
-- SELECT p.email, p.full_name, r.name as region_name, p.is_active 
-- FROM profiles p 
-- LEFT JOIN regions r ON p.region_id = r.id 
-- WHERE p.role_id = (SELECT id FROM roles WHERE name = 'asm') 
-- AND p.is_active = true;
