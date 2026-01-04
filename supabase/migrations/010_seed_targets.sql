-- Migration: 010_seed_targets.sql
-- Seed annual targets for existing users to ensure dashboard visualization works

DO $$
DECLARE
    u RECORD;
BEGIN
    FOR u IN SELECT id FROM auth.users LOOP
        -- Insert target for 2024 if not exists
        INSERT INTO annual_targets (salesperson_user_id, year, annual_target, created_by)
        VALUES (u.id, 2024, 5000000, u.id) -- 50 Lakhs
        ON CONFLICT (salesperson_user_id, year) DO NOTHING;

        -- Insert target for 2025 (Current Year likely, or future)
        INSERT INTO annual_targets (salesperson_user_id, year, annual_target, created_by)
        VALUES (u.id, 2025, 6000000, u.id) -- 60 Lakhs
        ON CONFLICT (salesperson_user_id, year) DO NOTHING;
         -- Insert target for 2026 (Current Year likely)
        INSERT INTO annual_targets (salesperson_user_id, year, annual_target, created_by)
        VALUES (u.id, 2026, 7500000, u.id) -- 75 Lakhs
        ON CONFLICT (salesperson_user_id, year) DO NOTHING;
    END LOOP;
END $$;
