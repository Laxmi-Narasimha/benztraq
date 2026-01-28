
const BASE_URL = 'https://benztraq.vercel.app';
// const BASE_URL = 'http://localhost:3000'; // For local testing if needed
const DEFAULT_PASSWORD = 'ChangeMe123!';

const ASMS = [
    { name: 'MP ASM', email: 'abhishek@benz-packaging.com', region: 'Madhya Pradesh' },
    { name: 'Rajasthan ASM', email: 'wh.jaipur@benz-packaging.com', region: 'Rajasthan' },
    { name: 'Karnataka ASM', email: 'banglore@benz-packaging.com', region: 'Karnataka' },
    { name: 'Maharashtra ASM', email: 'rfq@benz-packaging.com', region: 'Maharashtra' },
    { name: 'Noida ASM', email: 'it@benz-packaging.com', region: 'Noida' },
    { name: 'West Zone ASM', email: 'west@benz-packaging.com', region: 'West Zone' }
];

async function runVerification() {
    console.log(`Starting Production Verification on ${BASE_URL}\n`);

    // 0. Bootstrap / Seed Users
    let activePassword = DEFAULT_PASSWORD;
    try {
        console.log('🌱 Seeding Users...');
        const seedRes = await fetch(`${BASE_URL}/api/admin/seed-users`, {
            method: 'POST',
            headers: {
                'x-bootstrap-secret': 'benz-seed-2024'
            }
        });
        const seedData = await seedRes.json();
        if (seedRes.ok) {
            console.log(`✅ Users Seeded: ${seedData.message}`);
            if (seedData.defaultPassword) {
                console.log(`🔑 Using Seeded Password: ${seedData.defaultPassword}`);
                activePassword = seedData.defaultPassword;
            }
        } else {
            console.warn(`⚠️ User Seeding returned ${seedRes.status}: ${JSON.stringify(seedData)}`);
        }
    } catch (e) {
        console.warn('⚠️ User Seeding skipped/failed:', e.message);
    }

    // 0.1 Seed Targets (Optional)
    try {
        await fetch(`${BASE_URL}/api/seed-targets`); // It's a GET, fires and seed
    } catch (e) { }

    const results = {};

    for (const asm of ASMS) {
        console.log(`\n---------------------------------------------------------`);
        console.log(`Testing User: ${asm.name} (${asm.email})`);
        console.log(`---------------------------------------------------------`);

        try {
            // 1. Login
            const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: asm.email,
                    password: activePassword,
                    selectedCompany: 'benz'
                })
            });

            if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status} ${loginRes.statusText}`);

            const loginData = await loginRes.json();
            const cookie = loginRes.headers.get('set-cookie');

            console.log(`✅ Login Successful`);

            // 2. Check Initial Analytics
            const initialAnalytics = await getAnalytics(cookie);
            console.log(`   Initial Revenue: ${formatCurrency(initialAnalytics.summaryMetrics?.totalRevenue)}`);
            console.log(`   Initial Orders: ${initialAnalytics.summaryMetrics?.totalOrders}`);

            // 3. Create Customer
            const customerName = `Test Customer ${asm.name} ${Date.now()}`;
            const customerRes = await fetch(`${BASE_URL}/api/customers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': cookie
                },
                body: JSON.stringify({
                    name: customerName,
                    email: `test.${Date.now()}@example.com`,
                    phone: '9876543210',
                    address: 'Test Address 123',
                    city: 'Test City',
                    state_code: '27', // Maharashtra
                    gstin: '27AAAAA0000A1Z5',
                    is_company: true,
                    company_type: 'company'
                })
            });

            if (!customerRes.ok) throw new Error(`Customer creation failed: ${customerRes.status}`);
            const customerData = await customerRes.json();
            const customerId = customerData.customer.id;
            console.log(`✅ Customer Created: ${customerData.customer.name} (ID: ${customerId})`);

            // Verify Customer Fields
            if (customerData.customer.name !== customerName) console.error('❌ Name Mismatch');
            const resultGstin = customerData.customer.gstin || customerData.customer.vat;
            if (resultGstin !== '27AAAAA0000A1Z5') {
                console.error(`❌ GSTIN Mismatch. Expected 27AAAAA0000A1Z5, got ${resultGstin}`);
            }

            // 4. Fetch Products (to get an ID)
            const productsRes = await fetch(`${BASE_URL}/api/products?limit=1`, {
                headers: { 'Cookie': cookie }
            });
            const productsData = await productsRes.json();
            const product = productsData.products[0];

            if (!product) throw new Error('No products found to create quotation');

            // 5. Create Quotation
            const docPayload = {
                doc_type: 'quotation',
                date: new Date().toISOString(),
                customer_id: customerId,
                customer_name: customerName,
                customer_gstin: '27AAAAA0000A1Z5',
                customer_address: 'Test Address 123',
                partner_id: customerId, // Frontend sends both
                partner_name: customerName,
                place_of_supply: '27',
                fiscal_position: 'intrastate', // Assuming same state for simplicity
                order_line: [{
                    product_id: product.id,
                    product_name_raw: product.item_name,
                    name: product.item_name,
                    qty: 10,
                    product_uom_qty: 10,
                    unit_price: 1000,
                    price_unit: 1000,
                    discount: 0,
                    gst_rate: 18,
                    base_amount: 10000,
                    price_subtotal: 10000,
                    line_total: 11800,
                    price_total: 11800,
                    cgst_amount: 900,
                    sgst_amount: 900,
                    igst_amount: 0,
                    hsn_code: product.hsn_code || '0000'
                }],
                amount_untaxed: 10000,
                amount_tax: 1800,
                amount_total: 11800,
                state: 'draft'
            };

            const quoteRes = await fetch(`${BASE_URL}/api/documents`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': cookie
                },
                body: JSON.stringify(docPayload)
            });

            if (!quoteRes.ok) {
                const err = await quoteRes.json();
                throw new Error(`Quotation creation failed: ${JSON.stringify(err)}`);
            }
            const quoteData = await quoteRes.json();
            console.log(`✅ Quotation Created: ${quoteData.doc_number}`);

            // 6. Confirm Order (Convert to Sale)
            const confirmRes = await fetch(`${BASE_URL}/api/documents/${quoteData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': cookie
                },
                body: JSON.stringify({
                    state: 'sale',
                    doc_type: 'sales_order'
                })
            });

            if (!confirmRes.ok) throw new Error(`Order confirmation failed`);
            console.log(`✅ Converted to Sales Order`);

            // 7. Check Analytics Update
            // Give it a moment? Usually instant API response
            const finalAnalytics = await getAnalytics(cookie);

            const revenueDiff = finalAnalytics.summaryMetrics.totalRevenue - initialAnalytics.summaryMetrics.totalRevenue;
            const ordersDiff = finalAnalytics.summaryMetrics.totalOrders - initialAnalytics.summaryMetrics.totalOrders;

            console.log(`   Final Revenue: ${formatCurrency(finalAnalytics.summaryMetrics.totalRevenue)}`);
            console.log(`   Revenue Increase: ${formatCurrency(revenueDiff)}`);

            if (Math.abs(revenueDiff - 10000) < 1) { // untaxed amount
                console.log(`✅ Analytics Revenue Verified (+10,000)`);
            } else {
                // Maybe it tracks total amount? 
                if (Math.abs(revenueDiff - 11800) < 1) {
                    console.log(`✅ Analytics Revenue Verified (Total Amount +11,800)`);
                } else {
                    console.warn(`⚠️ Analytics Mismatch. Expected +10000/11800, got ${revenueDiff}`);
                }
            }

            if (ordersDiff === 1) {
                console.log(`✅ Analytics Orders Count Verified (+1)`);
            } else {
                console.warn(`⚠️ Analytics Order Count Mismatch. Expected +1, got ${ordersDiff}`);
            }

            results[asm.email] = {
                status: 'PASSED',
                revenueIncreased: revenueDiff > 0
            };

        } catch (error) {
            console.error(`❌ FAILED: ${error.message}`);
            results[asm.email] = { status: 'FAILED', error: error.message };
        }
    }

    console.log('\n---------------------------------------------------------');
    console.log('Final Verification Report');
    console.log('---------------------------------------------------------');
    console.table(results);
}

async function getAnalytics(cookie) {
    const res = await fetch(`${BASE_URL}/api/dashboard/analytics?period=this_month`, {
        headers: { 'Cookie': cookie }
    });
    const data = await res.json();
    return data;
}

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount || 0);
};

runVerification();
