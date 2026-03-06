import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

function loadEnv() {
    const candidates = ['d:/performance/app/.env.production.local', 'd:/performance/app/.env.local'];
    const env = {};
    for (const p of candidates) {
        if (!fs.existsSync(p)) continue;
        for (const line of fs.readFileSync(p, 'utf-8').split('\n')) {
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

// Parse CSV properly
function parseCsv(text) {
    const lines = text.split('\n');
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].replace(/\r$/, '');
        if (!line.trim()) continue;
        const cols = [];
        let cur = '', inQ = false;
        for (let c = 0; c < line.length; c++) {
            if (line[c] === '"') inQ = !inQ;
            else if (line[c] === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
            else cur += line[c];
        }
        cols.push(cur.trim());
        rows.push(cols);
    }
    return rows;
}

function pn(v) { const n = parseFloat((v || '').replace(/,/g, '')); return isNaN(n) ? 0 : n; }

async function main() {
    const env = loadEnv();
    const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    // Get DB totals
    const { data: dbItems } = await sb.from('inventory_items')
        .select('uom, balance_qty, kg_per_piece, stock_in_kg')
        .eq('is_active', true);

    let dbTotalAll = 0, dbTotalInStock = 0;
    let dbPcsGte05 = 0, dbPcsGte05Count = 0;
    for (const it of dbItems || []) {
        const skg = parseFloat(it.stock_in_kg) || 0;
        const bal = parseFloat(it.balance_qty) || 0;
        const kpp = parseFloat(it.kg_per_piece) || 0;
        dbTotalAll += skg;
        if (bal > 0) {
            dbTotalInStock += skg;
            if (it.uom !== 'KGS' && kpp >= 0.5) {
                dbPcsGte05 += skg;
                dbPcsGte05Count++;
            }
        }
    }

    // Parse CSV and sum STOCK IN KG (col 10) for items with balance > 0
    const csv = fs.readFileSync('d:/performance/app/FG STOCK - FG STOCK.csv', 'utf-8');
    const rows = parseCsv(csv);
    let csvTotalAll = 0, csvTotalInStock = 0, csvInStockCount = 0;
    for (const cols of rows) {
        const bal = pn(cols[8]);
        const stockKg = pn(cols[10]);
        csvTotalAll += stockKg;
        if (bal > 0) { csvTotalInStock += stockKg; csvInStockCount++; }
    }

    console.log('=== COMPARISON ===');
    console.log('');
    console.log('DB stock_in_kg (ALL items):', dbTotalAll.toFixed(2), 'kg');
    console.log('DB stock_in_kg (balance>0):', dbTotalInStock.toFixed(2), 'kg');
    console.log('DB PCS items kg_per_piece>=0.5 (excluded by filter):', dbPcsGte05.toFixed(2), 'kg (' + dbPcsGte05Count + ' items)');
    console.log('DB AFTER filter (what stats API shows):', (dbTotalInStock - dbPcsGte05).toFixed(2), 'kg');
    console.log('');
    console.log('CSV STOCK IN KG (ALL rows):', csvTotalAll.toFixed(2), 'kg');
    console.log('CSV STOCK IN KG (balance>0 only):', csvTotalInStock.toFixed(2), 'kg (' + csvInStockCount + ' items)');
    console.log('');
    console.log('Google Sheet total (user says):', '64,708.32 kg');
    console.log('');
    console.log('DB raw (balance>0) vs Sheet:', (dbTotalInStock - 64708.32).toFixed(2), 'kg difference');
    console.log('CSV (balance>0) vs Sheet:', (csvTotalInStock - 64708.32).toFixed(2), 'kg difference');

    // Show PCS items with kg_per_piece >= 0.5 that the filter removes
    console.log('\n=== PCS items being EXCLUDED by stats filter (kg_per_piece >= 0.5) ===');
    for (const it of dbItems || []) {
        const bal = parseFloat(it.balance_qty) || 0;
        const kpp = parseFloat(it.kg_per_piece) || 0;
        if (bal > 0 && it.uom !== 'KGS' && kpp >= 0.5) {
            console.log(`  UOM=${it.uom} | bal=${bal} | kpp=${kpp} | stock_kg=${parseFloat(it.stock_in_kg).toFixed(2)}`);
        }
    }
}
main().catch(console.error);
