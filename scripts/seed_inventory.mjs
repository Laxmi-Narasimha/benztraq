/**
 * Seed Inventory Script
 * Parses FG STOCK CSV and inserts items into Supabase inventory_items table
 * 
 * Usage: node scripts/seed_inventory.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load env from .env.local, fall back to process.env
let env = {};
try {
    const envPath = resolve(process.cwd(), '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const [key, ...val] = line.split('=');
        if (key && val.length) {
            let v = val.join('=').trim();
            // Strip surrounding quotes
            if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
                v = v.slice(1, -1);
            }
            env[key.trim()] = v;
        }
    });
} catch (e) {
    console.log('No .env.local found, using environment variables');
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

async function seedInventory() {
    console.log('🔄 Starting inventory seed...');

    const csvPath = resolve(process.cwd(), 'FG STOCK - FG STOCK.csv');
    const csvContent = readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').map(l => l.replace(/\r/g, ''));

    // Skip header
    const header = parseCSVLine(lines[0]);
    console.log('📋 Headers:', header);

    const items = [];
    let skipped = 0;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = parseCSVLine(line);

        // Column mapping:
        // 0: SR NO, 1: CUSTOMER NAME, 2: MATERIAL TYPE, 3: PART SIZE
        // 4: CUSTOMER PART CODE, 5: UOM, 6: RECEIVED QTY, 7: DISPATCH QTY
        // 8: BALANCE QTY, 9: STOCK IN KG PER PIC, 10: STOCK IN KG

        const customerName = (cols[1] || '').trim();
        if (!customerName) {
            skipped++;
            continue; // Skip rows without customer name
        }

        const srNo = parseInt(cols[0]) || null;
        const materialType = (cols[2] || '').trim() || null;
        const partSize = (cols[3] || '').trim() || null;
        const customerPartCode = (cols[4] || '').trim() || null;
        const uom = (cols[5] || 'PCS').trim().toUpperCase() || 'PCS';

        // Parse numeric values - handle empty and special values
        const received = parseFloat((cols[6] || '0').replace(/[^0-9.-]/g, '')) || 0;
        const dispatched = parseFloat((cols[7] || '0').replace(/[^0-9.-]/g, '')) || 0;
        const kgPerPiece = parseFloat((cols[9] || '0').replace(/[^0-9.-]/g, '')) || 0;

        // Skip if it looks like the "TOTAL" row
        if (cols[9] === 'TOTAL' || customerName === 'TOTAL') continue;

        items.push({
            sr_no: srNo,
            customer_name: customerName.toUpperCase(),
            material_type: materialType,
            part_size: partSize,
            customer_part_code: customerPartCode,
            uom: uom,
            total_received: received,
            total_dispatched: dispatched,
            kg_per_piece: kgPerPiece,
            warehouse: 'FG STOCK',
            is_active: true,
        });
    }

    console.log(`📦 Parsed ${items.length} items (skipped ${skipped} rows without customer)`);

    // Insert in batches of 50
    const BATCH_SIZE = 50;
    let insertedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        const { data, error } = await supabase
            .from('inventory_items')
            .insert(batch)
            .select('id');

        if (error) {
            console.error(`❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
            errorCount += batch.length;
        } else {
            insertedCount += data.length;
            process.stdout.write(`\r✅ Inserted ${insertedCount}/${items.length} items...`);
        }
    }

    console.log(`\n\n🎉 Seed complete! Inserted: ${insertedCount}, Errors: ${errorCount}`);

    // Print summary by customer
    const customerCounts = {};
    items.forEach(item => {
        customerCounts[item.customer_name] = (customerCounts[item.customer_name] || 0) + 1;
    });

    const sortedCustomers = Object.entries(customerCounts).sort((a, b) => b[1] - a[1]);
    console.log('\n📊 Top customers by item count:');
    sortedCustomers.slice(0, 15).forEach(([name, count]) => {
        console.log(`   ${name}: ${count} items`);
    });
    console.log(`   ... and ${sortedCustomers.length - 15} more customers`);
}

seedInventory().catch(console.error);
