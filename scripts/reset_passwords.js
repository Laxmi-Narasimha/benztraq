/**
 * Reset All User Passwords
 * Resets passwords for all production users to Benz@2024
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qyovguexmivhvefgbmkg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5b3ZndWV4bWl2aHZlZmdibWtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk5OTI5MSwiZXhwIjoyMDUwNTc1MjkxfQ.JcmOWIyNZKq9wAYBqQ7p8OQHPN0czpVGLKbZzKXN1Qc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// The password we want to set for ALL users
const NEW_PASSWORD = 'Benz@2024';

const USERS_TO_RESET = [
    'laxmi@benz-packaging.com',
    'manan@benz-packaging.com',
    'chaitanya@benz-packaging.com',
    'prashansa@benz-packaging.com',
    'pulak@benz-packaging.com',
    'abhishek@benz-packaging.com',
    'wh.jaipur@benz-packaging.com',
    'banglore@benz-packaging.com',
    'rfq@benz-packaging.com',
    'it@benz-packaging.com',
    'west@benz-packaging.com',
    'isha@benz-packaging.com'
];

async function resetPasswords() {
    console.log('🔒 Resetting All User Passwords to: Benz@2024\n');

    try {
        // Get all users
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
            console.error('❌ Failed to list users:', listError);
            return;
        }

        console.log(`Found ${users.length} total users in auth.users\n`);

        let successCount = 0;
        let failCount = 0;

        for (const email of USERS_TO_RESET) {
            const user = users.find(u => u.email === email);

            if (!user) {
                console.log(`⚠️  ${email.padEnd(40)} - NOT FOUND (needs to be created)`);
                failCount++;
                continue;
            }

            // Reset password using Supabase Auth Admin API
            const { data, error } = await supabase.auth.admin.updateUserById(
                user.id,
                { password: NEW_PASSWORD }
            );

            if (error) {
                console.log(`❌ ${email.padEnd(40)} - FAILED: ${error.message}`);
                failCount++;
            } else {
                console.log(`✅ ${email.padEnd(40)} - Password reset to Benz@2024`);
                successCount++;
            }
        }

        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`✅ Success: ${successCount}`);
        console.log(`❌ Failed:  ${failCount}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

        if (successCount > 0) {
            console.log('🎉 All passwords have been reset to: Benz@2024');
            console.log('\nYou can now login with any of these accounts:');
            console.log('- Email: laxmi@benz-packaging.com');
            console.log('- Email: abhishek@benz-packaging.com');
            console.log('- Email: manan@benz-packaging.com');
            console.log('- Password: Benz@2024 (for all)');
        }

    } catch (err) {
        console.error('❌ Unexpected error:', err.message);
        console.error(err);
    }
}

resetPasswords();
