-- Add missing roles to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'developer';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'head_of_sales';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'crm';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'store_manager';
