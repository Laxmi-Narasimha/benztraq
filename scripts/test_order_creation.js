/**
 * Test Order Creation After DB Fix
 * Verifies that the documents_salesperson_id_fkey constraint fix worked
 */

import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'https://benztraq.vercel.app';
const supabaseUrl = 'https://qyovguexmivhvefgbmkg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5b3ZndWV4bWl2aHZlZmdibWtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk5OTI5MSwiZXhwIjoyMDUwNTc1MjkxfQ.JcmOWIyNZKq9wAYBqQ7p8OQHPN0czpVGLKbZzKXN1Qc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testOrderCreation() {
    console.log('🧪 Testing Order Creation After DB Fix\n');

    try {
        // Step 1: Get a customer to use
        console.log('1️⃣ Fetching a customer...');
        const { data: customers, error: custError } = await supabase
            .from('customers')
            .select('id, customer_name')
            .limit(1);

        if (custError || !customers || customers.length === 0) {
            console.log('❌ No customers found. Creating test customer...');

            const { data: newCustomer, error: createError } = await supabase
                .from('customers')
                .insert({
                    customer_name: 'Test Customer for Order Creation',
                    city: 'Mumbai',
                    organization_id: 'benz'
                })
                .select()
                .single();

            if (createError) {
                console.error('❌ Failed to create customer:', createError);
                return;
            }
            console.log('✅ Created test customer:', newCustomer.customer_name);
            customers[0] = newCustomer;
        } else {
            console.log('✅ Found customer:', customers[0].customer_name);
        }

        // Step 2: Get a product
        console.log('\n2️⃣ Fetching a product...');
        const { data: products, error: prodError } = await supabase
            .from('products')
            .select('id, item_name')
            .limit(1);

        if (prodError || !products || products.length === 0) {
            console.log('❌ No products found');
            return;
        }
        console.log('✅ Found product:', products[0].item_name);

        // Step 3: Get Laxmi's user ID (developer)
        console.log('\n3️⃣ Getting user ID for salesperson...');
        const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

        if (userError) {
            console.error('❌ Failed to get users:', userError);
            return;
        }

        const laxmiUser = users.find(u => u.email === 'laxmi@benz-packaging.com');
        if (!laxmiUser) {
            console.log('❌ Laxmi user not found');
            return;
        }
        console.log('✅ Found user:', laxmiUser.email, '(ID:', laxmiUser.id, ')');

        // Step 4: Try to create a quotation document
        console.log('\n4️⃣ Creating quotation document...');
        const testQuotation = {
            customer_id: customers[0].id,
            salesperson_id: laxmiUser.id, // This field was causing the FK constraint error
            order_date: new Date().toISOString().split('T')[0],
            state: 'draft',
            amount_total: 10000,
            organization_id: 'benz',
            doc_type: 'quotation'
        };

        const { data: quotation, error: quotError } = await supabase
            .from('documents')
            .insert(testQuotation)
            .select()
            .single();

        if (quotError) {
            console.error('\n❌ FAILED: Order creation still failing!');
            console.error('Error:', quotError.message);
            console.error('Code:', quotError.code);
            console.error('Details:', quotError.details);

            if (quotError.message.includes('documents_salesperson_id_fkey')) {
                console.log('\n⚠️  The foreign key constraint is STILL causing issues.');
                console.log('The constraint might not be properly recreated.');
            }
            return false;
        }

        console.log('\n✅ SUCCESS! Quotation created successfully!');
        console.log('Quotation ID:', quotation.id);
        console.log('Customer:', customers[0].customer_name);
        console.log('Salesperson ID:', quotation.salesperson_id);
        console.log('Total:', quotation.amount_total);

        // Clean up - delete the test quotation
        console.log('\n5️⃣ Cleaning up test data...');
        await supabase.from('documents').delete().eq('id', quotation.id);
        console.log('✅ Test quotation deleted');

        console.log('\n🎉 DATABASE CONSTRAINT FIX VERIFIED!');
        console.log('Order creation is now working correctly.');
        return true;

    } catch (err) {
        console.error('\n❌ Unexpected error:', err.message);
        console.error(err);
        return false;
    }
}

testOrderCreation().then(success => {
    process.exit(success ? 0 : 1);
});
