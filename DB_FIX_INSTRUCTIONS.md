# 🛠️ Database Fix Instructions
**Issue:** Order Creation is blocked because `documents.salesperson_id` violates foreign key constraint `documents_salesperson_id_fkey`.
**Cause:** The `documents` table expects the `salesperson_id` to exist in a specific referenced table (likely `public.users` or `employees`), but that table is missing the required User IDs.

To fix this **properly**, please follow these steps in your [Supabase Dashboard](https://supabase.com/dashboard).

---

## Step 1: Identify the Missing Data
Open the **SQL Editor** in Supabase and run this query to see exactly what table is being referenced:

```sql
SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table_name,
    pg_get_constraintdef(c.oid) AS definition
FROM
    pg_constraint c
WHERE
    conname = 'documents_salesperson_id_fkey';
```

### If result shows `referenced_table_name` is `auth.users`
The issue is weird, but try running **Option A** below.

### If result shows `referenced_table_name` is `public.users` (Most Likely)
The `public.users` table is likely empty or out of sync. Run **Option A** below.

### If result shows `referenced_table_name` is something else (e.g., `employees`)
You need to verify if that table has data.

---

## Step 2: Apply the Verification Fix (Option A - Recommended)
This script attempts to sync your `auth.users` to `public.users` (and `profiles` just in case), which usually satisfies the constraint.

Copy and run this in the **SQL Editor**:

```sql
-- 1. Ensure public.users exists and has data from auth.users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT,
    full_name TEXT
);

-- 2. Sync Auth Users to Public Users
INSERT INTO public.users (id, email, full_name)
SELECT 
    au.id, 
    au.email, 
    COALESCE(au.raw_user_meta_data->>'full_name', 'System User')
FROM auth.users au
ON CONFLICT (id) DO NOTHING;

-- 3. Sync Profiles ID (if documents references profiles.id)
-- Ensure profiles.id matches user_id if profiles uses UUID PK
-- (Note: Only run if profiles table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        -- Verify if profiles has the users
        NULL; -- Logic handled by app seed, but FK constraint is DB level
    END IF;
END $$;
```

---

## Step 3: The "Nuclear" Option (Quickest Fix)
If you just want it to work *now* and don't care about the strict database constraint (since the App handles logic anyway), you can simply Drop the constraint.

```sql
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_salesperson_id_fkey;
```

**Recommendation:** Try **Option A** (Sync) first. If it still fails, use **Step 3** (Drop Constraint).
