/**
 * Update Existing Leads with Notes - PRODUCTION VERSION
 * 
 * This script updates the 15 LOGIMAT leads that were created without notes.
 * It will add the "LOGIMAT LEADS\n[address]" notes to each existing lead.
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

async function getAllContacts(sessionCookie) {
    console.log('📥 Fetching all existing contacts...');

    const response = await fetch(`${BASE_URL}/api/ergopack/contacts`, {
        headers: {
            'Cookie': sessionCookie,
        },
    });

    const result = await response.json();
    return result.contacts || [];
}

async function updateContact(id, updates, sessionCookie) {
    const response = await fetch(`${BASE_URL}/api/ergopack/contacts`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': sessionCookie,
        },
        body: JSON.stringify({ id, ...updates }),
    });

    return await response.json();
}

async function updateLeadsWithNotes() {
    try {
        // Step 1: Authenticate
        const sessionCookie = await login();

        // Step 2: Get all contacts
        const allContacts = await getAllContacts(sessionCookie);

        // Step 3: Read the JSON file with correct notes
        const jsonPath = path.join(__dirname, '..', 'LEADS', 'extracted_leads_fixed.json');
        const leadsData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        console.log(`📋 Found ${leadsData.length} leads to update with notes...\n`);

        let successCount = 0;
        let failCount = 0;
        let notFoundCount = 0;

        // Step 4: Update each lead
        for (let i = 0; i < leadsData.length; i++) {
            const lead = leadsData[i];
            console.log(`[${i + 1}/${leadsData.length}] Updating: ${lead.companyName}...`);

            // Find the existing contact by company name
            const existingContact = allContacts.find(c =>
                c.company_name?.toLowerCase() === lead.companyName.toLowerCase()
            );

            if (!existingContact) {
                console.error(`  ✗ Not found: ${lead.companyName}`);
                notFoundCount++;
                continue;
            }

            try {
                const result = await updateContact(
                    existingContact.id,
                    { notes: lead.notes },
                    sessionCookie
                );

                if (result.success) {
                    console.log(`  ✓ Updated: ${lead.companyName}`);
                    successCount++;
                } else {
                    console.error(`  ✗ Failed: ${lead.companyName} - ${result.error}`);
                    failCount++;
                }
            } catch (error) {
                console.error(`  ✗ Error: ${lead.companyName} - ${error.message}`);
                failCount++;
            }

            // Small delay
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        console.log(`\n========================================`);
        console.log(`📊 LOGIMAT LEADS UPDATE COMPLETE`);
        console.log(`========================================`);
        console.log(`✓ Updated: ${successCount}`);
        console.log(`✗ Failed: ${failCount}`);
        console.log(`⚠  Not Found: ${notFoundCount}`);
        console.log(`📈 Total: ${leadsData.length}`);
        console.log(`========================================`);
        console.log(`\nView leads at: ${BASE_URL}/ergopack/contacts\n`);

    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        process.exit(1);
    }
}

// Run the update
updateLeadsWithNotes();
