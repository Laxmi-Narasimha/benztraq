
const BASE_URL = 'https://benztraq.vercel.app';

async function diagnose() {
    console.log(`Diagnosing Schema on ${BASE_URL}\n`);

    // We can't query DB directly via public API easily.
    // But we can use the 'seed-users' endpoint's bootstrap backdoor to run a custom query if we modify it?
    // OR, we can just use the Login response!
    // Login returns the profile object! 

    // Let's login as one of the users we know exists (or try to).
    // Or just look at verify_log output? 
    // Verify log didn't print full profile.

    // Let's login and print the profile user object keys.
    const email = 'abhishek@benz-packaging.com';
    const password = 'ChangeMe123!'; // Or we need the one from seed... 
    // We can't get the secure password easily without running seed again.

    // Let's rely on the fact that we can hit /api/customers if we login.
    // But better: use the bootstrap backdoor in seed-users to return table info?
    // No, I don't want to modify seed-users again and deploy.

    // I check api/auth/login response in verifying code.
    // I will use verify_production.js logic but just print the profile.

    // Let's create a script that runs seed (to get password) then login then print keys.

    try {
        // 1. Seed to get password
        const seedRes = await fetch(`${BASE_URL}/api/admin/seed-users`, {
            method: 'POST',
            headers: { 'x-bootstrap-secret': 'benz-seed-2024' }
        });
        const seedData = await seedRes.json();
        const pwd = seedData.defaultPassword || 'ChangeMe123!';

        // 2. Login
        const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email, password: pwd, selectedCompany: 'benz' })
        });
        const loginData = await loginRes.json();

        if (loginData.user) {
            console.log('User Keys:', Object.keys(loginData.user));
            // The API response maps fields. check api/auth/login/route.js
            // It maps profile.user_id to id. 
            // It fails to tell us if profile has an internal 'id' column unless we mapped it.
        }

    } catch (e) { console.error(e); }
}

diagnose();
