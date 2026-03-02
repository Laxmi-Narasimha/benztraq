import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
    'https://qyovguexmivhvefgbmkg.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5b3ZndWV4bWl2aHZlZmdibWtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzE2MzI0NywiZXhwIjoyMDgyNzM5MjQ3fQ.bErj6-X_wize5onUV1Ea4Ch99TCmQIcQvW5LgdnyLcY'
);

// Simulate the exact PATCH update that would happen on conversion
const testDocId = 'a0bac4fb-49f2-4082-b199-a93a44654784';

// First get current doc
const { data: currentDoc } = await supabase.from('documents').select('*').eq('id', testDocId).single();
console.log('Current doc:', currentDoc?.name, currentDoc?.state, currentDoc?.doc_type);

// Generate SO number
const { data: soNum } = await supabase.rpc('generate_order_number', { prefix: 'SO' });
console.log('New SO number:', soNum);

// Try the update
const updatePayload = {
    state: 'sale',
    confirmed_at: new Date().toISOString(),
    confirmed_by: currentDoc?.salesperson_user_id || currentDoc?.created_by,
    doc_type: 'sales_order',
    status: 'open',
    name: soNum,
    doc_number: soNum,
    origin: currentDoc?.name || currentDoc?.quotation_number,
};

console.log('Update payload:', JSON.stringify(updatePayload, null, 2));

const { data: updated, error: updateError } = await supabase
    .from('documents')
    .update(updatePayload)
    .eq('id', testDocId)
    .select('id, name, doc_type, state, status, origin, doc_number')
    .single();

if (updateError) {
    console.log('❌ Update error:', updateError.message);
    console.log('  Code:', updateError.code);
    console.log('  Details:', updateError.details);
    console.log('  Hint:', updateError.hint);
} else {
    console.log('✅ Updated:', updated);

    // Revert it back for the user to test
    await supabase.from('documents').update({
        state: 'sent',
        doc_type: 'quotation',
        status: 'sent',
        name: currentDoc.name,
        doc_number: currentDoc.doc_number,
        origin: null,
        confirmed_at: null,
        confirmed_by: null,
    }).eq('id', testDocId);
    console.log('Reverted back to quotation for testing');
}
