/**
 * Database Schema Inspector
 * Connects to Supabase and inspects all tables, columns, and constraints
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load production environment
dotenv.config({ path: join(__dirname, '..', '.env.production.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectSchema() {
    console.log('🔍 Inspecting Database Schema...\n');

    try {
        // Get all tables in public schema
        const { data: tables, error: tablesError } = await supabase.rpc('get_all_tables');

        if (tablesError) {
            // Fallback: Use information_schema
            const { data: allTables, error } = await supabase
                .from('information_schema.tables')
                .select('table_name')
                .eq('table_schema', 'public');

            if (error) {
                console.log('Trying alternative approach to list tables...');

                // Try to query specific known tables
                const knownTables = [
                    'users', 'user_profiles', 'auth_users',
                    'documents', 'customers', 'products',
                    'quotations', 'annual_targets', 'asms'
                ];

                console.log('\n📊 Checking known tables:\n');

                for (const tableName of knownTables) {
                    const { data, error, count } = await supabase
                        .from(tableName)
                        .select('*', { count: 'exact', head: true });

                    if (!error) {
                        console.log(`✅ ${tableName} - exists (${count || 0} rows)`);

                        // Get column info for this table
                        const { data: sample } = await supabase
                            .from(tableName)
                            .select('*')
                            .limit(1)
                            .single();

                        if (sample) {
                            console.log(`   Columns: ${Object.keys(sample).join(', ')}`);
                        }
                    } else {
                        console.log(`❌ ${tableName} - does not exist or no access`);
                    }
                }

                // Check documents table specifically
                console.log('\n📄 Documents Table Details:\n');
                const { data: docs, error: docsError } = await supabase
                    .from('documents')
                    .select('*')
                    .limit(1);

                if (!docsError && docs && docs.length > 0) {
                    console.log('Sample document record:');
                    console.log(JSON.stringify(docs[0], null, 2));
                }

                // Check constraints using raw SQL
                console.log('\n🔗 Checking Foreign Key Constraints on documents table:\n');
                const { data: constraints, error: constraintsError } = await supabase.rpc('exec_sql', {
                    query: `
                        SELECT
                            tc.constraint_name,
                            tc.table_name,
                            kcu.column_name,
                            ccu.table_name AS foreign_table_name,
                            ccu.column_name AS foreign_column_name
                        FROM information_schema.table_constraints AS tc
                        JOIN information_schema.key_column_usage AS kcu
                            ON tc.constraint_name = kcu.constraint_name
                        JOIN information_schema.constraint_column_usage AS ccu
                            ON ccu.constraint_name = tc.constraint_name
                        WHERE tc.constraint_type = 'FOREIGN KEY'
                        AND tc.table_name = 'documents';
                    `
                });

                if (!constraintsError) {
                    console.log('Foreign key constraints:', constraints);
                } else {
                    console.log('Could not fetch constraints via RPC, trying direct query...');

                    // Alternative: Use Supabase's raw SQL endpoint
                    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': supabaseServiceKey,
                            'Authorization': `Bearer ${supabaseServiceKey}`
                        },
                        body: JSON.stringify({
                            query: `
                                SELECT 
                                    conname as constraint_name,
                                    conrelid::regclass as table_name,
                                    confrelid::regclass as foreign_table,
                                    pg_get_constraintdef(oid) as definition
                                FROM pg_constraint
                                WHERE conrelid = 'documents'::regclass
                                AND contype = 'f';
                            `
                        })
                    });

                    if (response.ok) {
                        const result = await response.json();
                        console.log('Constraints:', result);
                    }
                }

                return;
            }
        }

        console.log('✅ Schema inspection complete');

    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

// Run inspection
inspectSchema().then(() => {
    console.log('\n✅ Inspection complete');
    process.exit(0);
}).catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
