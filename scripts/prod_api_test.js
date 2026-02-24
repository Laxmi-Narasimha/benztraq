

const BASE_URL = 'https://benztraq.vercel.app';

async function runTest() {
    let cookie = '';

    // 1. Login as Abhishek
    console.log('Logging in as Abhishek (ASM)...');
    let res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'abhishek@benz-packaging.com', password: 'Benz@2024', selectedCompany: 'benz' })
    });
    let data = await res.json();
    if (!data.success) throw new Error('Abhishek login failed: ' + JSON.stringify(data));
    cookie = res.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');
    console.log('Abhishek login successful.');

    // 2. Create target customer
    const custName = `Prod Test Customer ${Date.now()}`;
    console.log(`Creating customer: ${custName}...`);
    res = await fetch(`${BASE_URL}/api/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
        body: JSON.stringify({ name: custName, company_type: 'company' })
    });
    let custData = await res.json();
    if (!custData.customer) throw new Error('Customer creation failed: ' + JSON.stringify(custData));
    const custId = custData.customer.id;
    console.log(`Customer created: ${custData.customer.customer_code}`);

    // 3. Create Quotation
    console.log('Creating quotation...');
    res = await fetch(`${BASE_URL}/api/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
        body: JSON.stringify({
            doc_type: 'quotation',
            partner_id: custId,
            customer_name: custName,
            amount_total: 9999,
            line_items: [{ name: 'Test Box V2', quantity: 100, unit_price: 99.99, price_total: 9999 }]
        })
    });
    let docData = await res.json();
    if (!docData.document) throw new Error('Quote creation failed: ' + JSON.stringify(docData));
    const docId = docData.document.id;
    const docName = docData.document.name;
    console.log(`Quote created successfully: ${docName}`);

    // 4. Login as Pulak
    console.log('\\nLogging in as Pulak (Head of Sales)...');
    res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'pulak@benz-packaging.com', password: 'Benz@2024', selectedCompany: 'benz' })
    });
    data = await res.json();
    if (!data.success) throw new Error('Pulak login failed: ' + JSON.stringify(data));
    let pulakCookie = res.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');
    console.log('Pulak login successful.');

    // 5. Verify visibility for Pulak
    res = await fetch(`${BASE_URL}/api/documents?limit=20`, {
        headers: { 'Cookie': pulakCookie }
    });
    let docsData = await res.json();
    let found = docsData.documents.find(d => d.id === docId);
    if (found) {
        console.log(`\\nSUCCESS: Pulak CAN see the quote ${docName}!`);
        console.log(`Amount: ${found.amount_total}, Customer: ${found.customer_name_raw}`);
    } else {
        console.log(`\\nFAIL: Pulak cannot see the quote ${docName}.`);
    }

    console.log('\\nData created successfully. Ready for frontend visual verification.');

    // Save the credentials and doc info for the next step
    require('fs').writeFileSync('prod_test_info.json', JSON.stringify({
        docName,
        custName,
        pulakEmail: 'pulak@benz-packaging.com',
        pulakPwd: 'Benz@2024'
    }));
}

runTest().catch(console.error);
