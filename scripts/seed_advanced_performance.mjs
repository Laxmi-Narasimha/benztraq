/**
 * Advanced Synthetic Data Seeder for Performance Dashboard
 * Seeds: Visits, Quotations, Sales Orders, and Targets
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

const ASM_DEFS = [
    { email: 'abhishek@benz-packaging.com', region: 'Madhya Pradesh', visitFreq: 18, quoteRate: 0.45, winRate: 0.35, avgDeal: 180000, target25: 6000000, target26: 7500000 },
    { email: 'wh.jaipur@benz-packaging.com', region: 'Rajasthan', visitFreq: 14, quoteRate: 0.38, winRate: 0.28, avgDeal: 150000, target25: 4500000, target26: 5500000 },
    { email: 'banglore@benz-packaging.com', region: 'Karnataka', visitFreq: 22, quoteRate: 0.35, winRate: 0.25, avgDeal: 200000, target25: 7500000, target26: 9000000 },
    { email: 'rfq@benz-packaging.com', region: 'Maharashtra', visitFreq: 12, quoteRate: 0.30, winRate: 0.20, avgDeal: 160000, target25: 4000000, target26: 5000000 },
    { email: 'it@benz-packaging.com', region: 'Noida', visitFreq: 8, quoteRate: 0.25, winRate: 0.18, avgDeal: 120000, target25: 2500000, target26: 3000000 },
    { email: 'west@benz-packaging.com', region: 'West Zone', visitFreq: 16, quoteRate: 0.40, winRate: 0.30, avgDeal: 170000, target25: 5500000, target26: 6500000 },
];

const CUSTOMER_NAMES = [
    'Tata Motors Ltd', 'Maruti Suzuki', 'Bajaj Auto', 'Hero MotoCorp', 'Mahindra & Mahindra',
    'Godrej Industries', 'L&T Limited', 'Thermax Ltd', 'Siemens India', 'ABB India'
];
const VISIT_TYPES = ['meeting', 'cold_call', 'follow_up', 'demo', 'phone_call'];

function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomVariation(base, pct) { return base * (1 + (Math.random() * 2 - 1) * pct); }
function addDays(dateStr, days) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}

async function run() {
    console.log('🚀 Seeding ADVANCED synthetic data for ALL 6 ASMs...\n');

    // 1. Get ASMs
    const emails = ASM_DEFS.map(a => a.email);
    const { data: profiles } = await supabase.from('profiles').select('user_id, full_name, email').in('email', emails);
    const profileByEmail = {};
    (profiles || []).forEach(p => { profileByEmail[p.email] = p; });

    const foundAsms = ASM_DEFS.filter(d => profileByEmail[d.email]);
    console.log(`Found ${foundAsms.length}/6 ASM profiles.`);

    // 2. Clear old data for these ASMs
    console.log('\nClearing old targets, visits, and documents...');
    for (const def of foundAsms) {
        const uid = profileByEmail[def.email].user_id;
        await supabase.from('sales_visits').delete().eq('user_id', uid);
        await supabase.from('annual_targets').delete().eq('salesperson_user_id', uid);
        await supabase.from('documents').delete().eq('salesperson_user_id', uid);
    }
    await supabase.from('asm_monthly_snapshots').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('Cleared ✓');

    // 3. Generate data
    const allVisits = [];
    const allDocs = [];
    const allTargets = [];

    let docCounter = 5000;

    for (const def of foundAsms) {
        const uid = profileByEmail[def.email].user_id;

        // Targets
        allTargets.push({ salesperson_user_id: uid, year: 2025, annual_target: def.target25, created_by: uid });
        allTargets.push({ salesperson_user_id: uid, year: 2026, annual_target: def.target26, created_by: uid });

        // Visits and Docs
        for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
            const m = ((3 + monthOffset) % 12) + 1; // Apr 2025 to Mar 2026
            const y = monthOffset < 9 ? 2025 : 2026;
            const daysInMonth = new Date(y, m, 0).getDate();
            const seasonalFactor = (m >= 10 || m <= 3) ? 1.2 : (m >= 4 && m <= 6) ? 0.9 : 1.0;
            const monthVisits = Math.round(randomVariation(def.visitFreq, 0.25) * seasonalFactor);

            for (let v = 0; v < monthVisits; v++) {
                const day = randomInt(1, Math.min(28, daysInMonth));
                const visitDate = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const customerName = randomChoice(CUSTOMER_NAMES);

                let outcome;
                const rand = Math.random();
                let quoteId = null;
                let dealSize = randomVariation(def.avgDeal, 0.4);

                if (rand < def.quoteRate * def.winRate) {
                    outcome = 'order_placed';
                    // Create Quotation
                    const qId = `00000000-0000-4000-8000-${String(docCounter++).padStart(12, '0')}`;
                    quoteId = qId;
                    allDocs.push({
                        id: qId, doc_type: 'quotation', name: `QTN-${y}-${docCounter}`, doc_number: `QTN-${y}-${docCounter}`,
                        salesperson_user_id: uid, customer_name_raw: customerName, grand_total: dealSize,
                        doc_date: visitDate, state: 'won', created_by: uid, created_at: visitDate + 'T10:00:00Z'
                    });

                    // Create linked Sales Order (few days later)
                    const soDate = addDays(visitDate, randomInt(2, 14));
                    const soId = `00000000-0000-4000-8000-${String(docCounter++).padStart(12, '0')}`;
                    allDocs.push({
                        id: soId, doc_type: 'sales_order', name: `SO-${y}-${docCounter}`, doc_number: `SO-${y}-${docCounter}`,
                        salesperson_user_id: uid, customer_name_raw: customerName, grand_total: dealSize,
                        doc_date: soDate, state: 'sale', original_quotation_id: qId, created_by: uid, created_at: soDate + 'T10:00:00Z'
                    });
                }
                else if (rand < def.quoteRate) {
                    outcome = 'quotation_sent';
                    // Open/Lost Quote
                    const qId = `00000000-0000-4000-8000-${String(docCounter++).padStart(12, '0')}`;
                    quoteId = qId;
                    const qState = Math.random() > 0.7 ? 'lost' : randomChoice(['draft', 'sent', 'negotiation']);
                    allDocs.push({
                        id: qId, doc_type: 'quotation', name: `QTN-${y}-${docCounter}`, doc_number: `QTN-${y}-${docCounter}`,
                        salesperson_user_id: uid, customer_name_raw: customerName, grand_total: dealSize,
                        doc_date: visitDate, state: qState, created_by: uid, created_at: visitDate + 'T10:00:00Z'
                    });
                }
                else if (rand < 0.6) outcome = 'follow_up_needed';
                else outcome = 'no_outcome';

                allVisits.push({
                    user_id: uid, customer_name: customerName, visit_date: visitDate,
                    visit_type: randomChoice(VISIT_TYPES), outcome, duration_minutes: randomInt(30, 90),
                    quotation_id: quoteId, notes: `Synthetic visit record`
                });
            }
        }
    }

    // 4. Insert data
    console.log(`\nInserting ${allTargets.length} targets...`);
    const { error: targetErr } = await supabase.from('annual_targets').insert(allTargets);
    if (targetErr) { console.error('TARGETS ERROR:', targetErr); throw targetErr; }

    console.log(`Inserting ${allDocs.length} documents...`);
    for (let i = 0; i < allDocs.length; i += 100) {
        const { error } = await supabase.from('documents').insert(allDocs.slice(i, i + 100));
        if (error) { console.error('DOCS ERROR:', error); throw error; }
    }

    console.log(`Inserting ${allVisits.length} visits...`);
    for (let i = 0; i < allVisits.length; i += 100) {
        const { error } = await supabase.from('sales_visits').insert(allVisits.slice(i, i + 100));
        if (error) { console.error('VISITS ERROR:', error); throw error; }
    }

    console.log('\n🎉 Advanced synthetic data seeded successfully!');
}

run().catch(console.error);
