/**
 * Create real VCI products directly via Supabase service role
 * Run: node scripts/seed_vci_supabase.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envContent = readFileSync(path.join(__dirname, '../.env.local'), 'utf-8');
const env = Object.fromEntries(
    envContent.split('\n')
        .filter(l => l && !l.startsWith('#'))
        .map(l => l.split('=').map(p => p.trim()))
        .filter(([k]) => k)
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// First find a valid user to set as created_by
async function getCreatorUserId() {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, email')
        .limit(1)
        .single();
    if (error || !data) { console.error('Cannot find user:', error); return null; }
    console.log(`Using creator: ${data.email} (${data.id})`);
    return data.id;
}

const VCI_PRODUCTS = [
    {
        item_code: "VCI-3DHP-1200",
        item_name: "VCI 3D High-Performance Bag 1200×800×800mm",
        description: "High-Performance VCI (Volatile Corrosion Inhibitor) 3D gusseted bag for protecting large metal components. Provides 360° corrosion protection.",
        stock_uom: "PCS",
        item_type: "Product",
        standard_rate: 125.00,
        buying_price: 78.00,
        hsn_sac_code: "39232900",
        gst_rate: 18,
        length: 1200, width: 800, height: 800, dimension_uom: "mm",
        gross_weight: 0.065, net_weight: 0.060, weight_uom: "kg",
        thickness_micron: 100,
        tags: "VCI, 3D Bag, Corrosion Protection, Export Packaging",
        is_sales_item: true, is_purchase_item: true, is_stock_item: true, maintain_stock: true,
        invoicing_policy: "ordered", tracking_method: "none",
    },
    {
        item_code: "VCI-FILM-500G",
        item_name: "VCI Stretch Film Roll 500mm × 200m",
        description: "VCI stretch film for wrapping metal parts and machinery. Transparent film with integrated corrosion inhibitor. Ideal for pallet wrapping.",
        stock_uom: "ROLL",
        item_type: "Product",
        standard_rate: 480.00,
        buying_price: 295.00,
        hsn_sac_code: "39202099",
        gst_rate: 18,
        length: 500, width: null, height: null, dimension_uom: "mm",
        gross_weight: 2.200, net_weight: 2.000, weight_uom: "kg",
        gsm: 23,
        tags: "VCI, Stretch Film, Corrosion Protection",
        is_sales_item: true, is_purchase_item: true, is_stock_item: true, maintain_stock: true,
        invoicing_policy: "ordered", tracking_method: "none",
    },
    {
        item_code: "VCI-BUBBLE-1200",
        item_name: "VCI Bubble Wrap Roll 1200mm × 50m",
        description: "Large bubble wrap infused with VCI additives for protecting metal parts with cushioning. Excellent for export packing of precision components.",
        stock_uom: "ROLL",
        item_type: "Product",
        standard_rate: 1850.00,
        buying_price: 1100.00,
        hsn_sac_code: "39202099",
        gst_rate: 18,
        length: 1200, width: null, height: null, dimension_uom: "mm",
        gross_weight: 4.500, net_weight: 4.200, weight_uom: "kg",
        gsm: 80,
        tags: "VCI, Bubble Wrap, Cushion Packaging, Export",
        is_sales_item: true, is_purchase_item: true, is_stock_item: true, maintain_stock: true,
        invoicing_policy: "ordered", tracking_method: "none",
    },
    {
        item_code: "VCI-POLY-500G",
        item_name: "VCI Poly Bag 500×700mm (Pack of 100)",
        description: "Standard VCI polyethylene bags for small to medium metal components. Pack of 100 pieces. Suitable for bearings, fasteners, machined parts.",
        stock_uom: "PKT",
        item_type: "Product",
        standard_rate: 340.00,
        buying_price: 210.00,
        hsn_sac_code: "39232900",
        gst_rate: 18,
        length: 500, width: 700, height: null, dimension_uom: "mm",
        gross_weight: 0.85, net_weight: 0.80, weight_uom: "kg",
        thickness_micron: 50,
        tags: "VCI, Poly Bag, Corrosion Inhibitor",
        is_sales_item: true, is_purchase_item: true, is_stock_item: true, maintain_stock: true,
        invoicing_policy: "ordered", tracking_method: "none",
    },
    {
        item_code: "VCI-PAPER-500G",
        item_name: "VCI Crepe Paper Roll 500mm × 200m",
        description: "VCI Crepe Paper for wrapping metal components. Provides short to medium-term corrosion protection. Easy to wrap complex shaped parts.",
        stock_uom: "ROLL",
        item_type: "Product",
        standard_rate: 620.00,
        buying_price: 385.00,
        hsn_sac_code: "48092000",
        gst_rate: 12,
        length: 500, width: null, height: null, dimension_uom: "mm",
        gross_weight: 3.500, net_weight: 3.200, weight_uom: "kg",
        gsm: 40,
        tags: "VCI, Crepe Paper, Corrosion Protection, Wrapping",
        is_sales_item: true, is_purchase_item: true, is_stock_item: true, maintain_stock: true,
        invoicing_policy: "ordered", tracking_method: "none",
    },
];

async function main() {
    console.log('\n🔧 BenzTraq — Seeding Real VCI Products via Supabase\n');

    const creatorId = await getCreatorUserId();
    if (!creatorId) return;

    let created = 0, skipped = 0;

    for (const product of VCI_PRODUCTS) {
        // Check if already exists
        const { data: existing } = await supabase
            .from('products')
            .select('id')
            .eq('item_code', product.item_code)
            .maybeSingle();

        if (existing) {
            console.log(`⏭  Skipped (exists): ${product.item_name}`);
            skipped++;
            continue;
        }

        const { data, error } = await supabase
            .from('products')
            .insert({ ...product, created_by: creatorId })
            .select()
            .single();

        if (error) {
            console.log(`❌ Failed: ${product.item_name}`);
            console.log(`   Error: ${error.message}`);
        } else {
            console.log(`✅ Created: ${data.item_name} — ₹${data.standard_rate}/unit`);
            created++;
        }
        await new Promise(r => setTimeout(r, 200));
    }

    console.log(`\n📊 Summary: ${created} created, ${skipped} skipped`);
    console.log('🔗 View at: https://benztraq.vercel.app/products\n');
}

main().catch(console.error);
