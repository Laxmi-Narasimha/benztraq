import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getEnv() {
    const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
    const vars = {};
    for (const line of envFile.split('\n')) {
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        const eq = t.indexOf('=');
        if (eq === -1) continue;
        let k = t.substring(0, eq).trim();
        let val = t.substring(eq + 1).trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        val = val.replace(/\\r\\n/g, '').trim();
        vars[k] = val;
    }
    return vars;
}

const env = getEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: visits } = await supabase.from('sales_visits').select('visit_date');
    console.log('Total visits:', visits?.length || 0);
    if (visits?.length) {
        console.log('Sample visit dates:', visits.slice(0, 5).map(v => v.visit_date));
    }

    // Also let's check profile lookups exactly as the API does
    const ASM_EMAILS = [
        'wh.jaipur@benz-packaging.com', // Rajasthan
        'angr@benz-packaging.com',      // Karnataka
        'banglore@benz-packaging.com',  // Karnataka (actual)
        'it@benz-packaging.com',        // Noida
        'rfq@benz-packaging.com',       // Maharashtra
        'west@benz-packaging.com',      // West Zone
        'abhishek@benz-packaging.com'   // Madhya Pradesh
    ];

    const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, role')
        .in('email', ASM_EMAILS)
        .eq('is_active', true);

    console.log('ASM Profiles found by API query:', profiles?.length || 0);
    if (profiles?.length) {
        console.log('Emails found:', profiles.map(p => p.email));
    }
}
run();
