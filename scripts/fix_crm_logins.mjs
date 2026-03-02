/**
 * Create CRM user profiles for login
 * Hardcodes the newer service role key directly
 */
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Use the newer key from .env.local (iat:1767163247)
const url = 'https://qyovguexmivhvefgbmkg.supabase.co';
const key = [
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5b3ZndWV4bWl2aHZlZmdibWtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzE2MzI0NywiZXhwIjoyMDgyNzM5MjQ3fQ',
    'bErj6-X_wize5onUV1Ea4Ch99TCmQIcQvW5LgdnyLcY'
].join('.');

console.log('Key length:', key.length);
console.log('Key ends with:', JSON.stringify(key.slice(-10)));

const supabase = createClient(url, key);

const DEFAULT_PASSWORD = 'Benz@2024';

const CRM_USERS = [
    { user_id: 'e2cd37b3-f92b-4378-95d3-8c46d469315b', email: 'dinesh@benz-packaging.com', full_name: 'Dinesh' },
    { user_id: 'c6f5ea1a-110c-4165-9433-ef6b4c8c71fa', email: 'ccare2@benz-packaging.com', full_name: 'Pradeep Kumar' },
    { user_id: 'c5c41c1e-c16d-4936-b51b-41ef9f6c9679', email: 'ccare@benz-packaging.com', full_name: 'Shikha Sharma' },
    { user_id: '1c5b8a5c-2af5-4c96-801b-b5fc562d3ac2', email: 'ccare6@benz-packaging.com', full_name: 'Preeti R' },
    { user_id: '78387321-8aad-4ec4-9eae-0f7e99eda5dc', email: 'sandeep@benz-packaging.com', full_name: 'Sandeep' },
    { user_id: '2970b695-b623-48c1-b036-ba14919cb443', email: 'satender@benz-packaging.com', full_name: 'Satender Singh' },
    { user_id: '872fca38-39e1-468e-9901-daa0823cd36a', email: 'bhandari@benz-packaging.com', full_name: 'TS Bhandari' },
    { user_id: '2ee61597-d5e1-4d1e-aad8-2b157adb599c', email: 'sales5@benz-packaging.com', full_name: 'Tarun Bhardwaj' },
    { user_id: '51deaf59-c580-418d-a78c-7acfa973a53d', email: 'chennai@benz-packaging.com', full_name: 'Jayashree N' },
    { user_id: '0edd417c-95f9-4ffa-b76f-4a51673015f0', email: 'it@benz-packaging.com', full_name: 'Udit Suri' },
];

async function run() {
    // Test connection
    const { data: test, error: testError } = await supabase.from('profiles').select('email').limit(3);
    if (testError) {
        console.log('Connection error:', testError.message);
        // Try anon key just to verify connectivity
        const anon = createClient(url, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5b3ZndWV4bWl2aHZlZmdibWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5OTkyOTEsImV4cCI6MjA1MDU3NTI5MX0.mwVjppZ94i7D8i-R8t8Fj3OYJV_l4Q2mQu-nX2pQdOM');
        const { data: t2, error: e2 } = await anon.from('profiles').select('email').limit(3);
        console.log('Anon key test:', e2 ? e2.message : `OK - ${t2.length} profiles`);
        return;
    }
    console.log('Connected! Profiles found:', test.map(p => p.email).join(', '));

    // Get roles
    const { data: roles } = await supabase.from('roles').select('id, name');
    console.log('Roles:', roles?.map(r => `${r.name}(${r.id})`).join(', '));

    const crmRole = roles?.find(r => ['crm', 'asm', 'area_sales_manager'].includes(r.name));
    console.log('Using CRM role:', crmRole);

    // Hash password
    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

    for (const user of CRM_USERS) {
        const { data: existing } = await supabase.from('profiles').select('user_id').eq('user_id', user.user_id).single();
        if (existing) {
            // Update password hash
            await supabase.from('profiles').update({ password_hash: hash, is_active: true }).eq('user_id', user.user_id);
            console.log(`✓ ${user.email}: Updated hash`);
            continue;
        }

        const { error } = await supabase.from('profiles').insert({
            user_id: user.user_id,
            email: user.email,
            full_name: user.full_name,
            password_hash: hash,
            is_active: true,
            role_id: crmRole?.id || null,
            organization: 'benz_packaging',
            companies: ['benz'],
        });

        console.log(error ? `❌ ${user.email}: ${error.message}` : `✅ ${user.email}: Created`);
    }

    // Verify
    console.log('\n--- Verification ---');
    for (const u of CRM_USERS) {
        const { data } = await supabase.from('profiles').select('email, is_active').ilike('email', u.email).single();
        console.log(data ? `✓ ${data.email} active=${data.is_active}` : `✗ ${u.email} NOT FOUND`);
    }
}

run().catch(console.error);
