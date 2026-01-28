
const BASE_URL = 'https://benztraq.vercel.app';

async function diagnose() {
    console.log(`Diagnosing ${BASE_URL}\n`);

    // 1. Check Products Endpoint (Expect 401 JSON)
    try {
        console.log('Testing GET /api/products...');
        const res = await fetch(`${BASE_URL}/api/products`);
        console.log(`Status: ${res.status} ${res.statusText}`);
        const text = await res.text();
        console.log(`Body start: ${text.substring(0, 100)}`);
        try {
            JSON.parse(text);
            console.log('✅ Body is JSON');
        } catch {
            console.log('❌ Body is NOT JSON');
        }
    } catch (e) {
        console.error('Fetch failed:', e.message);
    }

    // 2. Check Seed Endpoint (Expect 200 or 401 JSON)
    try {
        console.log('\nTesting POST /api/admin/seed-users...');
        const res = await fetch(`${BASE_URL}/api/admin/seed-users`, {
            method: 'POST',
            headers: {
                'x-bootstrap-secret': 'benz-seed-2024'
            }
        });
        console.log(`Status: ${res.status} ${res.statusText}`);
        const text = await res.text();
        console.log(`Body start: ${text.substring(0, 200)}`); // Show more cause it might be stack trace
        try {
            JSON.parse(text);
            console.log('✅ Body is JSON');
        } catch {
            console.log('❌ Body is NOT JSON');
        }
    } catch (e) {
        console.error('Fetch failed:', e.message);
    }
}

diagnose();
