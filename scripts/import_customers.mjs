/**
 * Import customers from Odoo CSV via the live BenzTraq API
 * 
 * Steps:
 *  1. Parse CSV (City, Complete Name)
 *  2. Remove duplicates (case-insensitive name match)
 *  3. Remove test/demo/internal/irrelevant entries
 *  4. Sort alphabetically
 *  5. Login to get session cookie
 *  6. POST each customer to /api/customers
 * 
 * Run: node scripts/import_customers.mjs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE_URL = 'https://benztraq.vercel.app';
const LOGIN_EMAIL = 'laxmi@benz-packaging.com';
const LOGIN_PASSWORD = 'Benz@2024';

// ── Exclusion patterns (case-insensitive) ──
const EXCLUDE_PATTERNS = [
    // Test / demo
    /^test\b/i, /^demo\b/i, /\bdemo\b.*\bltd\b/i,
    // Benz Packaging itself (internal)
    /^benz packaging/i,
    // US government / tax entities (not Indian customers)
    /\bdepartment of\b/i, /\binternal revenue service\b/i,
    /\bfinance department\b/i, /\btreasury division\b/i,
    /\bstate of california\b/i, /\bnevada\b.*\brehabilitation\b/i,
    /^alabama\b/i, /^colorado\b/i, /^aurora\b/i, /^greenwood village\b/i,
    /\bwa esd\b/i, /\bal dol\b/i,
    // Generic single-name people (likely contractors, not companies)
    /^gopal$/i, /^preeti$/i, /^suman$/i, /^vaidic$/i, /^rampravesh$/i,
    /^neha gehlot$/i, /^vipin sharma$/i, /^swati rana$/i,
    /^mohit sharma$/i, /^narender singh$/i, /^praveen kumar$/i,
    /^mukesh kumar$/i, /^sateesh kumar$/i, /^mohd\. khurshid$/i,
    /^zahir ahmed munna$/i, /^wazir singh$/i, /^ravinder kumar$/i,
    /^rajinder kumar$/i, /^sunil kumar$/i,
    // Personal names / contractors explicitly marked
    /\bcontractor\b/i, /\bcont[\.\)]/i, /\b-\s*cont\b/i, /\bcont$/i,
    /\bplumber\b/i, /\btea maker\b/i, /\btea material\b/i,
    /\bpaint cont\b/i, /\bcarpanter\b/i,
    // Airtel / Jio / Vodafone (telecom accounts, not customers)
    /^airtel relationship/i, /^reliance jio/i, /^vodafone idea/i,
    /^jio digital life/i,
    // ABC/misc non-real
    /^abc multan calculator/i, /^abc pvt ltd$/i,
];

function shouldExclude(name) {
    return EXCLUDE_PATTERNS.some(pattern => pattern.test(name));
}

// ── Normalize for dedup ──
function normalizeForDedup(name) {
    return name
        .toUpperCase()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s&]/g, '')
        .replace(/\s*(PVT|PRIVATE|LIMITED|LTD|P LTD|PVTLTD|CO|COMPANY|CORP|CORPORATION|INC|LLP)\s*/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// ── Parse CSV ──
function parseCSV(filePath) {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').slice(1);
    const entries = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        let city = '', name = '';

        // Handle: "city with comma","name" or city,name
        if (trimmed.startsWith('"')) {
            // Find closing quote for city
            const closingQuote = trimmed.indexOf('"', 1);
            if (closingQuote > 0) {
                city = trimmed.slice(1, closingQuote);
                // Rest after ,"
                const rest = trimmed.slice(closingQuote + 1).replace(/^,/, '').replace(/^"|"$/g, '').trim();
                name = rest;
            }
        } else {
            const commaIdx = trimmed.indexOf(',');
            if (commaIdx === -1) continue;
            city = trimmed.slice(0, commaIdx).trim();
            name = trimmed.slice(commaIdx + 1).trim();
        }

        // Also handle name being quoted: ,"Govt. Of India, Ministry..."
        if (name.startsWith('"') && name.endsWith('"')) {
            name = name.slice(1, -1);
        }

        name = name.replace(/\r/g, '').replace(/_x000D_/g, '').trim();
        if (!name) continue;

        entries.push({ name, city: city || null });
    }

    return entries;
}

// ── Login ──
async function login() {
    console.log(`🔐 Logging in as ${LOGIN_EMAIL}...`);
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: LOGIN_EMAIL,
            password: LOGIN_PASSWORD,
            selectedCompany: 'benz',
        }),
        redirect: 'manual',
    });

    const cookies = res.headers.getSetCookie?.() || [];
    const cookieStr = cookies.map(c => c.split(';')[0]).join('; ');

    if (!cookieStr) {
        // Try parsing from raw headers
        const raw = res.headers.raw?.()?.['set-cookie'] || [];
        const fallback = raw.map(c => c.split(';')[0]).join('; ');
        if (fallback) return fallback;

        const body = await res.text();
        console.error('Login failed:', body);
        return null;
    }

    console.log('✅ Logged in successfully');
    return cookieStr;
}

// ── Create customer ──
async function createCustomer(entry, cookies) {
    const res = await fetch(`${BASE_URL}/api/customers`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': cookies,
        },
        body: JSON.stringify({
            name: entry.name,
            city: entry.city,
            company_type: 'company',
            is_company: true,
            country_id: 'IN',
        }),
    });

    if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: body };
    }

    return { ok: true };
}

async function main() {
    console.log('\n📦 BenzTraq — Customer Import from Odoo CSV\n');

    // 1. Parse CSV
    const csvPath = path.join(__dirname, '..', 'Contact (res.partner).csv');
    const rawEntries = parseCSV(csvPath);
    console.log(`📋 Total CSV rows: ${rawEntries.length}`);

    // 2. Filter out test/demo/contractors/irrelevant
    const filtered = rawEntries.filter(e => !shouldExclude(e.name));
    console.log(`🧹 After filtering test/demo/contractors: ${filtered.length}`);

    // 3. Deduplicate by normalized name
    const seen = new Map();
    const unique = [];
    for (const entry of filtered) {
        const key = normalizeForDedup(entry.name);
        if (!seen.has(key)) {
            seen.set(key, true);
            unique.push(entry);
        }
    }
    console.log(`🔄 After removing duplicates: ${unique.length}`);

    // 4. Sort alphabetically
    unique.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));

    // 5. Login
    const cookies = await login();
    if (!cookies) {
        console.error('Cannot proceed without authentication');
        return;
    }

    // 6. Insert customers
    let inserted = 0, skipped = 0, failed = 0;

    for (let i = 0; i < unique.length; i++) {
        const entry = unique[i];
        const result = await createCustomer(entry, cookies);

        if (result.ok) {
            inserted++;
        } else if (result.error?.includes('already exists')) {
            skipped++;
        } else {
            failed++;
            if (failed <= 5) {
                console.log(`   ❌ ${entry.name}: ${result.error?.slice(0, 100)}`);
            }
        }

        // Progress update every 50
        if ((i + 1) % 50 === 0 || i === unique.length - 1) {
            process.stdout.write(`\r   ⏳ ${i + 1}/${unique.length} — ✅${inserted} 🔄${skipped} ❌${failed}`);
        }

        // Small delay to avoid rate limiting
        if ((i + 1) % 10 === 0) {
            await new Promise(r => setTimeout(r, 100));
        }
    }

    console.log(`\n\n✅ Done!`);
    console.log(`   📊 Inserted: ${inserted}`);
    console.log(`   🔄 Skipped (existing): ${skipped}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`🔗 View at: ${BASE_URL}/contacts\n`);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
