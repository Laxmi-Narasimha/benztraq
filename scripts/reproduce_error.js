/**
 * Reproduce Document Creation Error
 * Authenticates and attempts to create a document with the exact payload structure
 */

const BASE_URL = 'https://benztraq.vercel.app';

async function reproduceError() {
    console.log('🐞 Starting Error Reproduction...\n');

    try {
        // 1. Login to get token
        console.log('1️⃣ Logging in...');
        const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'abhishek@benz-packaging.com',
                password: 'Benz@2024'
            })
        });

        if (!loginRes.ok) {
            console.error('❌ Login failed:', loginRes.status);
            return;
        }

        // Get the session cookie
        const cookie = loginRes.headers.get('set-cookie');
        console.log('✅ Login successful, got cookie');

        // 2. Prepare payload matching screenshot
        const payload = {
            doc_type: "quotation",
            partner_state_code: "27", // Maharashtra (implied by Intra-state logic in screenshot if ASM is MH based?)
            // Actually screenshot shows "Select state..." so maybe null

            // Minimal payload based on screenshot
            customer_name_raw: "Test Customer for Debug",
            partner_name: "Test Customer for Debug",
            payment_terms: "100% Advance",
            validity_days: "15",

            // Line items
            line_items: [
                {
                    product_name: "VCI Bag (MAHINVB12)",
                    product_uom: "Unit",
                    quantity: 1,
                    unit_price: 1,
                    gst_rate: 18,
                    price_subtotal: 1,
                    price_total: 1.18
                }
            ],

            amount_untaxed: 1.00,
            amount_tax: 0.18,
            amount_total: 1.18,

            // State
            state: "draft"
        };

        // 3. Send POST request
        console.log('\n2️⃣ Sending POST /api/documents...');
        const res = await fetch(`${BASE_URL}/api/documents`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookie // Pass the session cookie
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok) {
            console.log('✅ Creation Success!');
            console.log(data);
        } else {
            console.log('❌ Creation Failed:', res.status);
            console.log('Error:', JSON.stringify(data, null, 2));
        }

    } catch (err) {
        console.error('❌ Exception:', err);
    }
}

reproduceError();
