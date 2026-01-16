
const XLSX = require('xlsx');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load Env
function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            const lines = content.split('\n');
            const env = {};
            lines.forEach(line => {
                const match = line.match(/^([^=]+)=(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    const value = match[2].trim().replace(/^['"]|['"]$/g, '');
                    env[key] = value;
                }
            });
            return env;
        }
    } catch (e) {
        console.error('Error reading .env.local', e);
    }
    return process.env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const FILE_PATH = path.join(__dirname, '../data/Purchase Order Update - Purchase Orders (1).csv');

async function seedCustomers() {
    console.log(`Reading PO file: ${FILE_PATH}`);
    const workbook = XLSX.readFile(FILE_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    console.log(`Found ${rows.length} rows in CSV.`);

    // Extract Unique Customers
    const customersMap = new Map();

    rows.forEach(row => {
        const name = row['Customer Name']?.trim();
        const email = row['Email Address']?.trim();

        if (name && !customersMap.has(name)) {
            customersMap.set(name, {
                name: name,
                email: email || null,
                // Try to guess other fields if available in other cols
            });
        }
    });

    console.log(`Found ${customersMap.size} unique customers.`);

    const customers = Array.from(customersMap.values());

    // Prepare for Insert
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < customers.length; i++) {
        const cust = customers[i];

        // Generate Customer Code: CUST-00XXX
        const code = `CUST-${String(i + 1).padStart(5, '0')}`;

        // Check if exists
        const { data: existing } = await supabase
            .from('customers')
            .select('id')
            .eq('name', cust.name) // Match by name to avoid dupes
            .maybeSingle();

        if (existing) {
            console.log(`Skipping existing: ${cust.name}`);
            skipCount++;
            continue;
        }

        const { error } = await supabase.from('customers').insert({
            name: cust.name,
            customer_code: code,
            email: cust.email,
            status: 'Active',
            country_id: 'IN', // Default
            customer_type: 'Company'
        });

        if (error) {
            console.error(`Error inserting ${cust.name}:`, error.message);
            errorCount++;
        } else {
            console.log(`Inserted: ${cust.name} (${code})`);
            successCount++;
        }
    }

    console.log(`\nSeed Complete:`);
    console.log(`- Inserted: ${successCount}`);
    console.log(`- Skipped: ${skipCount}`);
    console.log(`- Errors: ${errorCount}`);
}

seedCustomers();
