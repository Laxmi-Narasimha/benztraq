/**
 * Test Database Connection
 * Verify we can connect to the production database
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qyovguexmivhvefgbmkg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5b3ZndWV4bWl2aHZlZmdibWtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk5OTI5MSwiZXhwIjoyMDUwNTc1MjkxfQ.JcmOWIyNZKq9wAYBqQ7p8OQHPN0czpVGLKbZzKXN1Qc';

console.log('Testing Database Connection\n');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseServiceKey.substring(0, 50) + '...\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function testConnection() {
    try {
        // Test 1: Try to query asms table
        console.log('Test 1: Querying asms table...');
        const { data: asms, error: asmsError } = await supabase
            .from('asms')
            .select('email, full_name')
            .limit(3);

        if (asmsError) {
            console.log('❌ ASMs query failed:', asmsError.message);
            console.log('   Code:', asmsError.code);
            console.log('   Details:', asmsError.details);
        } else {
            console.log('✅ ASMs table accessible');
            console.log('   Found', asms?.length || 0, 'users');
            if (asms && asms.length > 0) {
                console.log('   Sample:', asms[0].email);
            }
        }

        // Test 2: Try customers table
        console.log('\nTest 2: Querying customers table...');
        const { data: customers, error: custError, count } = await supabase
            .from('customers')
            .select('*', { count: 'exact', head: true });

        if (custError) {
            console.log('❌ Customers query failed:', custError.message);
        } else {
            console.log('✅ Customers table accessible');
            console.log('   Total customers:', count);
        }

        // Test 3: Try products table
        console.log('\nTest 3: Querying products table...');
        const { data: products, error: prodError, count: prodCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true });

        if (prodError) {
            console.log('❌ Products query failed:', prodError.message);
        } else {
            console.log('✅ Products table accessible');
            console.log('   Total products:', prodCount);
        }

    } catch (err) {
        console.error('❌ Exception:', err.message);
        console.error(err);
    }
}

testConnection();
