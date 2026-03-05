/**
 * Seed Synthetic Visit Data — 12 months for ALL 6 ASMs
 * Looks up by EMAIL (reliable) not full_name
 */
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

// ASM definitions — keyed by EMAIL for reliable lookup
const ASM_DEFS = [
    { email: 'abhishek@benz-packaging.com', region: 'Madhya Pradesh', visitFreq: 18, quoteRate: 0.45, winRate: 0.35, avgDeal: 180000 },
    { email: 'wh.jaipur@benz-packaging.com', region: 'Rajasthan', visitFreq: 14, quoteRate: 0.38, winRate: 0.28, avgDeal: 150000 },
    { email: 'banglore@benz-packaging.com', region: 'Karnataka', visitFreq: 22, quoteRate: 0.35, winRate: 0.25, avgDeal: 200000 },
    { email: 'rfq@benz-packaging.com', region: 'Maharashtra', visitFreq: 12, quoteRate: 0.30, winRate: 0.20, avgDeal: 160000 },
    { email: 'it@benz-packaging.com', region: 'Noida', visitFreq: 8, quoteRate: 0.25, winRate: 0.18, avgDeal: 120000 },
    { email: 'west@benz-packaging.com', region: 'West Zone', visitFreq: 16, quoteRate: 0.40, winRate: 0.30, avgDeal: 170000 },
];

const VISIT_TYPES = ['meeting', 'cold_call', 'follow_up', 'demo', 'phone_call'];
const CUSTOMER_NAMES = [
    'Tata Motors Ltd', 'Maruti Suzuki', 'Bajaj Auto', 'Hero MotoCorp', 'Mahindra & Mahindra',
    'Godrej Industries', 'L&T Limited', 'Thermax Ltd', 'Siemens India', 'ABB India',
    'BHEL', 'Crompton Greaves', 'Voltas Ltd', 'Blue Star', 'Havells India',
    'Asian Paints', 'Berger Paints', 'Pidilite Industries', 'Exide Industries', 'Amara Raja',
    'JK Cement', 'Ultratech Cement', 'ACC Limited', 'Dalmia Bharat', 'JSW Steel',
    'Tata Steel', 'Hindalco', 'NALCO', 'Vedanta Ltd', 'SAIL',
    'Bosch India', 'Continental AG', 'Schaeffler India', 'SKF India', 'Cummins India',
    'Kirloskar', 'Ashok Leyland', 'Eicher Motors', 'Force Motors', 'SML Isuzu',
];
const NOTES = [
    'Discussed VCI packaging requirements', 'Product demo for shrink wrapping machine',
    'Follow-up on quotation', 'Contract negotiation for export packaging',
    'Site visit for custom crate assessment', 'Reviewed industrial packaging needs',
    'Presented new desiccant solutions', 'Discussed annual maintenance contract',
    'Technical consultation for corrosion protection', 'Visited warehouse for packaging audit',
];

function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomVariation(base, pct) { return base * (1 + (Math.random() * 2 - 1) * pct); }

async function run() {
    console.log('🚀 Seeding synthetic data for ALL 6 ASMs...\n');

    // Step 1: Get ALL ASM profiles by email
    const emails = ASM_DEFS.map(a => a.email);
    const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('email', emails);

    if (pErr) { console.error('Error:', pErr.message); return; }

    // Map email → profile
    const profileByEmail = {};
    (profiles || []).forEach(p => { profileByEmail[p.email] = p; });

    console.log('Found profiles:');
    for (const def of ASM_DEFS) {
        const p = profileByEmail[def.email];
        console.log(`  ${def.region}: ${p ? `✓ ${p.full_name} (${p.user_id})` : '✗ NOT FOUND'}`);
    }

    const foundAsms = ASM_DEFS.filter(d => profileByEmail[d.email]);
    if (foundAsms.length < 6) {
        console.log(`\n⚠ Only ${foundAsms.length}/6 ASMs found. Proceeding with those.`);
    }

    // Step 2: Get customers
    const { data: customers } = await supabase.from('customers').select('id, name').limit(40);
    const customerList = customers || [];
    console.log(`\nFound ${customerList.length} customers`);

    // Step 3: Clear old visit data for these ASMs
    console.log('\nClearing old data...');
    for (const def of foundAsms) {
        const uid = profileByEmail[def.email].user_id;
        await supabase.from('sales_visits').delete().eq('user_id', uid);
    }
    await supabase.from('asm_monthly_snapshots').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('Cleared ✓');

    // Step 4: Generate 12 months of visits (Apr 2025 → Mar 2026)
    const allVisits = [];
    for (const def of foundAsms) {
        const uid = profileByEmail[def.email].user_id;
        const profileName = profileByEmail[def.email].full_name;
        console.log(`\n📊 ${def.region} (${profileName})...`);

        for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
            const m = ((3 + monthOffset) % 12) + 1; // April=4 ... March=3
            const y = monthOffset < 9 ? 2025 : 2026;
            const daysInMonth = new Date(y, m, 0).getDate();
            const seasonalFactor = (m >= 10 || m <= 3) ? 1.2 : (m >= 4 && m <= 6) ? 0.9 : 1.0;
            const monthVisits = Math.round(randomVariation(def.visitFreq, 0.25) * seasonalFactor);

            for (let v = 0; v < monthVisits; v++) {
                const day = randomInt(1, Math.min(28, daysInMonth));
                const visitDate = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                let outcome;
                const rand = Math.random();
                if (rand < def.quoteRate * 0.3) outcome = 'quotation_sent';
                else if (rand < def.quoteRate * 0.3 + 0.08) outcome = 'order_placed';
                else if (rand < 0.55) outcome = 'follow_up_needed';
                else outcome = 'no_outcome';

                const customer = customerList.length > 0
                    ? randomChoice(customerList)
                    : { id: null, name: randomChoice(CUSTOMER_NAMES) };

                allVisits.push({
                    user_id: uid,
                    customer_id: customer.id || null,
                    customer_name: customer.name || randomChoice(CUSTOMER_NAMES),
                    visit_date: visitDate,
                    visit_type: randomChoice(VISIT_TYPES),
                    outcome,
                    notes: randomChoice(NOTES),
                    duration_minutes: randomInt(20, 120),
                });
            }
        }
    }

    console.log(`\n📝 Inserting ${allVisits.length} visits...`);
    const batchSize = 100;
    let inserted = 0;
    for (let i = 0; i < allVisits.length; i += batchSize) {
        const batch = allVisits.slice(i, i + batchSize);
        const { error } = await supabase.from('sales_visits').insert(batch);
        if (error) console.error(`  Batch ${Math.floor(i / batchSize) + 1} error:`, error.message);
        else inserted += batch.length;
    }
    console.log(`✅ Inserted ${inserted}/${allVisits.length} visits`);

    // Step 5: Per-ASM summary
    console.log('\n--- Per-ASM Summary ---');
    for (const def of foundAsms) {
        const uid = profileByEmail[def.email].user_id;
        const { count } = await supabase.from('sales_visits').select('*', { count: 'exact', head: true }).eq('user_id', uid);
        console.log(`  ${def.region}: ${count} visits`);
    }

    console.log('\n🎉 Done! All ASMs seeded.');
}

run().catch(console.error);
