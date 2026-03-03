const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://qyovguexmivhvefgbmkg.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5b3ZndWV4bWl2aHZlZmdibWtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzE2MzI0NywiZXhwIjoyMDgyNzM5MjQ3fQ.bErj6-X_wize5onUV1Ea4Ch99TCmQIcQvW5LgdnyLcY'
);

async function main() {
    // Change Isha from director to asm (CRM employee)
    const { error } = await supabase
        .from('profiles')
        .update({ role: 'asm' })
        .eq('user_id', '480090cb-3fad-45ce-beae-b89576f4c722');

    if (error) {
        console.log('Error:', error.message);
    } else {
        console.log('OK: Isha role changed to asm');
    }

    // Verify
    const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, full_name, role, companies')
        .eq('user_id', '480090cb-3fad-45ce-beae-b89576f4c722')
        .single();

    console.log('Profile:', JSON.stringify(profile, null, 2));
}

main();
