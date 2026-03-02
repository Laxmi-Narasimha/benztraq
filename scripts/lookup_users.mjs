import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

function loadEnv() {
    const text = fs.readFileSync('.env.local', 'utf-8');
    const env = {};
    for (const line of text.split('\n')) {
        const idx = line.indexOf('=');
        if (idx === -1) continue;
        const key = line.substring(0, idx).trim();
        let val = line.substring(idx + 1).trim();
        if (val.startsWith('"')) val = val.slice(1);
        if (val.endsWith('"')) val = val.slice(0, -1);
        if (val.endsWith('\r')) val = val.slice(0, -1);
        val = val.replace(/\\r\\n/g, '');
        env[key] = val;
    }
    return env;
}
const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    // Search for: tarun, jayshree/chennai, udit/it@benz, vivek, pulak, sateesh, vikas, mahesh, rohit, neeraj, aman, anshul, shyam, manan
    const { data, error } = await sb.from('profiles').select('user_id, full_name, email, role').order('full_name');
    if (error) { console.error(error); return; }

    const search = ['tarun', 'jayshree', 'chennai', 'udit', 'it@benz', 'vivek', 'pulak', 'sateesh', 'vikas',
        'mahesh', 'rohit', 'neeraj', 'aman', 'anshul', 'shyam', 'manan', 'chaitanya', 'prashansa', 'laxmi'];

    console.log('=== Matching profiles ===');
    for (const p of data) {
        const name = (p.full_name || '').toLowerCase();
        const email = (p.email || '').toLowerCase();
        if (search.some(s => name.includes(s) || email.includes(s))) {
            console.log(`  ${p.full_name || 'NO NAME'} | ${p.email} | ${p.user_id}`);
        }
    }
    console.log('\nTotal profiles:', data.length);
}
main();
