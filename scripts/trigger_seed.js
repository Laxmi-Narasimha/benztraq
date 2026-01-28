/**
 * Trigger User Seeding via Production API
 * Calls the /api/admin/seed-users endpoint to create/update all users
 */

const BASE_URL = 'https://benztraq.vercel.app';

async function seedUsers() {
    console.log('🌱 Triggering User Seeding via API...\n');

    try {
        // Call the seed-users endpoint
        const response = await fetch(`${BASE_URL}/api/admin/seed-users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Use a special bypass key for seeding (if implemented) or send empty body
            },
            body: JSON.stringify({})
        });

        const data = await response.json();

        if (!response.ok) {
            console.log(`⚠️  API returned ${response.status}: ${response.statusText}`);
            console.log('Response:', JSON.stringify(data, null, 2));

            if (response.status === 401) {
                console.log('\n📝 The seed endpoint requires authentication.');
                console.log('Let me check what the actual passwords are in the users table...\n');
            }
            return false;
        }

        console.log('✅ Seed API Response:');
        console.log(JSON.stringify(data, null, 2));

        console.log('\n🎉 Users have been seeded!');
        console.log('\nYou should now be able to login with:');
        console.log('- Email: laxmi@benz-packaging.com');
        console.log('- Password: Benz@2024');

        return true;

    } catch (err) {
        console.error('❌ Error calling seed API:', err.message);
        console.error(err);
        return false;
    }
}

seedUsers();
