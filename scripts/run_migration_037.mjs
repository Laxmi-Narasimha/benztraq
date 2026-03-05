/**
 * Run Migration 037 via Supabase Postgres REST
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getEnv() {
    const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
    const vars = {};
    for (const line of envFile.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.substring(0, eqIdx).trim();
        let val = trimmed.substring(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"'))) val = val.slice(1, -1);
        val = val.replace(/\\r\\n/g, '').trim();
        vars[key] = val;
    }
    return vars;
}

const env = getEnv();
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;

async function execSQL(sql) {
    // Use Supabase's internal SQL execution via PostgREST
    // We'll create a temporary function to execute DDL
    const createFuncSQL = `
        CREATE OR REPLACE FUNCTION exec_sql(query text) RETURNS void AS $$
        BEGIN EXECUTE query; END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    // First create the exec_sql function via the schema endpoint
    const headers = {
        'Content-Type': 'application/json',
        'apikey': KEY,
        'Authorization': `Bearer ${KEY}`,
        'Prefer': 'return=minimal',
    };

    // Try creating the function first
    console.log('Creating exec_sql function...');
    const fnRes = await fetch(`${URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: createFuncSQL }),
    });
    console.log('Function creation:', fnRes.status);

    // Execute each statement
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 10 && !s.startsWith('--'));

    console.log(`\n${statements.length} statements to execute...`);

    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        const preview = stmt.substring(0, 70).replace(/\n/g, ' ');

        const res = await fetch(`${URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ query: stmt + ';' }),
        });

        if (res.ok || res.status === 204) {
            console.log(`  [${i + 1}] ✓ ${preview}`);
        } else {
            const body = await res.text();
            console.log(`  [${i + 1}] ⚠ (${res.status}) ${preview}`);
            console.log(`         ${body.substring(0, 120)}`);
        }
    }
}

async function run() {
    console.log('Supabase URL:', URL);
    console.log('Key length:', KEY.length);

    // Test connectivity
    const testRes = await fetch(`${URL}/rest/v1/profiles?select=user_id&limit=1`, {
        headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` },
    });
    console.log('Test connection:', testRes.status);
    if (testRes.status !== 200) {
        console.error('Cannot connect:', await testRes.text());
        return;
    }

    // Check if tables already exist
    const chk = await fetch(`${URL}/rest/v1/sales_visits?select=id&limit=1`, {
        headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` },
    });
    if (chk.status === 200) {
        console.log('\n✓ Tables already exist! Skipping migration.');
        return;
    }

    console.log('\nTables do not exist yet. Running migration...');
    const sqlFile = path.join(__dirname, '..', 'supabase', 'migrations', '037_sales_visits_and_performance.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    await execSQL(sql);

    // Verify
    console.log('\nVerifying...');
    const v1 = await fetch(`${URL}/rest/v1/sales_visits?select=id&limit=1`, {
        headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` },
    });
    console.log('sales_visits:', v1.status === 200 ? '✓ OK' : `✗ ${v1.status}`);

    const v2 = await fetch(`${URL}/rest/v1/asm_monthly_snapshots?select=id&limit=1`, {
        headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` },
    });
    console.log('asm_monthly_snapshots:', v2.status === 200 ? '✓ OK' : `✗ ${v2.status}`);
}

run().catch(console.error);
