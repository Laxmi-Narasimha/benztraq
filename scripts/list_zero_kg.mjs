import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
    const candidates = [
        'd:/performance/app/.env.production.local',
        'd:/performance/app/.env.local',
    ];
    const env = {};
    for (const envPath of candidates) {
        if (!fs.existsSync(envPath)) continue;
        const text = fs.readFileSync(envPath, 'utf-8');
        for (const line of text.split('\n')) {
            const idx = line.indexOf('=');
            if (idx === -1) continue;
            const key = line.substring(0, idx).trim();
            let val = line.substring(idx + 1).trim();
            if (val.startsWith('"')) val = val.slice(1);
            if (val.endsWith('"')) val = val.slice(0, -1);
            val = val.replace(/\\r\\n/g, '').replace(/\r/g, '').replace(/\n/g, '').trim();
            env[key] = val;
        }
    }
    return env;
}

async function main() {
    const env = loadEnv();
    const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    const { data, error } = await sb
        .from('inventory_items')
        .select('sr_no, customer_name, material_type, part_size, uom, total_received, total_dispatched, balance_qty, kg_per_piece')
        .eq('is_active', true)
        .or('kg_per_piece.eq.0,kg_per_piece.is.null')
        .order('balance_qty', { ascending: false });

    if (error) { console.error(error); return; }

    let withStock = 0, zeroStock = 0;
    console.log('Found ' + data.length + ' items with kg_per_piece = 0 or null\n');
    console.log('# | Customer | Material | Size | UOM | Received | Dispatched | Balance | Has Stock?');
    console.log('--|----------|----------|------|-----|----------|------------|---------|----------');
    for (const item of data) {
        const bal = parseFloat(item.balance_qty) || 0;
        const hasStock = bal > 0;
        if (hasStock) withStock++; else zeroStock++;
        console.log((item.sr_no || '-') + ' | ' + item.customer_name + ' | ' + (item.material_type || '-') + ' | ' + (item.part_size || '-') + ' | ' + item.uom + ' | ' + item.total_received + ' | ' + item.total_dispatched + ' | ' + bal + ' | ' + (hasStock ? 'YES' : 'No'));
    }
    console.log('\nSummary: ' + withStock + ' items WITH stock, ' + zeroStock + ' items with ZERO stock');
}
main().catch(console.error);
