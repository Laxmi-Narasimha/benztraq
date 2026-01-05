-- Migration: Update passwords for Chaitanya, Manan, and Prashansa
-- Password: Hound@1102 (bcrypt hash)

-- The hash is generated using bcrypt with 12 rounds
-- Using placeholder - will need to run seed-users API to apply properly

-- Update Chaitanya's password
UPDATE profiles 
SET password_hash = '$2b$12$LKvNBfVKpnQyY8xjG5W6/.QQhxcB5qO0j.0VbQ7VeLm9JE66PCPSS'
WHERE email = 'chaitanya@benz-packaging.com';

-- Update Manan's password
UPDATE profiles 
SET password_hash = '$2b$12$LKvNBfVKpnQyY8xjG5W6/.QQhxcB5qO0j.0VbQ7VeLm9JE66PCPSS'
WHERE email = 'manan@benz-packaging.com';

-- Update Prashansa's password
UPDATE profiles 
SET password_hash = '$2b$12$LKvNBfVKpnQyY8xjG5W6/.QQhxcB5qO0j.0VbQ7VeLm9JE66PCPSS'
WHERE email = 'prashansa@benz-packaging.com';

-- Note: The above hash is a placeholder. 
-- Run the /api/admin/seed-users endpoint to properly update with correctly hashed password.
