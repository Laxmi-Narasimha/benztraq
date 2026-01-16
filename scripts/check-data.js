
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

async function checkData() {
    console.log('Checking database status...');
    const env = loadEnv();

    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing environment variables');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check Customers
    const { count: customerCount, error: customerError } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

    if (customerError) console.error('Customer check error:', customerError);
    else console.log(`Total Customers in DB: ${customerCount}`);

    // Check Products
    const { count: productCount, error: productError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

    if (productError) console.error('Product check error:', productError);
    else console.log(`Total Products in DB: ${productCount}`);

    // Check Profiles/Roles
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*, role:roles(name)');

    if (profileError) console.error('Profile check error:', profileError);
    else {
        console.log('\nUsers/Profiles:');
        profiles.forEach(p => {
            console.log(`- ${p.full_name} (${p.email}): Role = ${p.role?.name || 'None'}`);
        });
    }
}

checkData();
