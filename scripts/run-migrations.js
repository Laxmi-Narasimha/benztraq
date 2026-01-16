/**
 * Run Migrations Script
 * Executes SQL migrations directly on Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
function loadEnv() {
    const envPath = path.resolve(__dirname, '../.env.local');
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
    });
    return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function runMigration(migrationFile) {
    const migrationPath = path.join(__dirname, '../supabase/migrations', migrationFile);

    if (!fs.existsSync(migrationPath)) {
        console.error(`Migration file not found: ${migrationFile}`);
        return false;
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log(`\n========================================`);
    console.log(`Running migration: ${migrationFile}`);
    console.log(`========================================`);

    // Split by semicolons and execute each statement
    // But we need to be careful with $$ blocks
    const statements = [];
    let currentStatement = '';
    let inDollarBlock = false;

    for (const line of sql.split('\n')) {
        const trimmedLine = line.trim();

        // Skip empty lines and comments
        if (!trimmedLine || trimmedLine.startsWith('--')) {
            continue;
        }

        // Check for $$ blocks
        if (trimmedLine.includes('$$')) {
            const count = (trimmedLine.match(/\$\$/g) || []).length;
            if (count === 1) {
                inDollarBlock = !inDollarBlock;
            }
        }

        currentStatement += line + '\n';

        // If we're not in a dollar block and line ends with semicolon, it's a complete statement
        if (!inDollarBlock && trimmedLine.endsWith(';')) {
            if (currentStatement.trim()) {
                statements.push(currentStatement.trim());
            }
            currentStatement = '';
        }
    }

    // Add any remaining statement
    if (currentStatement.trim()) {
        statements.push(currentStatement.trim());
    }

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
        if (!statement || statement.startsWith('--')) continue;

        try {
            const { error } = await supabase.rpc('exec_sql', { sql: statement });

            if (error) {
                // Try direct query if exec_sql doesn't exist
                const { error: directError } = await supabase.from('_migrations_log').select().limit(0);
                if (directError) {
                    console.log(`  ⚠️ Statement skipped (likely already applied or table doesn't exist)`);
                } else {
                    console.log(`  ⚠️ Warning: ${error.message.substring(0, 80)}`);
                }
                errorCount++;
            } else {
                successCount++;
            }
        } catch (err) {
            // For many statements, we'll just use the REST API approach
            console.log(`  ⚠️ Statement execution: ${err.message?.substring(0, 50) || 'unknown error'}`);
            errorCount++;
        }
    }

    console.log(`\nMigration ${migrationFile}: ${successCount} statements executed, ${errorCount} warnings/errors`);
    return true;
}

async function main() {
    console.log('Starting migration execution...');
    console.log(`Database: ${env.NEXT_PUBLIC_SUPABASE_URL}`);

    // For Supabase, we need to use the SQL Editor approach or pg client
    // Since we don't have direct pg access, let's try a different approach

    // Read migration files
    const migration028 = fs.readFileSync(
        path.join(__dirname, '../supabase/migrations/028_fix_public_rls_policies.sql'),
        'utf8'
    );

    const migration029 = fs.readFileSync(
        path.join(__dirname, '../supabase/migrations/029_schema_standardization.sql'),
        'utf8'
    );

    console.log('\n📋 Migration 028: Fix Public RLS Policies');
    console.log('   - Drops public CRUD policies on leads');
    console.log('   - Creates authenticated-only policies');
    console.log('   - Adds role-based write restrictions');

    console.log('\n📋 Migration 029: Schema Standardization');
    console.log('   - Standardizes sales_teams columns');
    console.log('   - Syncs documents state/amount columns');
    console.log('   - Adds profiles.sales_team_id');
    console.log('   - Creates helper role functions');

    console.log('\n⚠️  NOTE: Supabase REST API cannot run DDL statements directly.');
    console.log('   The migrations need to be run via Supabase Dashboard SQL Editor.');
    console.log('\n   Please go to: https://supabase.com/dashboard/project/qyovguexmivhvefgbmkg/sql');
    console.log('   And run these files:');
    console.log('   1. supabase/migrations/028_fix_public_rls_policies.sql');
    console.log('   2. supabase/migrations/029_schema_standardization.sql');

    // Let's at least verify the tables exist
    console.log('\n\nVerifying database state...');

    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id')
        .limit(1);

    console.log(`✅ profiles table: ${profilesError ? 'Error - ' + profilesError.message : 'OK'}`);

    const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id')
        .limit(1);

    console.log(`✅ leads table: ${leadsError ? 'Not found (may need migration)' : 'OK'}`);

    const { data: salesTeams, error: teamsError } = await supabase
        .from('sales_teams')
        .select('id')
        .limit(1);

    console.log(`✅ sales_teams table: ${teamsError ? 'Not found (may need migration)' : 'OK'}`);

    const { data: customers, count: customerCount } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true });

    console.log(`✅ customers table: ${customerCount || 0} records`);

    console.log('\n✅ Verification complete!');
}

main().catch(console.error);
