/**
 * Import tasks from CSV — Debug version
 * Shows exact error on first failure
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

function loadEnv() {
    const text = fs.readFileSync('.env.local', 'utf-8');
    const env = {};
    for (const line of text.split('\n')) {
        const idx = line.indexOf('=');
        if (idx === -1) continue;
        const key = line.substring(0, idx).trim();
        let val = line.substring(idx + 1).trim();
        // Strip surrounding quotes
        if (val.startsWith('"')) val = val.slice(1);
        if (val.endsWith('"')) val = val.slice(0, -1);
        if (val.endsWith('\r')) val = val.slice(0, -1);
        // Strip literal \r\n that Vercel CLI embeds
        val = val.replace(/\\r\\n/g, '');
        env[key] = val;
    }
    return env;
}
const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const USER_MAP = {
    'sandeep': '78387321-8aad-4ec4-9eae-0f7e99eda5dc',
    'satender singh': '2970b695-b623-48c1-b036-ba14919cb443',
    'satender': '2970b695-b623-48c1-b036-ba14919cb443',
    'dinesh': 'e2cd37b3-f92b-4378-95d3-8c46d469315b',
    'pradeep kumar': 'c6f5ea1a-110c-4165-9433-ef6b4c8c71fa',
    'pradeep': 'c6f5ea1a-110c-4165-9433-ef6b4c8c71fa',
    'preeti r': '1c5b8a5c-2af5-4c96-801b-b5fc562d3ac2',
    'preeti': '1c5b8a5c-2af5-4c96-801b-b5fc562d3ac2',
    'shikha sharma': 'c5c41c1e-c16d-4936-b51b-41ef9f6c9679',
    'shikha': 'c5c41c1e-c16d-4936-b51b-41ef9f6c9679',
    'ts bhandari': '872fca38-39e1-468e-9901-daa0823cd36a',
    'bhandari': '872fca38-39e1-468e-9901-daa0823cd36a',
    'isha': '480090cb-3fad-45ce-beae-b89576f4c722',
    'isha mahajan': '480090cb-3fad-45ce-beae-b89576f4c722',
};

const DEFAULT_ASSIGNER = '84ac5185-e461-4e77-8ea1-a1573bd2b394'; // Chaitanya
const MANAN_ID = '08f0a4c7-2dda-4236-a657-383e6a785573';

function parseCSV(text) {
    const lines = text.split('\n');
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const fields = [];
        let current = '', inQ = false;
        for (let j = 0; j < line.length; j++) {
            const ch = line[j];
            if (ch === '"') { inQ = !inQ; continue; }
            if (ch === ',' && !inQ) { fields.push(current.trim()); current = ''; continue; }
            current += ch;
        }
        fields.push(current.trim());
        const [, title, description, assignedTo, assignedBy] = fields;
        if (!description && !title) continue;
        rows.push({
            task: description || title,
            assignedTo: (assignedTo || '').trim(),
            assignedBy: (assignedBy || '').trim(),
        });
    }
    return rows;
}

async function main() {
    const csvPath = 'C:\\Users\\user\\Downloads\\BENZ Task Management - Master - MASTER TASKS.csv';
    const csv = fs.readFileSync(csvPath, 'utf-8');
    const rows = parseCSV(csv);
    console.log(`📄 Parsed ${rows.length} rows\n`);

    // Delete all existing tasks first (clean slate)
    console.log('🗑  Clearing existing tasks...');
    const { error: delError } = await sb.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delError) console.log('  Delete error:', delError.message);
    else console.log('  ✅ Cleared\n');

    let imported = 0, skipped = 0;

    for (const row of rows) {
        let assignedTo = USER_MAP[row.assignedTo.toLowerCase()];

        // Check if description mentions ISHA for unassigned tasks
        if (!assignedTo && row.task.toUpperCase().includes('- ISHA')) {
            assignedTo = USER_MAP['isha'];
        }

        if (!assignedTo) { skipped++; continue; }

        // Resolve assigner
        let assignedBy = DEFAULT_ASSIGNER;
        if (row.assignedBy.toLowerCase().includes('manan')) assignedBy = MANAN_ID;
        if (row.assignedBy.toLowerCase().includes('prashansa')) assignedBy = 'cbba91c1-7bd3-43d3-855c-cd350944608c';

        // Do NOT set created_at — let DB handle it with now()
        const { data, error } = await sb.from('tasks').insert({
            title: row.task,
            assigned_to: assignedTo,
            assigned_by: assignedBy,
            priority: 'Normal',
            status: 'New',
        }).select('id').single();

        if (error) {
            console.log(`❌ FAILED: "${row.task.substring(0, 40)}..." → ${error.message}`);
            // Stop on first error to debug
            console.log('   Full error:', JSON.stringify(error));
            break;
        } else {
            imported++;
        }
    }

    console.log(`\n✅ Imported: ${imported}`);
    console.log(`⏭  Skipped (no assignee in 8): ${skipped}`);
}

main().catch(console.error);
