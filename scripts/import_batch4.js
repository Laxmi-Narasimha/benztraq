/**
 * Import Batch 4 LOGIMAT Leads - PRODUCTION
 */
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://benztraq.vercel.app';
const CREDENTIALS = { email: 'laxmi@benz-packaging.com', password: 'Benz@2024' };

async function login() {
    console.log('🔐 Logging in as laxmi@benz-packaging.com...');
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(CREDENTIALS),
    });
    const result = await response.json();
    if (!result.success) throw new Error(`Login failed: ${result.error}`);
    console.log('✓ Login successful!\n');
    return response.headers.get('set-cookie');
}

async function importBatch4() {
    try {
        const sessionCookie = await login();
        const jsonPath = path.join(__dirname, '..', 'LEADS', 'extracted_leads_batch4.json');
        const leadsData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        console.log(`📋 Found ${leadsData.length} LOGIMAT BATCH 4 leads to import...\n`);

        let successCount = 0, failCount = 0;
        for (let i = 0; i < leadsData.length; i++) {
            const lead = leadsData[i];
            console.log(`[${i + 1}/${leadsData.length}] Importing: ${lead.companyName}...`);
            try {
                const response = await fetch(`${BASE_URL}/api/ergopack/contacts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Cookie': sessionCookie },
                    body: JSON.stringify(lead),
                });
                const result = await response.json();
                if (result.success) { console.log(`  ✓ Success`); successCount++; }
                else { console.error(`  ✗ Failed: ${result.error}`); failCount++; }
            } catch (error) { console.error(`  ✗ Error: ${error.message}`); failCount++; }
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        console.log(`\n========================================`);
        console.log(`📊 LOGIMAT BATCH 4 IMPORT COMPLETE`);
        console.log(`✓ Success: ${successCount} | ✗ Failed: ${failCount} | Total: ${leadsData.length}`);
        console.log(`========================================\n`);
    } catch (error) { console.error('❌ Fatal error:', error.message); process.exit(1); }
}

importBatch4();
