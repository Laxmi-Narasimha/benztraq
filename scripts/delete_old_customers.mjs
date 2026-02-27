/**
 * Delete OLD customers that existed before the CSV import
 * The new import happened on 2026-02-27, so delete everything before that date.
 * 
 * Run: node scripts/delete_old_customers.mjs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE_URL = 'https://benztraq.vercel.app';
const LOGIN_EMAIL = 'laxmi@benz-packaging.com';
const LOGIN_PASSWORD = 'Benz@2024';

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

async function main() {
    console.log('\n🗑️  BenzTraq — Delete Old Customers\n');

    const cookies = await login();
    if (!cookies) return;

    // 1. Fetch ALL customers to find old ones
    console.log('📋 Fetching all customers...');
    const res = await fetch(`${BASE_URL}/api/customers?limit=5000&sort_by=created_at&sort_order=asc`, {
        headers: { 'Cookie': cookies },
    });
    const data = await res.json();
    const allCustomers = data.customers || [];
    console.log(`   Total in DB: ${allCustomers.length}`);

    if (allCustomers.length === 0) {
        console.log('No customers found. Exiting.');
        return;
    }

    // The import ran on 2026-02-27. Old customers were created before that.
    // Import started around ~11:00 UTC (16:30 IST), let's use a generous cutoff
    const CUTOFF = '2026-02-27T00:00:00Z';

    const oldCustomers = allCustomers.filter(c => {
        const created = new Date(c.created_at);
        return created < new Date(CUTOFF);
    });

    const newCustomers = allCustomers.filter(c => {
        const created = new Date(c.created_at);
        return created >= new Date(CUTOFF);
    });

    console.log(`   📅 Old (before ${CUTOFF}): ${oldCustomers.length}`);
    console.log(`   🆕 New (imported today): ${newCustomers.length}`);

    if (oldCustomers.length === 0) {
        console.log('\n✅ No old customers to delete.');
        return;
    }

    // 2. Delete old customers one by one
    console.log(`\n🗑️  Deleting ${oldCustomers.length} old customers...\n`);
    let deleted = 0, failedDel = 0;

    for (let i = 0; i < oldCustomers.length; i++) {
        const customer = oldCustomers[i];

        const delRes = await fetch(`${BASE_URL}/api/customers/${customer.id}`, {
            method: 'DELETE',
            headers: { 'Cookie': cookies },
        });

        if (delRes.ok) {
            deleted++;
        } else {
            // Try soft-delete (set active=false) as fallback
            const patchRes = await fetch(`${BASE_URL}/api/customers/${customer.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': cookies,
                },
                body: JSON.stringify({ active: false }),
            });
            if (patchRes.ok) {
                deleted++;
            } else {
                failedDel++;
                if (failedDel <= 3) {
                    console.log(`   ❌ Failed to delete: ${customer.name} (${customer.id})`);
                }
            }
        }

        if ((i + 1) % 25 === 0 || i === oldCustomers.length - 1) {
            process.stdout.write(`\r   ⏳ ${i + 1}/${oldCustomers.length} — 🗑️${deleted} ❌${failedDel}`);
        }

        if ((i + 1) % 10 === 0) {
            await new Promise(r => setTimeout(r, 100));
        }
    }

    console.log(`\n\n✅ Done!`);
    console.log(`   🗑️  Deleted: ${deleted}`);
    console.log(`   ❌ Failed: ${failedDel}`);
    console.log(`   🆕 Remaining: ${newCustomers.length} (imported customers)`);
    console.log(`🔗 View at: ${BASE_URL}/contacts\n`);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
