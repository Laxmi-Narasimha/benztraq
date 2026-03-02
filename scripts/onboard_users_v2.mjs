/**
 * User Onboarding Script v2 - Fixed PK conflict handling
 * 
 * Run: node scripts/onboard_users_v2.mjs
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const SUPABASE_URL = 'https://qyovguexmivhvefgbmkg.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5b3ZndWV4bWl2aHZlZmdibWtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzE2MzI0NywiZXhwIjoyMDgyNzM5MjQ3fQ.bErj6-X_wize5onUV1Ea4Ch99TCmQIcQvW5LgdnyLcY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const EMPLOYEE_PASSWORD = 'benz';
const SALT_ROUNDS = 12;

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
    const cleanLast = lastName === '.' ? '' : lastName;
    if (!cleanLast || cleanLast === 'BENZ Packaging' || cleanLast === 'BPSPL' || cleanLast === 'CRM') {
        return firstName;
    }
    return `${firstName} ${cleanLast}`;
}

async function main() {
    console.log('Starting user onboarding v2...');

    // Get role IDs
    const { data: roles } = await supabase.from('roles').select('id, name');
    const roleMap = {};
    roles?.forEach(r => { roleMap[r.name] = r.id; });
    console.log('Roles:', Object.keys(roleMap).join(', '));

    // Hash password
    const employeeHash = await bcrypt.hash(EMPLOYEE_PASSWORD, SALT_ROUNDS);

    // Get ALL existing profiles mapped by email
    const { data: existingProfiles } = await supabase.from('profiles').select('user_id, email');
    const profileByEmail = {};
    (existingProfiles || []).forEach(p => { if (p.email) profileByEmail[p.email.toLowerCase()] = p.user_id; });
    console.log('Existing profiles:', Object.keys(profileByEmail).length);

    // Get ALL existing auth users
    let authUserMap = {};
    let page = 1;
    let hasMore = true;
    while (hasMore) {
        const { data: { users: authUsers } } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
        if (authUsers && authUsers.length > 0) {
            authUsers.forEach(u => { if (u.email) authUserMap[u.email.toLowerCase()] = u.id; });
            page++;
            if (authUsers.length < 100) hasMore = false;
        } else { hasMore = false; }
    }
    console.log('Existing auth users:', Object.keys(authUserMap).length);

    let created = 0, updated = 0, errors = 0;

    for (const user of ALL_USERS) {
        const email = user.email.toLowerCase();
        const fullName = buildFullName(user.firstName, user.lastName);
        const roleName = getRole(email);
        const isDirector = DIRECTORS.includes(email);
        const isDeveloper = DEVELOPERS.includes(email);
        const isManager = MANAGERS.includes(email);

        let companies = ['benz'];
        if (isDirector || isDeveloper) companies = ['benz', 'ergopack'];
        if (email === 'sales@ergopack-india.com') companies = ['ergopack'];

        let organization = 'benz_packaging';
        if (email === 'sales@ergopack-india.com') organization = 'ergopack_india';

        const legacyRole = isDeveloper ? 'vp' : (isDirector || isManager) ? 'director' : 'asm';

        const designation = isDeveloper ? 'System Developer'
            : isDirector ? 'Director'
                : isManager ? 'Manager'
                    : 'Employee';

        try {
            // 1. Ensure auth user exists
            let authUserId = authUserMap[email];
            if (!authUserId) {
                const password = isDirector ? 'Hound@1102' : EMPLOYEE_PASSWORD;
                const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
                    email, password, email_confirm: true,
                    user_metadata: { full_name: fullName }
                });
                if (createErr) {
                    console.log(`ERR ${email}: auth create - ${createErr.message}`);
                    errors++;
                    continue;
                }
                authUserId = newUser.user.id;
            } else if (!isDirector) {
                // Update password for non-directors
                await supabase.auth.admin.updateUserById(authUserId, { password: EMPLOYEE_PASSWORD });
            }

            // 2. Check if profile exists
            const existingProfileUserId = profileByEmail[email];

            if (existingProfileUserId) {
                // UPDATE existing profile (by user_id PK)
                const updateData = {
                    full_name: fullName,
                    role_id: roleMap[roleName],
                    designation,
                    is_active: true,
                    role: legacyRole,
                    organization,
                    companies,
                };
                if (!isDirector) {
                    updateData.password_hash = employeeHash;
                }

                const { error } = await supabase
                    .from('profiles')
                    .update(updateData)
                    .eq('user_id', existingProfileUserId);

                if (error) {
                    console.log(`ERR ${email}: profile update - ${error.message}`);
                    errors++;
                } else {
                    console.log(`UPD ${email} [${roleName}] ${fullName}`);
                    updated++;
                }
            } else {
                // INSERT new profile using the auth user id
                const insertData = {
                    user_id: authUserId,
                    full_name: fullName,
                    email,
                    role_id: roleMap[roleName],
                    designation,
                    password_hash: isDirector ? await bcrypt.hash('Hound@1102', SALT_ROUNDS) : employeeHash,
                    is_active: true,
                    role: legacyRole,
                    organization,
                    companies,
                };

                const { error } = await supabase.from('profiles').insert(insertData);
                if (error) {
                    console.log(`ERR ${email}: profile insert - ${error.message}`);
                    errors++;
                } else {
                    console.log(`NEW ${email} [${roleName}] ${fullName}`);
                    created++;
                }
            }
        } catch (err) {
            console.log(`ERR ${email}: ${err.message}`);
            errors++;
        }
    }

    console.log(`\nDONE: Created=${created} Updated=${updated} Errors=${errors} Total=${ALL_USERS.length}`);
}

main().catch(console.error);
