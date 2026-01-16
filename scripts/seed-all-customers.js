
const XLSX = require('xlsx');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load Env
function loadEnv() {
    const envPath = path.resolve(__dirname, '../.env.local');
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
    });
    return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const FILE_PATH = path.join(__dirname, '../data/all-customers.csv');

async function seedAllCustomers() {
    console.log('Reading all-customers.csv...');
    const workbook = XLSX.readFile(FILE_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    console.log(`Found ${rows.length} rows in CSV.`);

    // First, delete existing customers to replace with new list
    console.log('Clearing existing customers...');
    const { error: deleteError } = await supabase
        .from('customers')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
        console.error('Error clearing customers:', deleteError);
    }

    // Prepare customers for batch insert using correct column names
    const customers = rows.map((row, index) => {
        const name = (row['Complete Name'] || '').trim()
            .replace(/_x000D_/g, '')
            .replace(/\r?\n/g, '')
            .trim();
        const city = (row['City'] || '').trim();

        if (!name) return null;

        return {
            name: name,
            customer_code: `CUST-${String(index + 1).padStart(5, '0')}`,
            city: city,
            country_id: 'IN',  // Correct column name
            disabled: false,
            is_company: true,
            company_type: 'company',
            active: true
        };
    }).filter(Boolean);

    console.log(`Prepared ${customers.length} customers for insert.`);

    // Batch insert in chunks of 100
    const BATCH_SIZE = 100;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < customers.length; i += BATCH_SIZE) {
        const batch = customers.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('customers').insert(batch);

        if (error) {
            console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
            errorCount += batch.length;
        } else {
            successCount += batch.length;
            console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: Inserted ${batch.length} (Total: ${successCount})`);
        }
    }

    console.log(`\nSeed Complete:`);
    console.log(`- Total Inserted: ${successCount}`);
    console.log(`- Errors: ${errorCount}`);

    // Verify
    const { count } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });
    console.log(`- Final Count in DB: ${count}`);
}

seedAllCustomers().catch(console.error);
