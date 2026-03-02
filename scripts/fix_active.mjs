import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
    'https://qyovguexmivhvefgbmkg.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5b3ZndWV4bWl2aHZlZmdibWtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzE2MzI0NywiZXhwIjoyMDgyNzM5MjQ3fQ.bErj6-X_wize5onUV1Ea4Ch99TCmQIcQvW5LgdnyLcY'
);

// Check active column values
const { data: activeTrue } = await supabase.from('customers').select('id', { count: 'exact', head: true }).eq('active', true);
const { data: activeFalse, count: falseCount } = await supabase.from('customers').select('id', { count: 'exact', head: true }).eq('active', false);
const { data: activeNull, count: nullCount } = await supabase.from('customers').select('id', { count: 'exact', head: true }).is('active', null);
const { count: total } = await supabase.from('customers').select('*', { count: 'exact', head: true });

console.log('Total:', total);
console.log('active=true:', activeTrue);
console.log('active=false:', falseCount);
console.log('active=null:', nullCount);

// Fix: set all customers to active=true
console.log('\nSetting ALL customers to active=true...');
const { error } = await supabase.from('customers').update({ active: true }).neq('active', true);
if (error) console.error('Error:', error.message);
else console.log('Done!');

const { count: final } = await supabase.from('customers').select('*', { count: 'exact', head: true }).eq('active', true);
console.log('Active customers now:', final);
