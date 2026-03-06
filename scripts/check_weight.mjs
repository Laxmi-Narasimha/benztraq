/**
 * Check current inventory weight totals in DB vs what they should be
 * Run: node scripts/check_weight.mjs
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
    const candidates = [
        path.join(__dirname, '..', '.env.production.local'),
        path.join(__dirname, '..', '.env.local'),
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

    // Total weight from DB
    const { data } = await sb
        .from('inventory_items')
        .select('uom, balance_qty, kg_per_piece, stock_in_kg')
        .eq('is_active', true)
        .gt('balance_qty', 0);

    let totalKg = 0;
    let pcsCount = 0;
    let kgsCount = 0;
    let noKgPerPiece = 0;

    for (const item of data || []) {
        const stockKg = parseFloat(item.stock_in_kg || 0);
        totalKg += stockKg;
        if (item.uom === 'KGS') kgsCount++;
        else pcsCount++;
        if (!item.kg_per_piece || parseFloat(item.kg_per_piece) === 0) noKgPerPiece++;
    }

    console.log('=== DB Weight Analysis ===');
    console.log(`Total items with balance > 0: ${(data || []).length}`);
    console.log(`  PCS items: ${pcsCount}`);
    console.log(`  KGS items: ${kgsCount}`);
    console.log(`  Items with kg_per_piece = 0: ${noKgPerPiece}`);
    console.log(`\nTotal stock_in_kg (DB formula): ${totalKg.toFixed(5)} kg = ${(totalKg / 1000).toFixed(2)} T`);
    console.log(`\nExpected from Google Sheet: 64,708.32312 kg = 64.71 T`);
    console.log(`Difference: ${(totalKg - 64708.32312).toFixed(2)} kg`);

    // Show top 10 heaviest items
    const sorted = (data || []).sort((a, b) => parseFloat(b.stock_in_kg) - parseFloat(a.stock_in_kg));
    console.log('\nTop 10 heaviest items:');
    sorted.slice(0, 10).forEach((item, i) => {
        console.log(`  ${i + 1}. UOM=${item.uom} | balance=${item.balance_qty} | kg_per_piece=${item.kg_per_piece} | stock_kg=${parseFloat(item.stock_in_kg).toFixed(3)}`);
    });
}
main().catch(console.error);
