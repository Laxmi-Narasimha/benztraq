/**
 * User Onboarding Script
 * 
 * Onboards all users from the CSV into BenzTraq.
 * - Creates 'manager' and 'employee' roles if they don't exist
 * - Sets password to "benz" for all non-director users
 * - Directors keep their existing passwords
 * - Isha gets the 'manager' role
 * - Manan, Chaitanya, Prashansa get 'director' role
 * - Laxmi gets 'developer' role
 * - Everyone else gets 'employee' role
 * 
 * Run: node scripts/onboard_users.mjs
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// ── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://qyovguexmivhvefgbmkg.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5b3ZndWV4bWl2aHZlZmdibWtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzE2MzI0NywiZXhwIjoyMDgyNzM5MjQ3fQ.bErj6-X_wize5onUV1Ea4Ch99TCmQIcQvW5LgdnyLcY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const EMPLOYEE_PASSWORD = 'benz';
const SALT_ROUNDS = 12;

// ── Role Assignments ────────────────────────────────────────────────────────
const DIRECTORS = ['manan@benz-packaging.com', 'chaitanya@benz-packaging.com', 'prashansa@benz-packaging.com'];
const MANAGERS = ['isha@benz-packaging.com'];
const DEVELOPERS = ['laxmi@benz-packaging.com'];

function getRole(email) {
    const e = email.toLowerCase();
    if (DEVELOPERS.includes(e)) return 'developer';
    if (DIRECTORS.includes(e)) return 'director';
    if (MANAGERS.includes(e)) return 'manager';
    return 'employee';
}

function getDesignation(email, firstName, lastName) {
    const e = email.toLowerCase();
    if (DEVELOPERS.includes(e)) return 'System Developer';
    if (DIRECTORS.includes(e)) return 'Director';
    if (MANAGERS.includes(e)) return 'Manager';
    return 'Employee';
}

// ── All Users from CSV ──────────────────────────────────────────────────────
const ALL_USERS = [
    { firstName: 'A.A.', lastName: 'Paulraj', email: 'paulraj@benz-packaging.com' },
    { firstName: 'Abhishek', lastName: 'Yogi', email: 'wh.jaipur@benz-packaging.com' },
    { firstName: 'Abhishek', lastName: 'Kori', email: 'abhishek@benz-packaging.com' },
    { firstName: 'Accounts', lastName: 'Chennai', email: 'accounts.chennai@benz-packaging.com' },
    { firstName: 'Accounts', lastName: 'BENZ Packaging', email: 'accounts@benz-packaging.com' },
    { firstName: 'Ajay', lastName: '.', email: 'ajay@benz-packaging.com' },
    { firstName: 'Aman', lastName: 'Roy', email: 'dispatch1@benz-packaging.com' },
    { firstName: 'Anirudh', lastName: 'Nama', email: 'anirudh@benz-packaging.com' },
    { firstName: 'Babita', lastName: '.', email: 'sales3@benz-packaging.com' },
    { firstName: 'BENZ', lastName: 'Sales', email: 'sales4@benz-packaging.com' },
    { firstName: 'Chaitanya', lastName: 'Chopra', email: 'chaitanya@benz-packaging.com' },
    { firstName: 'Credit Control', lastName: 'BPSPL', email: 'credit@benz-packaging.com' },
    { firstName: 'Deepak', lastName: 'Bhardwaj', email: 'deepak@benz-packaging.com' },
    { firstName: 'Dinesh', lastName: 'BENZ Packaging', email: 'dinesh@benz-packaging.com' },
    { firstName: 'Ergopack', lastName: 'India', email: 'sales@ergopack-india.com' },
    { firstName: 'ERP', lastName: 'Team', email: 'erp@benz-packaging.com' },
    { firstName: 'Gate Entry', lastName: 'BPSPL', email: 'gate@benz-packaging.com' },
    { firstName: 'HR', lastName: 'Support', email: 'hr.support@benz-packaging.com' },
    { firstName: 'HR', lastName: 'Benz Packaging', email: 'hr@benz-packaging.com' },
    { firstName: 'Isha', lastName: 'Mahajan', email: 'isha@benz-packaging.com' },
    { firstName: 'Jayashree', lastName: 'N', email: 'chennai@benz-packaging.com' },
    { firstName: 'Karan', lastName: 'Batra', email: 'karan@benz-packaging.com' },
    { firstName: 'Karthick', lastName: 'Ravishankar', email: 'karthick@benz-packaging.com' },
    { firstName: 'Laxmi', lastName: 'Narasimha', email: 'laxmi@benz-packaging.com' },
    { firstName: 'Lokesh', lastName: 'Ronchhiya', email: 'lokesh@benz-packaging.com' },
    { firstName: 'Mahesh', lastName: 'Gupta', email: 'hr.manager@benz-packaging.com' },
    { firstName: 'Manan', lastName: 'Chopra', email: 'manan@benz-packaging.com' },
    { firstName: 'Marketing', lastName: 'BPSPL', email: 'marketing@benz-packaging.com' },
    { firstName: 'Narender', lastName: 'BENZ Packaging', email: 'warehouse@benz-packaging.com' },
    { firstName: 'Neeraj', lastName: 'Singh', email: 'neeraj@benz-packaging.com' },
    { firstName: 'Neveta', lastName: 'Benz', email: 'neveta@benz-packaging.com' },
    { firstName: 'Paramveer', lastName: 'Yadav', email: 'supplychain@benz-packaging.com' },
    { firstName: 'Pavan', lastName: 'Kumar', email: 'pavan.kr@benz-packaging.com' },
    { firstName: 'Pawan', lastName: 'BENZ Packaging', email: 'qa@benz-packaging.com' },
    { firstName: 'PO', lastName: '.', email: 'po@benz-packaging.com' },
    { firstName: 'Pradeep', lastName: 'Kumar', email: 'ccare2@benz-packaging.com' },
    { firstName: 'Prashansa', lastName: 'Madan', email: 'prashansa@benz-packaging.com' },
    { firstName: 'Preeti', lastName: 'R', email: 'ccare6@benz-packaging.com' },
    { firstName: 'Pulak', lastName: 'Biswas', email: 'pulak@benz-packaging.com' },
    { firstName: 'Quality', lastName: 'Chennai', email: 'quality.chennai@benz-packaging.com' },
    { firstName: 'Rahul', lastName: '.', email: 'rahul@benz-packaging.com' },
    { firstName: 'Rekha', lastName: 'C', email: 'rekha@benz-packaging.com' },
    { firstName: 'Samish', lastName: 'Thakur', email: 'samish@benz-packaging.com' },
    { firstName: 'Sandeep', lastName: '.', email: 'sandeep@benz-packaging.com' },
    { firstName: 'Satender', lastName: 'Singh', email: 'satender@benz-packaging.com' },
    { firstName: 'Sathees', lastName: 'Waran', email: 'satheeswaran@benz-packaging.com' },
    { firstName: 'Saurav', lastName: 'Kumar', email: 'saurav@benz-packaging.com' },
    { firstName: 'Shikha Sharma', lastName: 'CRM', email: 'ccare@benz-packaging.com' },
    { firstName: 'Store', lastName: 'BENZ Packaging', email: 'store@benz-packaging.com' },
    { firstName: 'Tanuj', lastName: '.', email: 'sales7@benz-packaging.com' },
    { firstName: 'Tarun', lastName: 'Bhardwaj', email: 'sales5@benz-packaging.com' },
    { firstName: 'Tomy', lastName: 'Yamada', email: 'yamada@benz-packaging.com' },
    { firstName: 'TS', lastName: 'Bhandari', email: 'bhandari@benz-packaging.com' },
    { firstName: 'Udit', lastName: 'Suri', email: 'it@benz-packaging.com' },
    { firstName: 'Vijay', lastName: 'Danieal', email: 'bangalore@benz-packaging.com' },
    { firstName: 'Vikky', lastName: 'Dhanka', email: 'vikky@benz-packaging.com' },
    { firstName: 'Warehouse', lastName: 'AP', email: 'warehouse.ap@benz-packaging.com' },
];

function buildFullName(firstName, lastName) {
    // Clean up names - remove dots and generic suffixes
    const cleanLast = lastName === '.' ? '' : lastName;
    if (!cleanLast || cleanLast === 'BENZ Packaging' || cleanLast === 'BPSPL' || cleanLast === 'CRM') {
        return firstName;
    }
    return `${firstName} ${cleanLast}`;
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
    console.log('🚀 Starting user onboarding...\n');

    // Step 1: Ensure roles exist
    console.log('📋 Step 1: Setting up roles...');
    const ROLES_TO_SEED = [
        { name: 'developer', display_name: 'Developer', level: 100 },
        { name: 'director', display_name: 'Director', level: 90 },
        { name: 'manager', display_name: 'Manager', level: 70 },
        { name: 'head_of_sales', display_name: 'Head of Sales', level: 80 },
        { name: 'employee', display_name: 'Employee', level: 10 },
        { name: 'asm', display_name: 'Area Sales Manager', level: 50 },
        { name: 'sales_executive', display_name: 'Sales Executive', level: 20 },
    ];

    const { error: roleErr } = await supabase.from('roles').upsert(ROLES_TO_SEED, { onConflict: 'name' });
    if (roleErr) {
        console.error('❌ Error upserting roles:', roleErr.message);
        process.exit(1);
    }
    console.log('  ✅ Roles ready (including new "manager" and "employee" roles)\n');

    // Step 2: Add permissions for new roles
    console.log('📋 Step 2: Setting up permissions for manager and employee roles...');

    // Get role IDs
    const { data: roles } = await supabase.from('roles').select('id, name');
    const roleMap = {};
    roles?.forEach(r => { roleMap[r.name] = r.id; });
    console.log('  Role map:', Object.keys(roleMap).join(', '));

    // Manager permissions: can see all tasks, can assign tasks, can read team data
    const managerPerms = [
        'users', 'documents', 'leads', 'quotations', 'sales_orders',
        'customers', 'teams', 'targets', 'reports', 'tasks'
    ].map(resource => ({
        role_id: roleMap['manager'],
        resource,
        can_read: true,
        can_write: ['tasks', 'documents', 'leads', 'quotations', 'sales_orders', 'customers'].includes(resource),
        can_create: ['tasks', 'documents', 'leads', 'quotations', 'sales_orders', 'customers'].includes(resource),
        can_delete: resource === 'tasks',
        scope: ['tasks', 'users'].includes(resource) ? 'all' : 'team',
    }));

    // Employee permissions: only own data
    const employeePerms = [
        'documents', 'tasks', 'customers'
    ].map(resource => ({
        role_id: roleMap['employee'],
        resource,
        can_read: true,
        can_write: resource === 'tasks',
        can_create: resource === 'tasks',
        can_delete: false,
        scope: 'own',
    }));

    // Add 'tasks' permission for existing roles too
    const existingRoleTaskPerms = [
        { role_id: roleMap['developer'], resource: 'tasks', can_read: true, can_write: true, can_create: true, can_delete: true, scope: 'all' },
        { role_id: roleMap['director'], resource: 'tasks', can_read: true, can_write: true, can_create: true, can_delete: true, scope: 'all' },
        { role_id: roleMap['head_of_sales'], resource: 'tasks', can_read: true, can_write: true, can_create: true, can_delete: false, scope: 'all' },
        { role_id: roleMap['asm'], resource: 'tasks', can_read: true, can_write: true, can_create: true, can_delete: false, scope: 'own' },
    ];

    const allPerms = [...managerPerms, ...employeePerms, ...existingRoleTaskPerms];

    for (const perm of allPerms) {
        const { error: permErr } = await supabase
            .from('permissions')
            .upsert(perm, { onConflict: 'role_id,resource' });
        if (permErr) {
            console.error(`  ⚠️ Permission error for ${perm.resource}:`, permErr.message);
        }
    }
    console.log('  ✅ Permissions ready\n');

    // Step 3: Hash the employee password
    console.log('📋 Step 3: Hashing passwords...');
    const employeeHash = await bcrypt.hash(EMPLOYEE_PASSWORD, SALT_ROUNDS);
    console.log(`  ✅ Password "benz" hashed\n`);

    // Step 4: Get existing profiles to know what to update vs create
    console.log('📋 Step 4: Fetching existing profiles...');
    const { data: existingProfiles } = await supabase.from('profiles').select('user_id, email');
    const existingEmails = new Set((existingProfiles || []).map(p => p.email?.toLowerCase()));
    console.log(`  Found ${existingEmails.size} existing profiles\n`);

    // Step 5: Get existing auth users
    console.log('📋 Step 5: Fetching existing auth users...');
    let authUserMap = {};
    let page = 1;
    let hasMore = true;
    while (hasMore) {
        const { data: { users: authUsers }, error: authErr } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
        if (authErr) {
            console.error('  ⚠️ Auth list error:', authErr.message);
            break;
        }
        if (authUsers && authUsers.length > 0) {
            authUsers.forEach(u => {
                if (u.email) authUserMap[u.email.toLowerCase()] = u.id;
            });
            page++;
            if (authUsers.length < 100) hasMore = false;
        } else {
            hasMore = false;
        }
    }
    console.log(`  Found ${Object.keys(authUserMap).length} existing auth users\n`);

    // Step 6: Process each user
    console.log('📋 Step 6: Processing users...\n');

    const results = { created: 0, updated: 0, errors: 0 };

    for (const user of ALL_USERS) {
        const email = user.email.toLowerCase();
        const fullName = buildFullName(user.firstName, user.lastName);
        const roleName = getRole(email);
        const designation = getDesignation(email, user.firstName, user.lastName);
        const isDirector = DIRECTORS.includes(email);
        const isDeveloper = DEVELOPERS.includes(email);

        // Determine companies array
        let companies = ['benz'];
        if (isDirector || isDeveloper) companies = ['benz', 'ergopack'];
        if (email === 'sales@ergopack-india.com') companies = ['ergopack'];

        // Determine organization
        let organization = 'benz_packaging';
        if (email === 'sales@ergopack-india.com') organization = 'ergopack_india';

        // Legacy role mapping
        const legacyRole = isDeveloper ? 'vp'
            : isDirector ? 'director'
                : roleName === 'manager' ? 'director'
                    : roleName === 'head_of_sales' ? 'director'
                        : 'asm';

        try {
            // Get or create auth user
            let userId = authUserMap[email];

            if (!userId) {
                // Create auth user
                const password = isDirector ? 'Hound@1102' : EMPLOYEE_PASSWORD;
                const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
                    email: email,
                    password: password,
                    email_confirm: true,
                    user_metadata: { full_name: fullName }
                });

                if (createErr) {
                    console.error(`  ❌ ${email}: Auth create error - ${createErr.message}`);
                    results.errors++;
                    continue;
                }
                userId = newUser.user.id;
                console.log(`  🆕 ${email}: Auth user created`);
            } else {
                // Update password for non-directors
                if (!isDirector) {
                    await supabase.auth.admin.updateUserById(userId, { password: EMPLOYEE_PASSWORD });
                }
            }

            // Determine password hash for profile
            const passwordHash = isDirector ? undefined : employeeHash; // Directors keep their existing hash

            // Build profile data
            const profileData = {
                user_id: userId,
                full_name: fullName,
                email: email,
                role_id: roleMap[roleName],
                designation: designation,
                is_active: true,
                role: legacyRole,
                organization: organization,
                companies: companies,
            };

            // Only set password hash for non-directors (directors keep theirs)
            if (!isDirector) {
                profileData.password_hash = employeeHash;
            }

            const isExisting = existingEmails.has(email);

            const { error: profileErr } = await supabase
                .from('profiles')
                .upsert(profileData, { onConflict: 'email', ignoreDuplicates: false });

            if (profileErr) {
                console.error(`  ❌ ${email}: Profile error - ${profileErr.message}`);
                results.errors++;
            } else {
                const action = isExisting ? 'updated' : 'created';
                const roleLabel = roleName.toUpperCase();
                console.log(`  ✅ ${email}: ${action} [${roleLabel}] → ${fullName}`);
                if (isExisting) results.updated++;
                else results.created++;
            }
        } catch (err) {
            console.error(`  ❌ ${email}: ${err.message}`);
            results.errors++;
        }
    }

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('📊 ONBOARDING SUMMARY');
    console.log('═'.repeat(60));
    console.log(`  Total users processed: ${ALL_USERS.length}`);
    console.log(`  ✅ Created: ${results.created}`);
    console.log(`  🔄 Updated: ${results.updated}`);
    console.log(`  ❌ Errors: ${results.errors}`);
    console.log(`\n  🔐 Password for all non-directors: "benz"`);
    console.log(`  🔐 Directors keep their existing passwords`);
    console.log(`\n  👑 Directors: ${DIRECTORS.join(', ')}`);
    console.log(`  📋 Managers: ${MANAGERS.join(', ')}`);
    console.log(`  💻 Developers: ${DEVELOPERS.join(', ')}`);
    console.log(`  👤 Employees: ${ALL_USERS.length - DIRECTORS.length - MANAGERS.length - DEVELOPERS.length}`);
    console.log('═'.repeat(60));
}

main().catch(console.error);
