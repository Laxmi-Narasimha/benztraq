/**
 * Inventory Sync Script
 * Reads FG STOCK - FG STOCK.csv and syncs all data into the inventory_items table.
 * Also clears all transaction logs (inventory_transactions).
 * 
 * Run from: d:\performance\app
 * Command: node scripts/sync_inventory_from_csv.mjs
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
    // Try .env.production.local first, then .env.local
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
            // Strip carriage returns and literal \r\n
            val = val.replace(/\\r\\n/g, '').replace(/\r/g, '').replace(/\n/g, '').trim();
            env[key] = val;
        }
    }
    return env;
}

function parseNum(val) {
    if (!val || val.trim() === '' || val.trim() === 'TOTAL') return 0;
    const n = parseFloat(val.replace(/,/g, ''));
    return isNaN(n) ? 0 : n;
}

function parseCsv(text) {
    const lines = text.split('\n');
    const rows = [];
    let inQuote = false;

    for (let lineIdx = 1; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx].replace(/\r$/, '');
        if (!line.trim()) continue;

        // Simple CSV parse (handles quoted fields)
        const cols = [];
        let cur = '';
        inQuote = false;

        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                inQuote = !inQuote;
            } else if (ch === ',' && !inQuote) {
                cols.push(cur.trim());
                cur = '';
            } else {
                cur += ch;
            }
        }
        cols.push(cur.trim());

        // cols: SR NO, CUSTOMER NAME, MATERIAL TYPE, PART SIZE, CUSTOMER PART CODE, UOM, RECEIVED QTY, DISPATCH QTY, BALANCE QTY, STOCK IN KG PER PIC, STOCK IN KG
        const srNo = cols[0]?.trim() || '';
        const customerName = cols[1]?.trim().toUpperCase() || '';
        const materialType = cols[2]?.trim() || '';
        const partSize = cols[3]?.trim() || '';
        const partCode = cols[4]?.trim() || '';
        const uom = (cols[5]?.trim() || 'PCS').toUpperCase();
        const receivedQty = parseNum(cols[6]);
        const dispatchQty = parseNum(cols[7]);
        const balanceQty = parseNum(cols[8]);
        const kgPerPiece = parseNum(cols[9]);
        const stockKg = parseNum(cols[10]);

        // Skip rows with no customer name or clearly invalid
        if (!customerName) continue;
        // Skip header-like rows
        if (customerName === 'CUSTOMER NAME') continue;

        /**
         * KEY FIX: Correct the phantom weight caused by bad CSV data.
         *
         * Root cause: Many PCS items in the CSV have kg_per_piece = 1 (a data entry error)
         * which makes stock_in_kg = balance_qty (e.g. 24000 PCS × 1 kg = 24000 kg for tiny bags).
         * The Google Sheet has since corrected these. We detect this by checking if stockKg == balanceQty.
         *
         * Rules:
         * - KGS items: kg_per_piece = 1 always (weight IS the quantity)
         * - PCS items where stockKg < balanceQty and stockKg > 0: derive kg_per_piece = stockKg/balanceQty ✓
         * - PCS items where stockKg = balanceQty (phantom 1kg-per-piece error): set kg_per_piece = 0
         * - PCS items where balance = 0 but rawKgPerPiece is reasonable (< 0.5): use rawKgPerPiece
         */
        let computedKgPerPiece = 0;
        if (uom === 'KGS') {
            // KGS items: weight IS the quantity
            computedKgPerPiece = 1;
        } else if (balanceQty > 0 && stockKg > 0 && Math.abs(stockKg - balanceQty) > 0.001) {
            // PCS items: stockKg ≠ balanceQty → valid computed weight, derive kg_per_piece
            computedKgPerPiece = stockKg / balanceQty;
        } else if (balanceQty > 0 && stockKg > 0 && Math.abs(stockKg - balanceQty) <= 0.001) {
            // PCS items: stockKg = balanceQty → kg_per_piece=1 error in CSV → treat as 0
            computedKgPerPiece = 0;
        } else if (balanceQty === 0 && kgPerPiece > 0 && kgPerPiece < 0.5 && uom !== 'KGS') {
            // Zero-balance PCS items: use raw column only if it's a realistic fractional weight
            computedKgPerPiece = kgPerPiece;
        }

        rows.push({
            sr_no: srNo ? parseInt(srNo) || null : null,
            customer_name: customerName,
            material_type: materialType || null,
            part_size: partSize || null,
            customer_part_code: partCode || null,
            uom: uom || 'PCS',
            total_received: receivedQty,
            total_dispatched: dispatchQty,
            // balance_qty is GENERATED ALWAYS AS (total_received - total_dispatched) STORED — do NOT insert
            // stock_in_kg is GENERATED ALWAYS AS (balance_qty * kg_per_piece) STORED — do NOT insert
            kg_per_piece: computedKgPerPiece,
            warehouse: 'FG STOCK',
            is_active: true,
        });
    }

    return rows;
}

async function main() {
    const env = loadEnv();
    const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    console.log('📋 Reading CSV file...');
    const csvPath = path.join(__dirname, '..', 'FG STOCK - FG STOCK.csv');
    const csvText = fs.readFileSync(csvPath, 'utf-8');
    const rows = parseCsv(csvText);
    console.log(`✅ Parsed ${rows.length} inventory rows from CSV`);

    // Step 1: Clear all transaction logs
    console.log('\n🗑️  Clearing all inventory transaction logs...');
    const { error: txnError } = await sb.from('inventory_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (txnError) {
        console.error('❌ Error clearing transactions:', txnError.message);
    } else {
        console.log('✅ All transaction logs cleared');
    }

    // Step 2: Delete all existing inventory items
    console.log('\n🗑️  Clearing all existing inventory items...');
    const { error: delError } = await sb.from('inventory_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delError) {
        console.error('❌ Error clearing inventory items:', delError.message);
        return;
    }
    console.log('✅ All existing inventory items cleared');

    // Step 3: Insert new items in batches of 100
    console.log(`\n📦 Inserting ${rows.length} items...`);
    const BATCH_SIZE = 100;
    let inserted = 0;
    let errors = 0;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const { data, error } = await sb.from('inventory_items').insert(batch).select('id');
        if (error) {
            console.error(`❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
            // Try one by one to find the problematic row
            for (const row of batch) {
                const { error: rowErr } = await sb.from('inventory_items').insert(row);
                if (rowErr) {
                    console.error(`  ⚠️  Skipping: ${row.customer_name} | ${row.material_type} | ${row.part_size} — ${rowErr.message}`);
                    errors++;
                } else {
                    inserted++;
                }
            }
        } else {
            inserted += (data?.length || batch.length);
            process.stdout.write(`\r  📦 Inserted ${inserted}/${rows.length} items...`);
        }
    }

    console.log(`\n\n✅ Sync complete!`);
    console.log(`  ✓ Inserted: ${inserted} items`);
    if (errors > 0) console.log(`  ⚠️  Skipped: ${errors} rows (errors)`);
    console.log(`\n🎉 Inventory updated from FG STOCK CSV successfully!`);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
