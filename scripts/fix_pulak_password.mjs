/**
 * Fix Pulak Biswas's Password
 * Sets password to "Benz@2024" by directly updating the hash in the database.
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const SUPABASE_URL = 'https://qyovguexmivhvefgbmkg.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\r?\n/g, '') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5b3ZndWV4bWl2aHZlZmdibWtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzE2MzI0NywiZXhwIjoyMDgyNzM5MjQ3fQ.bErj6-X_wize5onUV1Ea4Ch99TCmQIcQvW5LgdnyLcY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixPulakPassword() {
    const PASSWORD = 'Benz@2024';

    console.log('🔍 Looking up Pulak Biswas...');

    // Find Pulak's profile
    const { data: profiles, error: findError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, password_hash')
        .ilike('full_name', '%pulak%');

    if (findError) {
        console.error('❌ Error finding user:', findError.message);
        return;
    }

    if (!profiles || profiles.length === 0) {
        console.log('⚠️ No user found with name containing "pulak". Trying email search...');
        const { data: emailProfiles, error: emailError } = await supabase
            .from('profiles')
            .select('user_id, full_name, email, password_hash')
            .ilike('email', '%pulak%');

        if (emailError || !emailProfiles?.length) {
            console.error('❌ Could not find Pulak Biswas in the database');
            return;
        }
        profiles.push(...emailProfiles);
    }

    console.log(`✅ Found ${profiles.length} matching profile(s):`);
    for (const p of profiles) {
        console.log(`   - ${p.full_name} (${p.email})`);
        console.log(`   - Current hash exists: ${!!p.password_hash}`);
        if (p.password_hash) {
            const currentlyValid = await bcrypt.compare(PASSWORD, p.password_hash);
            console.log(`   - "Benz@2024" currently valid: ${currentlyValid}`);
        }
    }

    // Hash the new password
    console.log('\n🔐 Hashing new password "Benz@2024"...');
    const salt = await bcrypt.genSalt(12);
    const newHash = await bcrypt.hash(PASSWORD, salt);
    console.log(`   New hash: ${newHash}`);

    // Verify the hash works
    const verifyResult = await bcrypt.compare(PASSWORD, newHash);
    console.log(`   Verification: ${verifyResult ? '✅ PASS' : '❌ FAIL'}`);

    // Update all matching profiles
    for (const p of profiles) {
        console.log(`\n📝 Updating password for ${p.full_name}...`);
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ password_hash: newHash })
            .eq('user_id', p.user_id);

        if (updateError) {
            console.error(`   ❌ Failed: ${updateError.message}`);
        } else {
            console.log(`   ✅ Password updated successfully!`);
        }
    }

    // Final verification
    console.log('\n🔎 Final verification...');
    for (const p of profiles) {
        const { data: updated } = await supabase
            .from('profiles')
            .select('password_hash')
            .eq('user_id', p.user_id)
            .single();

        if (updated?.password_hash) {
            const finalCheck = await bcrypt.compare(PASSWORD, updated.password_hash);
            console.log(`   ${p.full_name}: ${finalCheck ? '✅ LOGIN WILL WORK' : '❌ STILL BROKEN'}`);
        }
    }

    console.log('\n✅ Done! Pulak Biswas can now log in with password "Benz@2024"');
}

fixPulakPassword().catch(console.error);
