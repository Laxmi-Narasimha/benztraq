/**
 * Generate Hash and Write to File
 */

import bcrypt from 'bcryptjs';
import { writeFileSync } from 'fs';

async function generateAndSave() {
    const password = 'Benz@2024';
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(password, salt);

    // Verify it works
    const isValid = await bcrypt.compare(password, hash);

    const output = `
# Password Reset SQL - FINAL VERSION

## Generated Fresh Bcrypt Hash
- Password: Benz@2024
- Verified: ${isValid ? '✅ YES' : '❌ NO'}
- Hash: ${hash}

## SQL to Run in Supabase Dashboard

\`\`\`sql
-- Update ALL users to have password: Benz@2024
UPDATE profiles
SET password_hash = '${hash}'
WHERE email IS NOT NULL;

-- Verify the update worked
SELECT 
    email, 
    full_name,
    CASE 
        WHEN password_hash = '${hash}' THEN '✅ Password Updated' 
        ELSE '❌ Old Password' 
    END as status
FROM profiles
ORDER BY email;
\`\`\`

## After Running the SQL

Try logging in with:
- Email: abhishek@benz-packaging.com
- Password: Benz@2024

OR

- Email: laxmi@benz-packaging.com
- Password: Benz@2024
`;

    writeFileSync('FINAL_PASSWORD_RESET.md', output, 'utf8');

    console.log('✅ Hash generated and saved to FINAL_PASSWORD_RESET.md\n');
    console.log('Hash:', hash);
    console.log('\nVerified:', isValid ? '✅ Valid' : '❌ Invalid');
}

generateAndSave();
