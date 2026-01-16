
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

async function fixCustomers() {
    // Set disabled = false for all customers
    const { data, error } = await supabase
        .from('customers')
        .update({ disabled: false })
        .is('disabled', null);

    if (error) console.error('Error updating NULL disabled:', error);
    else console.log('Updated NULL disabled customers');

    // Also update any that might be TRUE
    const { error: error2 } = await supabase
        .from('customers')
        .update({ disabled: false })
        .eq('disabled', true);

    if (error2) console.error('Error updating TRUE disabled:', error2);
    else console.log('Updated TRUE disabled customers');

    // Verify
    const { count } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('disabled', false);

    console.log(`Customers now with disabled=false: ${count}`);
}

fixCustomers();
