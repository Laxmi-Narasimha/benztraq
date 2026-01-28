
# Password Reset SQL - FINAL VERSION

## Generated Fresh Bcrypt Hash
- Password: Benz@2024
- Verified: ✅ YES
- Hash: $2b$12$N.fq0dSIg2H6DrrK2U30FuKr9tyElDAv740hwo5wvjgpQJOfWQrT2

## SQL to Run in Supabase Dashboard

```sql
-- Update ALL users to have password: Benz@2024
UPDATE profiles
SET password_hash = '$2b$12$N.fq0dSIg2H6DrrK2U30FuKr9tyElDAv740hwo5wvjgpQJOfWQrT2'
WHERE email IS NOT NULL;

-- Verify the update worked
SELECT 
    email, 
    full_name,
    CASE 
        WHEN password_hash = '$2b$12$N.fq0dSIg2H6DrrK2U30FuKr9tyElDAv740hwo5wvjgpQJOfWQrT2' THEN '✅ Password Updated' 
        ELSE '❌ Old Password' 
    END as status
FROM profiles
ORDER BY email;
```

## After Running the SQL

Try logging in with:
- Email: abhishek@benz-packaging.com
- Password: Benz@2024

OR

- Email: laxmi@benz-packaging.com
- Password: Benz@2024
