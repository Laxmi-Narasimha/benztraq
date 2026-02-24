/**
 * Script to create real VCI packaging products in BenzTraq
 * Run: node scripts/create_vci_products.js
 */

const BASE_URL = 'https://benztraq.vercel.app';

const products = [
    {
        item_code: "VCI-3DHP-1200",
        item_name: "VCI 3D High-Performance Bag 1200×800×800mm",
        description: "High-Performance VCI (Volatile Corrosion Inhibitor) 3D gusseted bag for protecting large metal components. Provides 360° corrosion protection in closed environments.",
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
        description: "VCI stretch film for wrapping metal parts and machinery. Transparent film with integrated corrosion inhibitor. Ideal for wrapping, strapping and pallet stretch wrapping.",
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

async function loginAndGetCookies() {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@benz-packaging.com', password: 'benz@1234' }),
    });
    const cookies = res.headers.get('set-cookie');
    if (!res.ok) {
        const text = await res.text();
        console.log('Login failed:', text);
        return null;
    }
    console.log('Logged in successfully');
    return cookies;
}

async function createProduct(product, cookies) {
    const res = await fetch(`${BASE_URL}/api/products`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': cookies || '',
        },
        body: JSON.stringify(product),
    });
    const data = await res.json();
    if (res.ok) {
        console.log(`✅ Created: ${data.product?.item_name || product.item_name} (ID: ${data.product?.id})`);
        return data.product;
    } else {
        console.log(`❌ Failed: ${product.item_name} — ${data.error}`);
        return null;
    }
}

async function main() {
    console.log('\n🔧 BenzTraq — Creating Real VCI Products\n');

    const cookies = await loginAndGetCookies();
    if (!cookies) {
        console.log('Cannot proceed without authentication');
        return;
    }

    for (const product of products) {
        await createProduct(product, cookies);
        await new Promise(r => setTimeout(r, 300)); // small delay
    }

    console.log('\n✅ Done! Check https://benztraq.vercel.app/products\n');
}

main().catch(console.error);
