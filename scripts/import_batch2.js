/**
 * Import Batch 2 LOGIMAT Leads - PRODUCTION
 * 
 * Imports 12 leads from IMG_1230.jpg to production benztraq.vercel.app
 * All leads created by: laxmi@benz-packaging.com
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://benztraq.vercel.app';
const CREDENTIALS = {
    email: 'laxmi@benz-packaging.com',
    password: 'Benz@2024'
};

async function login() {
    console.log('🔐 Logging in as laxmi@benz-packaging.com...');

    const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(CREDENTIALS),
    });

    const result = await response.json();

    if (!result.success) {
        throw new Error(`Login failed: ${result.error}`);
    }

    const setCookieHeader = response.headers.get('set-cookie');
    console.log('✓ Login successful!\n');

    return setCookieHeader;
}

async function importBatch2() {
    try {
        // Step 1: Authenticate
        const sessionCookie = await login();

        // Step 2: Read the JSON file
        const jsonPath = path.join(__dirname, '..', 'LEADS', 'extracted_leads_batch2.json');
        const leadsData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        console.log(`📋 Found ${leadsData.length} LOGIMAT BATCH 2 leads to import...\n`);

        let successCount = 0;
        let failCount = 0;

        // Step 3: Import each lead
        for (let i = 0; i < leadsData.length; i++) {
            const lead = leadsData[i];
            console.log(`[${i + 1}/${leadsData.length}] Importing: ${lead.companyName}...`);

            try {
                const response = await fetch(`${BASE_URL}/api/ergopack/contacts`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cookie': sessionCookie,
                    },
                    body: JSON.stringify(lead),
                });

                const result = await response.json();

                if (result.success) {
                    console.log(`  ✓ Success: ${lead.companyName}`);
                    successCount++;
                } else {
                    console.error(`  ✗ Failed: ${lead.companyName}`);
                    console.error(`     Error: ${result.error}`);
                    failCount++;
                }
            } catch (error) {
                console.error(`  ✗ Error importing ${lead.companyName}:`, error.message);
                failCount++;
            }

            // Small delay to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        console.log(`\n========================================`);
        console.log(`📊 LOGIMAT BATCH 2 IMPORT COMPLETE`);
        console.log(`========================================`);
        console.log(`✓ Success: ${successCount}`);
        console.log(`✗ Failed: ${failCount}`);
        console.log(`📈 Total: ${leadsData.length}`);
        console.log(`========================================`);
        console.log(`\nAll imported leads created by: laxmi@benz-packaging.com`);
        console.log(`View at: ${BASE_URL}/ergopack/contacts\n`);

    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        process.exit(1);
    }
}

// Run the import
importBatch2();
