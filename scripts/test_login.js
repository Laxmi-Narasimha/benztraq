/**
 * Login Diagnostic Test
 * Test login with abhishek@benz-packaging.com and diagnose the 401 error
 */

const BASE_URL = 'https://benztraq.vercel.app';

async function testLogin() {
    console.log('🔐 Testing Login for abhishek@benz-packaging.com\n');

    const credentials = {
        email: 'abhishek@benz-packaging.com',
        password: 'Benz@2024'
    };

    try {
        console.log('1️⃣ Attempting login...');
        console.log('   Email:', credentials.email);
        console.log('   Password:', credentials.password);
        console.log('   URL:', `${BASE_URL}/api/auth/login\n`);

        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });

        console.log('2️⃣ Response Status:', response.status, response.statusText, '\n');

        const data = await response.json();

        if (response.ok) {
            console.log('✅ LOGIN SUCCESSFUL!\n');
            console.log('Response:', JSON.stringify(data, null, 2));
            return true;
        } else {
            console.log('❌ LOGIN FAILED!\n');
            console.log('Error Response:', JSON.stringify(data, null, 2));

            // Try to get more details
            console.log('\n3️⃣ Detailed Error Analysis:');
            console.log('   Status Code:', response.status);
            console.log('   Error Message:', data.error || 'No error message');
            console.log('   Error Details:', data.details || 'No details');

            if (response.status === 401) {
                console.log('\n⚠️  401 Unauthorized means one of:');
                console.log('   1. User does not exist in the database');
                console.log('   2. Password hash does not match');
                console.log('   3. User account is inactive');
                console.log('   4. Email is not found in profiles table');
            }

            return false;
        }

    } catch (err) {
        console.error('\n❌ Network/Exception Error:', err.message);
        console.error(err);
        return false;
    }
}

// Also test with other users to see if it's a general issue
async function testMultipleUsers() {
    const users = [
        { email: 'abhishek@benz-packaging.com', password: 'Benz@2024' },
        { email: 'laxmi@benz-packaging.com', password: 'Benz@2024' },
        { email: 'manan@benz-packaging.com', password: 'Benz@2024' }
    ];

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Testing Multiple Users:\n');

    for (const user of users) {
        console.log(`Testing: ${user.email}`);

        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });

        const result = response.ok ? '✅ SUCCESS' : `❌ FAILED (${response.status})`;
        console.log(`  → ${result}\n`);
    }
}

// Run tests
testLogin().then(success => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (!success) {
        console.log('Running additional tests with multiple users...\n');
        return testMultipleUsers();
    }
}).then(() => {
    console.log('\n✅ Diagnostic test complete\n');
});
