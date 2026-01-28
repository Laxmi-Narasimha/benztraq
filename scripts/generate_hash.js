/**
 * Generate Fresh Bcrypt Hash for Benz@2024
 */

import bcrypt from 'bcryptjs';

async function generateHash() {
    const password = 'Benz@2024';
    const saltRounds = 12;

    console.log('🔐 Generating Fresh Bcrypt Hash\n');
    console.log('Password:', password);
    console.log('Salt Rounds:', saltRounds, '\n');

    try {
        console.log('Hashing...');
        const salt = await bcrypt.genSalt(saltRounds);
        const hash = await bcrypt.hash(password, salt);

        console.log('✅ Hash generated successfully!\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('BCRYPT HASH:');
        console.log(hash);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Test the hash by verifying it
        console.log('Testing the hash...');
        const isValid = await bcrypt.compare(password, hash);
        console.log('Verification:', isValid ? '✅ VALID' : '❌ INVALID');

        // Generate SQL
        console.log('\n📝 SQL to run in Supabase Dashboard:\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`UPDATE profiles`);
        console.log(`SET password_hash = '${hash}'`);
        console.log(`WHERE email IS NOT NULL;`);
        console.log('');
        console.log(`-- Verify`);
        console.log(`SELECT email, full_name, `);
        console.log(`  CASE WHEN password_hash = '${hash}' THEN '✅ Updated' ELSE '❌ Not updated' END as status`);
        console.log(`FROM profiles;`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (err) {
        console.error('❌ Error:', err.message);
        console.error(err);
    }
}

generateHash();
