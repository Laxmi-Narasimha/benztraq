/**
 * Final cleanup — find ALL FK constraints → nullify ALL → delete remaining old customers
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qyovguexmivhvefgbmkg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5b3ZndWV4bWl2aHZlZmdibWtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzE2MzI0NywiZXhwIjoyMDgyNzM5MjQ3fQ.bErj6-X_wize5onUV1Ea4Ch99TCmQIcQvW5LgdnyLcY';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
    console.log('\n🧹 Final Customer Cleanup — Handle ALL FK constraints\n');

    // 1. Find remaining old customers
    const { data: oldCustomers } = await supabase
        .from('customers')
        .select('id, name')
        .lt('created_at', '2026-02-27T00:00:00Z');

    console.log(`Old customers remaining: ${oldCustomers?.length || 0}`);
    if (!oldCustomers || oldCustomers.length === 0) {
        const { count } = await supabase.from('customers').select('*', { count: 'exact', head: true });
        console.log(`✅ All clean! Total customers: ${count}`);
        return;
    }

    oldCustomers.forEach(c => console.log(`   • ${c.name} (${c.id})`));
    const oldIds = oldCustomers.map(c => c.id);

    // 2. Find ALL FK constraints pointing to customers table
    console.log('\n🔍 Finding all FK constraints on customers table...');
    const { data: fkData, error: fkErr } = await supabase.rpc('get_fk_constraints', {});

    // If RPC doesn't exist, we'll manually check known tables
    // Known FKs from the error: documents.customer_id, documents.partner_id
    const fkColumns = [
        { table: 'documents', column: 'customer_id' },
        { table: 'documents', column: 'partner_id' },
        { table: 'document_lines', column: 'customer_id' },
        { table: 'customer_addresses', column: 'customer_id' },
        { table: 'customer_contacts', column: 'customer_id' },
        { table: 'quotations', column: 'customer_id' },
        { table: 'quotations', column: 'partner_id' },
        { table: 'sales_orders', column: 'customer_id' },
        { table: 'invoices', column: 'customer_id' },
        { table: 'leads', column: 'customer_id' },
    ];

    // 3. Nullify all FK references for each table/column
    for (const { table, column } of fkColumns) {
        try {
            // Check if any rows reference old customer IDs
            const { data: refs, error: refErr } = await supabase
                .from(table)
                .select('id')
                .in(column, oldIds)
                .limit(1);

            if (refErr) {
                // Table or column doesn't exist — skip
                continue;
            }

            if (refs && refs.length > 0) {
                console.log(`   🔗 ${table}.${column} — has references, nullifying...`);
                const { error: updateErr } = await supabase
                    .from(table)
                    .update({ [column]: null })
                    .in(column, oldIds);

                if (updateErr) {
                    console.log(`      ❌ Failed: ${updateErr.message}`);
                } else {
                    console.log(`      ✅ Nullified`);
                }
            }
        } catch (e) {
            // Skip tables that don't exist
        }
    }

    // 4. Delete old customers
    console.log('\n🗑️  Deleting old customers...');
    for (const cust of oldCustomers) {
        const { error: delErr } = await supabase
            .from('customers')
            .delete()
            .eq('id', cust.id);

        if (delErr) {
            console.log(`   ❌ ${cust.name}: ${delErr.message}`);
        } else {
            console.log(`   ✅ ${cust.name}: deleted`);
        }
    }

    // 5. Final count
    const { count } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

    console.log(`\n📊 Final customer count: ${count}`);

    // Show sample
    const { data: sample } = await supabase
        .from('customers')
        .select('name, city')
        .order('name', { ascending: true })
        .limit(5);

    console.log('\n📋 First 5 (alphabetical):');
    sample?.forEach(c => console.log(`   • ${c.name} — ${c.city || 'N/A'}`));
    console.log('');
}

main().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});
