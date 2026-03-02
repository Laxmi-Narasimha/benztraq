import fs from 'fs';

const text = fs.readFileSync('.env.local', 'utf-8');
for (const line of text.split('\n')) {
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.substring(0, idx).trim();
    let val = line.substring(idx + 1).replace(/["'\r\n\s]/g, '');
    if (key === 'SUPABASE_SERVICE_ROLE_KEY') {
        console.log('SRK len:', val.length, 'First10:', val.substring(0, 10), 'Last5:', val.substring(val.length - 5));
    }
    if (key === 'NEXT_PUBLIC_SUPABASE_URL') {
        console.log('URL:', val);
    }
}
