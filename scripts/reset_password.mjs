/**
 * Password Reset Script
 * 
 * Usage: node scripts/reset_password.mjs <email> [password]
 * 
 * Examples:
 *   node scripts/reset_password.mjs isha@benz-packaging.com
 *   node scripts/reset_password.mjs isha@benz-packaging.com MyNewPass@123
 * 
 * If no password is provided, defaults to Benz@2024
 */

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        let val = match[2];
        if (val.startsWith('"') && val.endsWith('"')) {
            val = val.substring(1, val.length - 1).replace(/\\r/g, '').replace(/\\n/g, '');
        }
        envVars[match[1]] = val;
    }
});

const supabase = createClient(envVars['NEXT_PUBLIC_SUPABASE_URL'], envVars['SUPABASE_SERVICE_ROLE_KEY']);

const email = process.argv[2];
const password = process.argv[3] || 'Benz@2024';

if (!email) {
    console.log('Usage: node scripts/reset_password.mjs <email> [password]');
    console.log('Example: node scripts/reset_password.mjs isha@benz-packaging.com Benz@2024');
    process.exit(1);
}

async function run() {
    console.log(`Resetting password for: ${email}`);
    console.log(`New password: ${password}`);

    // Generate hash using bcryptjs (same lib the app uses)
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(password, salt);

    // Verify the hash works before saving
    const verified = await bcrypt.compare(password, hash);
    if (!verified) {
        console.log('❌ Hash self-verification failed!');
        process.exit(1);
    }

    // Update profiles table
    const { data, error } = await supabase
        .from('profiles')
        .update({ password_hash: hash })
        .ilike('email', email)
        .select('email, full_name');

    if (error) {
        console.log('❌ Error:', error.message);
        process.exit(1);
    }

    if (!data || data.length === 0) {
        console.log('❌ No user found with email:', email);
        process.exit(1);
    }

    console.log(`✅ Password reset successful!`);
    console.log(`   User: ${data[0].full_name} (${data[0].email})`);
    console.log(`   Password: ${password}`);
}

run().catch(console.error);
