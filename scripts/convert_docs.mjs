import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
    'https://qyovguexmivhvefgbmkg.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5b3ZndWV4bWl2aHZlZmdibWtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzE2MzI0NywiZXhwIjoyMDgyNzM5MjQ3fQ.bErj6-X_wize5onUV1Ea4Ch99TCmQIcQvW5LgdnyLcY'
);

// 1. Check current state of documents
const { data: docs, count } = await supabase
    .from('documents')
    .select('id, name, doc_type, state, status, customer_name_raw, amount_total', { count: 'exact' });

console.log(`Total documents: ${count}`);
const byType = {};
const byState = {};
docs.forEach(d => {
    byType[d.doc_type] = (byType[d.doc_type] || 0) + 1;
    byState[d.state] = (byState[d.state] || 0) + 1;
});
console.log('By doc_type:', JSON.stringify(byType));
console.log('By state:', JSON.stringify(byState));

// Show sales_order docs
const salesOrders = docs.filter(d => d.doc_type === 'sales_order' || d.state === 'sale');
console.log(`\nSales orders to convert: ${salesOrders.length}`);
salesOrders.forEach(d => {
    console.log(`  ${d.name} | ${d.doc_type} | state=${d.state} | status=${d.status} | ${d.customer_name_raw} | ₹${d.amount_total}`);
});

// 2. Convert ALL sales_order docs back to quotations
if (salesOrders.length > 0) {
    const ids = salesOrders.map(d => d.id);
    const { data: updated, error } = await supabase
        .from('documents')
        .update({
            doc_type: 'quotation',
            state: 'sent',      // quotation that was "confirmed" → mark as sent
            status: 'draft',    // NOT open — don't count in performance
        })
        .in('id', ids)
        .select('id, name, doc_type, state, status');

    if (error) {
        console.log('ERROR:', error.message);
    } else {
        console.log(`\n✅ Converted ${updated.length} documents back to quotations:`);
        updated.forEach(d => console.log(`  ${d.name} → doc_type=${d.doc_type}, state=${d.state}, status=${d.status}`));
    }
}

// Also convert any with name starting with SO back to QT prefix
const { data: soDocs } = await supabase
    .from('documents')
    .select('id, name')
    .like('name', 'SO-%');

if (soDocs && soDocs.length > 0) {
    console.log(`\nRenaming ${soDocs.length} SO-prefixed documents to QT:`);
    for (const doc of soDocs) {
        const newName = doc.name.replace(/^SO-/, 'QT-');
        await supabase.from('documents').update({ name: newName, quotation_number: newName, doc_number: newName }).eq('id', doc.id);
        console.log(`  ${doc.name} → ${newName}`);
    }
}

console.log('\nDONE');
