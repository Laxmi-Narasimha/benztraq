const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const LEADS_DIR = path.join(__dirname, '..', 'LEADS');

const files = [
    'extracted_leads.json',
    'extracted_leads_batch2.json',
    'extracted_leads_batch3.json',
    'extracted_leads_batch4.json',
    'extracted_leads_batch5.json',
    'extracted_leads_batch6.json',
    'extracted_leads_batch7.json',
    'extracted_leads_batch8.json',
];

// Email corrections from verified data (WhatsApp image)
const EMAIL_CORRECTIONS = {
    'nilestchheda@iscbpl.com': 'nilesh.chheda@iscbpl.com',
    'dnyaneshwar.borude@suyashglobal.com': 'dnyaneshwar.borude@suyash-global.com',
    'jayprakash.kharwarne@supremegroup.co.in': 'sooraj.prasad@supremegroup.co.in',
    'shashikant.mody@creativegroup.in': 'shashikant.modi@creativegroup.in',
    'detalogistic07@gmail.com': 'deltalogistic07@gmail.com',
    'dnyaneshwar.borude@harspan.com': 'info@harspan.com',
    'elyiumengineering@gmail.com': 'elyumengineering@gmail.com',
    'kavit.panya@pidilite.com': 'kavit.pandya@pidilite.com',
    'sankar.kundeli@dana.com': 'sankar.kundeti@dana.com',
};

let allLeads = [];

for (const file of files) {
    const filePath = path.join(LEADS_DIR, file);
    if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        allLeads = allLeads.concat(data);
        console.log(`Loaded ${data.length} leads from ${file}`);
    }
}

console.log(`\nTotal leads before dedup: ${allLeads.length}`);

// Deduplicate by primary email + name
const seen = new Set();
const uniqueLeads = [];

for (const lead of allLeads) {
    let primaryEmail = (lead.email || '').split(',')[0].trim().toLowerCase();
    const name = lead.contactPerson || '';
    const company = lead.companyName || '';

    // Apply email corrections
    if (EMAIL_CORRECTIONS[primaryEmail]) {
        const corrected = EMAIL_CORRECTIONS[primaryEmail];
        console.log(`  Corrected: ${primaryEmail} → ${corrected}`);
        primaryEmail = corrected;
    }

    const key = `${primaryEmail}|${name.toLowerCase()}`;
    if (key === '|') continue;
    if (seen.has(key)) {
        console.log(`  Skipping duplicate: ${name} (${primaryEmail})`);
        continue;
    }
    seen.add(key);

    uniqueLeads.push({
        'Name': name || '(No Name)',
        'Company': company,
        'Email': primaryEmail || '(No Email)',
    });
}

console.log(`\nTotal unique leads: ${uniqueLeads.length}`);

// Sort by company name
uniqueLeads.sort((a, b) => a.Company.localeCompare(b.Company));

// Create Excel
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(uniqueLeads);
ws['!cols'] = [
    { wch: 35 },  // Name
    { wch: 50 },  // Company
    { wch: 45 },  // Email
];

XLSX.utils.book_append_sheet(wb, ws, 'LogiMAT Leads');

const outputPath = path.join(__dirname, '..', 'LogiMAT_Leads.xlsx');
XLSX.writeFile(wb, outputPath);

console.log(`\nExcel file created: ${outputPath}`);
console.log(`Total leads exported: ${uniqueLeads.length}`);
