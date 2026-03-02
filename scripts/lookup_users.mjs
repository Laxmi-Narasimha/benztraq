// Look up profiles to find user_ids for the 8 task assignees
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8').split('\n').reduce((a, l) => {
    const m = l.match(/^([^=]+)=(.*)$/);
    if (m) a[m[1]] = m[2].replace(/^"|"$/g, '').replace(/\\r|\\n/g, '');
    return a;
}, {});

const sb = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function main() {
    const { data, error } = await sb
        .from('profiles')
        .select('user_id, full_name, email, role')
        .order('full_name');

    if (error) { console.error(error); return; }

    // Search for the 8 people
    const names = ['dinesh', 'pradeep', 'shikha', 'preeti', 'isha', 'sandeep', 'satender', 'bhandari'];

    console.log('=== ALL PROFILES ===');
    data.forEach(p => {
        const match = names.some(n => (p.full_name || '').toLowerCase().includes(n) || (p.email || '').toLowerCase().includes(n));
        if (match) {
            console.log(`✓ ${p.full_name || 'NO NAME'} | ${p.email} | ${p.user_id} | ${p.role}`);
        }
    });

    console.log('\n=== DIRECTORS & ADMINS ===');
    data.filter(p => ['director', 'developer', 'head_of_sales', 'vp'].includes(p.role))
        .forEach(p => console.log(`  ${p.full_name} | ${p.email} | ${p.user_id} | ${p.role}`));

    console.log('\n=== TOTAL PROFILES:', data.length, '===');
}

main();
