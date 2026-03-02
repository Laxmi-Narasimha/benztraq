// Run tasks table migration via Supabase REST SQL endpoint
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8').split('\n').reduce((a, l) => {
    const m = l.match(/^([^=]+)=(.*)$/);
    if (m) a[m[1]] = m[2].replace(/^"|"$/g, '').replace(/\\r|\\n/g, '');
    return a;
}, {});

const url = env['NEXT_PUBLIC_SUPABASE_URL'];
const key = env['SUPABASE_SERVICE_ROLE_KEY'];

const sql = fs.readFileSync('supabase/migrations/035_tasks_module.sql', 'utf-8');

async function run() {
    console.log('Running migration against:', url);

    const res = await fetch(`${url}/rest/v1/rpc/`, {
        method: 'POST',
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
        },
    });

    // Use the SQL endpoint directly
    const sqlRes = await fetch(`${url}/pg`, {
        method: 'POST',
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
    });

    if (sqlRes.ok) {
        const data = await sqlRes.json();
        console.log('Migration result:', JSON.stringify(data, null, 2));
    } else {
        console.log('SQL endpoint not available, trying alternative...');

        // Alternative: use supabase-js to check if table exists and create via individual queries
        const { createClient } = await import('@supabase/supabase-js');
        const sb = createClient(url, key);

        // Check if tasks table already exists
        const { data, error } = await sb.from('tasks').select('id').limit(0);

        if (error && error.code === '42P01') {
            console.log('Tasks table does not exist. Please run this SQL in the Supabase Dashboard SQL Editor:');
            console.log('URL: https://supabase.com/dashboard/project/qyovguexmivhvefgbmkg/sql/new');
            console.log('\n--- COPY BELOW ---\n');
            console.log(sql);
            console.log('\n--- COPY ABOVE ---');
        } else if (!error) {
            console.log('✓ Tasks table already exists!');
        } else {
            console.log('Error:', error.message);
        }
    }
}

run().catch(e => console.error(e));
