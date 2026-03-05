/**
 * Fix Pulak Biswas's Role CORRECTLY
 * Based on seed data: head_of_sales, region Gurgaon, companies ['benz'] only
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qyovguexmivhvefgbmkg.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5b3ZndWV4bWl2aHZlZmdibWtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzE2MzI0NywiZXhwIjoyMDgyNzM5MjQ3fQ.bErj6-X_wize5onUV1Ea4Ch99TCmQIcQvW5LgdnyLcY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixPulakRole() {
    // 1. Get Pulak's current profile
    console.log('=== STEP 1: Current Pulak profile ===');
    const { data: pulak } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, role_id, role, is_active, companies, organization, designation, region_id')
        .ilike('email', 'pulak@benz-packaging.com')
        .single();

    if (!pulak) { console.error('❌ Pulak not found'); return; }
    console.log(JSON.stringify(pulak, null, 2));

    // 2. Get the head_of_sales role ID
    const { data: hosRole } = await supabase
        .from('roles')
        .select('id, name, display_name, level')
        .eq('name', 'head_of_sales')
        .single();

    if (!hosRole) { console.error('❌ head_of_sales role not found'); return; }
    console.log('\nTarget role:', JSON.stringify(hosRole, null, 2));

    // 3. Get the Gurgaon region ID
    const { data: gurgaonRegion } = await supabase
        .from('regions')
        .select('id, name')
        .eq('name', 'Gurgaon')
        .single();

    console.log('Target region:', JSON.stringify(gurgaonRegion, null, 2));

    // 4. Update Pulak to EXACTLY his correct config
    console.log('\n=== STEP 2: Updating Pulak to head_of_sales, benz only ===');
    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            role_id: hosRole.id,
            role: 'director',           // legacy role mapping for head_of_sales
            designation: 'Head of Sales',
            region_id: gurgaonRegion?.id || pulak.region_id,
            organization: 'benz_packaging',
            companies: ['benz'],        // BENZ ONLY, no ergopack
            is_active: true
        })
        .eq('user_id', pulak.user_id);

    if (updateError) {
        console.error('❌ Update failed:', updateError.message);
        return;
    }
    console.log('✅ Updated successfully!');

    // 5. Verify
    console.log('\n=== STEP 3: Verification ===');
    const { data: updated } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, role_id, role, is_active, companies, organization, designation, region_id')
        .eq('user_id', pulak.user_id)
        .single();
    console.log(JSON.stringify(updated, null, 2));

    // 6. Check permissions for head_of_sales
    const { data: permissions } = await supabase
        .from('permissions')
        .select('resource, can_read, can_write, can_create, can_delete, scope')
        .eq('role_id', hosRole.id);

    console.log('\nPermissions for head_of_sales:');
    if (permissions?.length) {
        permissions.forEach(p => {
            console.log(`  ${p.resource}: read=${p.can_read} write=${p.can_write} create=${p.can_create} delete=${p.can_delete} scope=${p.scope}`);
        });
    } else {
        console.log('  ⚠️ NO PERMISSIONS FOUND for this role!');
    }

    console.log('\n✅ Done! Pulak Biswas is now head_of_sales with benz-only access.');
    console.log('   He needs to LOG OUT and LOG BACK IN for changes to take effect.');
}

fixPulakRole().catch(console.error);
