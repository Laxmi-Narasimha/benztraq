import { createClient } from '@supabase/supabase-js';
const s = createClient('https://qyovguexmivhvefgbmkg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5b3ZndWV4bWl2aHZlZmdibWtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzE2MzI0NywiZXhwIjoyMDgyNzM5MjQ3fQ.bErj6-X_wize5onUV1Ea4Ch99TCmQIcQvW5LgdnyLcY');

// Revert the test conversion so user can test
await s.from('documents').update({
    state: 'draft', doc_type: 'quotation', status: 'draft',
    name: 'QT2602-1041', doc_number: 'QT2602-1041',
    origin: null, confirmed_at: null
}).eq('id', 'a0bac4fb-49f2-4082-b199-a93a44654784');
console.log('Reverted QT2602-1041 back to quotation for user testing');
