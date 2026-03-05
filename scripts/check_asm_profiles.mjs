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

// Check all ASM-related profiles
const { data, error } = await supabase
    .from('profiles')
    .select('user_id, full_name, email, role, is_active')
    .or('full_name.in.(Madhya Pradesh,Rajasthan,Karnataka,Maharashtra,Noida,West Zone),email.in.(abhishek@benz-packaging.com,wh.jaipur@benz-packaging.com,banglore@benz-packaging.com,rfq@benz-packaging.com,it@benz-packaging.com,west@benz-packaging.com)');

if (error) { console.error('Error:', error.message); process.exit(1); }
console.log('All ASM-related profiles:');
data.forEach(p => console.log(`  ${p.full_name} | ${p.email} | ${p.user_id} | active=${p.is_active} | role=${p.role}`));
console.log(`Total: ${data.length}`);
