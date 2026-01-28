/**
 * Direct Password Reset Script
 * Directly updates password hashes in the asms table
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = 'https://qyovguexmivhvefgbmkg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5b3ZndWV4bWl2aHZlZmdibWtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk5OTI5MSwiZXhwIjoyMDUwNTc1MjkxfQ.JcmOWIyNZKq9wAYBqQ7p8OQHPN0czpVGLKbZzKXN1Qc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const NEW_PASSWORD = 'Benz@2024';
const SALT_ROUNDS = 12;

async function resetAllPasswords() {
    console.log('🔒 Resetting ALL User Passwords\n');
    console.log(`New Password: ${NEW_PASSWORD}\n`);

    try {
        // Step 1: Hash the new password
        console.log('1️⃣ Hashing password...');
        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        const hashedPassword = await bcrypt.hash(NEW_PASSWORD, salt);
        console.log('✅ Password hashed\n');

        // Step 2: Get all users
        console.log('2️⃣ Fetching all users from asms table...');
        const { data: users, error: fetchError } = await supabase
            .from('asms')
            .select('user_id, email, full_name');

        if (fetchError) {
            console.error('❌ Failed to fetch users:', fetchError);
            return;
        }

        console.log(`✅ Found ${users.length} users\n`);

        // Step 3: Update each user's password
        console.log('3️⃣ Updating passwords...\n');

        let successCount = 0;
        let failCount = 0;

        for (const user of users) {
            const { error: updateError } = await supabase
                .from('asms')
                .update({ password_hash: hashedPassword })
                .eq('user_id', user.user_id);

            if (updateError) {
                console.log(`❌ ${user.email.padEnd(40)} - FAILED: ${updateError.message}`);
                failCount++;
            } else {
                console.log(`✅ ${user.email.padEnd(40)} - Password updated`);
                successCount++;
            }
        }

        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`✅ Success: ${successCount}`);
        console.log(`❌ Failed:  ${failCount}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

        if (successCount > 0) {
            console.log('🎉 ALL PASSWORDS HAVE BEEN RESET!\n');
            console.log('You can now login with ANY user using:');
            console.log(`Password: ${NEW_PASSWORD}\n`);
            console.log('Try these credentials:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('Email: laxmi@benz-packaging.com');
            console.log('Email: abhishek@benz-packaging.com');
            console.log('Email: manan@benz-packaging.com');
            console.log(`Password: ${NEW_PASSWORD} (for all)`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        }

    } catch (err) {
        console.error('❌ Unexpected error:', err.message);
        console.error(err);
    }
}

resetAllPasswords();
