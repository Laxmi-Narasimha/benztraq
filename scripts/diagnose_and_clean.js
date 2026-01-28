/**
 * Diagnosis and Cleanup Script
 * 1. Cleanup test customers
 * 2. Diagnose recent document creation errors
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qyovguexmivhvefgbmkg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5b3ZndWV4bWl2aHZlZmdibWtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk5OTI5MSwiZXhwIjoyMDUwNTc1MjkxfQ.JcmOWIyNZKq9wAYBqQ7p8OQHPN0czpVGLKbZzKXN1Qc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runDiagnosis() {
    console.log('🔍 Running Diagnosis & Cleanup...\n');

    try {
        // 1. Cleanup Test Customers
        console.log('1️⃣ Cleaning up test customers...');
        // Find customers created recently or with "Test" in name
        const { data: customers, error: listError } = await supabase
            .from('customers')
            .select('id, customer_name, created_at')
            .ilike('customer_name', '%test%')
            .order('created_at', { ascending: false });

        if (listError) {
            console.error('❌ Failed to list customers:', listError.message);
        } else if (customers.length > 0) {
            console.log(`   Found ${customers.length} test customers.`);
            const ids = customers.map(c => c.id);

            const { error: deleteError } = await supabase
                .from('customers')
                .delete()
                .in('id', ids);

            if (deleteError) {
                console.error('❌ Failed to delete customers:', deleteError.message);
            } else {
                console.log(`✅ Deleted ${customers.length} test customers.`);
            }
        } else {
            console.log('   No explicit "Test" customers found.');
        }

        // 2. Check for recent document creation attempts
        console.log('\n2️⃣ Checking recent documents...');
        const { data: docs, error: docError } = await supabase
            .from('documents')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        if (docError) {
            console.error('❌ Failed to fetch documents:', docError.message);
        } else {
            console.log(`   Found ${docs.length} recent documents.`);
            docs.forEach(doc => {
                console.log(`   - [${doc.created_at}] ID: ${doc.id} | Status: ${doc.status || doc.state} | Amount: ${doc.amount_total || doc.grand_total}`);
            });
        }

        // 3. Try access to users/profiles to verify what the API sees
        console.log('\n3️⃣ Verifying Profiles Access...');
        const { count: profileCount, error: profileError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        if (profileError) {
            console.error('❌ Failed to access profiles:', profileError.message);
        } else {
            console.log(`✅ Profiles table accessible (${profileCount} rows).`);
        }

    } catch (err) {
        console.error('❌ Unexpected error:', err.message);
    }
}

runDiagnosis();
