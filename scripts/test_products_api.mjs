const BASE_URL = 'https://benztraq.vercel.app';
const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'laxmi@benz-packaging.com', password: 'Benz@2024', selectedCompany: 'benz' }),
    redirect: 'manual',
});
const cookies = (loginRes.headers.getSetCookie?.() || []).map(c => c.split(';')[0]).join('; ');

// Test searches
const searches = [
    'vci laminated',
    'vci film',
    'stretch film',
    'wooden crate',
    'cortec paper',
    'corrosion protection',
];

for (const q of searches) {
    const res = await fetch(`${BASE_URL}/api/products?search=${encodeURIComponent(q)}&limit=5`, { headers: { Cookie: cookies } });
    const data = await res.json();
    const count = data.pagination?.total || 0;
    const names = data.products?.slice(0, 3).map(p => p.item_name) || [];
    console.log(`"${q}" → ${count} results: ${names.join(' | ') || 'none'}`);
}
