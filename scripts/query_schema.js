/**
 * Direct Database Schema Query - Using Supabase Client
 * Query database schema using the @supabase/supabase-js client
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qyovguexmivhvefgbmkg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5b3ZndWV4bWl2aHZlZmdibWtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk5OTI5MSwiZXhwIjoyMDUwNTc1MjkxfQ.JcmOWIyNZKq9wAYBqQ7p8OQHPN0czpVGLKbZzKXN1Qc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectDatabase() {
    console.log('🔍 Inspecting Production Database\n');

    try {
        // Query 1: List all tables
        console.log('📊 Querying all tables in public schema...\n');
        const { data: tables, error: tablesError } = await supabase
            .rpc('exec_sql', {
                query: `
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    ORDER BY table_name;
                `
            });

        if (tablesError) {
            console.log('❌ RPC not available, trying alternative...\n');

            // Try querying known tables directly
            const knownTables = [
                'asms', 'annual_targets', 'customers', 'documents',
                'ergopack_contacts', 'ergopack_activities',
                'pricelists', 'products', 'quotations', 'users'
            ];

            console.log('Checking known tables:\n');
            for (const tableName of knownTables) {
                const { count, error } = await supabase
                    .from(tableName)
                    .select('*', { count: 'exact', head: true });

                if (!error) {
                    console.log(`✅ ${tableName.padEnd(25)} - ${count || 0} rows`);
                } else {
                    console.log(`❌ ${tableName.padEnd(25)} - ${error.message}`);
                }
            }

            // Get a sample from documents to see its structure
            console.log('\n📄 Documents table structure:\n');
            const { data: docSample, error: docError } = await supabase
                .from('documents')
                .select('*')
                .limit(1);

            if (!docError && docSample && docSample.length > 0) {
                const columns = Object.keys(docSample[0]);
                console.log('Columns:', columns.join(', '));
                console.log('\nSample record:');
                console.log(JSON.stringify(docSample[0], null, 2));
            }

            // Try to get constraint information using pg_catalog directly
            console.log('\n🔗 Attempting to get foreign key constraints...\n');

            // Use REST API directly
            const response = await fetch(
                `${supabaseUrl}/rest/v1/rpc/exec_sql`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': supabaseServiceKey,
                        'Authorization': `Bearer ${supabaseServiceKey}`
                    },
                    body: JSON.stringify({
                        query: `
                            SELECT
                                conname AS constraint_name,
                                conrelid::regclass AS table_name,
                                confrelid::regclass AS foreign_table,
                                pg_get_constraintdef(oid) AS definition
                            FROM pg_constraint
                            WHERE conrelid = 'documents'::regclass
                            AND contype = 'f';
                        `
                    })
                }
            );

            if (response.ok) {
                const result = await response.json();
                console.log('Foreign key constraints on documents:');
                console.log(JSON.stringify(result, null, 2));
            } else {
                const error = await response.text();
                console.log('❌ Cannot query constraints:', error);

                // Last resort: just show what we know
                console.log('\n⚠️  Cannot access pg_catalog directly');
                console.log('The constraint exists but we need to use Supabase Dashboard SQL Editor');
            }

        } else {
            console.log('✅ Tables found:');
            console.log(tables);
        }

    } catch (err) {
        console.error('❌ Error:', err.message);
        console.error(err);
    }
}

inspectDatabase();
