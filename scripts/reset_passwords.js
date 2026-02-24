/**
 * Reset Password Script
 * Resets all user password hashes to match the expected passwords from seed-users.
 * 
 * Usage: node scripts/reset_passwords.js
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const idx = line.indexOf('=');
    if (idx > 0) {
        env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const SALT_ROUNDS = 12;
const DEFAULT_PASSWORD = env.SEED_DEFAULT_PASSWORD || 'Benz@2024';
const DIRECTOR_PASSWORD = env.SEED_DIRECTOR_PASSWORD || 'Hound@1102';

const DIRECTOR_EMAILS = [
    'manan@benz-packaging.com',
    'chaitanya@benz-packaging.com',
    'prashansa@benz-packaging.com',
];

async function resetPasswords() {
    console.log('Resetting password hashes...');
    console.log('DEFAULT_PASSWORD:', DEFAULT_PASSWORD);
    console.log('DIRECTOR_PASSWORD:', DIRECTOR_PASSWORD);

    const defaultHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
    const directorHash = await bcrypt.hash(DIRECTOR_PASSWORD, SALT_ROUNDS);

    console.log('Verify default hash:', await bcrypt.compare(DEFAULT_PASSWORD, defaultHash));
    console.log('Verify director hash:', await bcrypt.compare(DIRECTOR_PASSWORD, directorHash));

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, email, full_name');

    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }

    console.log(`Found ${profiles.length} profiles`);

    for (const profile of profiles) {
        const isDirector = DIRECTOR_EMAILS.includes(profile.email?.toLowerCase());
        const hash = isDirector ? directorHash : defaultHash;
        const pwd = isDirector ? DIRECTOR_PASSWORD : DEFAULT_PASSWORD;

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ password_hash: hash })
            .eq('user_id', profile.user_id);

        if (updateError) {
            console.error(`  X ${profile.email}: ${updateError.message}`);
        } else {
            console.log(`  OK ${profile.email} -> password: "${pwd}"`);
        }
    }

    console.log('\nDone! All passwords reset.');
}

resetPasswords().catch(console.error);
