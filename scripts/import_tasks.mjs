/**
 * Import ALL tasks from CSV
 * Maps every task to the correct person:
 *   - Named assignees → direct map
 *   - Paul tasks → Jayshree (chennai@benz-packaging.com)
 *   - Tasks with name after hyphen in description → match to person
 *   - Unknown names → assign to a placeholder "other" user
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
        if (val.startsWith('"')) val = val.slice(1);
        if (val.endsWith('"')) val = val.slice(0, -1);
        if (val.endsWith('\r')) val = val.slice(0, -1);
        val = val.replace(/\\r\\n/g, '');
        env[key] = val;
    }
    return env;
}
const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// ─── User ID map ───────────────────────────────────────────────
const IDS = {
    dinesh: 'e2cd37b3-f92b-4378-95d3-8c46d469315b',
    pradeep: 'c6f5ea1a-110c-4165-9433-ef6b4c8c71fa',
    shikha: 'c5c41c1e-c16d-4936-b51b-41ef9f6c9679',
    preeti: '1c5b8a5c-2af5-4c96-801b-b5fc562d3ac2',
    isha: '480090cb-3fad-45ce-beae-b89576f4c722',
    sandeep: '78387321-8aad-4ec4-9eae-0f7e99eda5dc',
    satender: '2970b695-b623-48c1-b036-ba14919cb443',
    bhandari: '872fca38-39e1-468e-9901-daa0823cd36a',
    tarun: '2ee61597-d5e1-4d1e-aad8-2b157adb599c',
    jayshree: '51deaf59-c580-418d-a78c-7acfa973a53d', // Paul's CRM
    udit: '0edd417c-95f9-4ffa-b76f-4a51673015f0',
    pulak: '8253c1fb-c8f0-4a1a-83e0-5d7be4ebcb19',
    manan: '08f0a4c7-2dda-4236-a657-383e6a785573',
    chaitanya: '84ac5185-e461-4e77-8ea1-a1573bd2b394',
    prashansa: 'cbba91c1-7bd3-43d3-855c-cd350944608c',
    laxmi: '092d9927-e3ed-4a69-9b23-a521d9a80af9',
    // "Other" people — map to existing profiles
    neeraj: 'd9bdd514-5c09-47b1-b976-db5947e790de',
    aman: 'f03f3add-424a-4e5b-8439-0807eca5bd93',
    mahesh: 'c18850ba-917d-4e9e-964d-50b28deff6c9',
    vivek: null, // will create or skip
    anshul: null,
    rohit: null,
    shyam: null,
    sateesh: null,
    vikas: null,
};

// Map CSV "Assigned To" field to user_id
const ASSIGNEE_MAP = {
    'sandeep': IDS.sandeep,
    'satender singh': IDS.satender,
    'dinesh': IDS.dinesh,
    'pradeep kumar': IDS.pradeep,
    'preeti r': IDS.preeti,
    'shikha sharma': IDS.shikha,
    'ts bhandari': IDS.bhandari,
};

// Match name after hyphen in description to user_id
// "PAUL SIR" → Jayshree, "TARUN" → Tarun, etc.
function resolveFromDescription(desc) {
    if (!desc) return null;
    const upper = desc.toUpperCase();

    // Paul → Jayshree
    if (upper.includes('PAUL SIR') || upper.includes('PAUL &') || upper.includes('& PAUL')) return IDS.jayshree;
    if (upper.includes('- PAUL')) return IDS.jayshree;

    // Tarun
    if (upper.includes('TARUN SIR') || upper.includes('- TARUN')) return IDS.tarun;

    // Isha
    if (upper.includes('- ISHA') || upper.includes('ISHA')) return IDS.isha;

    // Udit
    if (upper.includes('- UDIT') || upper.includes('UDIT')) return IDS.udit;

    // Laxmi
    if (upper.includes('- LAXMI') || upper.includes('LAXMI')) return IDS.laxmi;

    // Manan
    if (upper.includes('MANAN SIR') || upper.includes('- MANAN')) return IDS.manan;

    // Chaitanya
    if (upper.includes('CHAITANYA SIR') || upper.includes('- CHAITANYA')) return IDS.chaitanya;

    // Prashansa
    if (upper.includes('PRASHANSA MAM') || upper.includes('- PRASHANSA')) return IDS.prashansa;

    // Pulak
    if (upper.includes('PULAK SIR') || upper.includes('- PULAK')) return IDS.pulak;

    // Vivek
    if (upper.includes('VIVEK SIR') || upper.includes('- VIVEK')) return IDS.chaitanya; // assign to Chaitanya for now

    // "Other" people
    if (upper.includes('- NEERAJ')) return IDS.neeraj;
    if (upper.includes('- AMAN')) return IDS.aman;
    if (upper.includes('- MAHESH')) return IDS.mahesh;
    if (upper.includes('- ANSHUL')) return IDS.chaitanya; // no profile, assign to director
    if (upper.includes('- ROHIT')) return IDS.chaitanya;
    if (upper.includes('- SHYAM')) return IDS.chaitanya;
    if (upper.includes('- SATEESH')) return IDS.chaitanya;
    if (upper.includes('- VIKAS')) return IDS.chaitanya;
    if (upper.includes('JUGINDER')) return IDS.manan;

    return null;
}

const DEFAULT_ASSIGNER = IDS.chaitanya;

// ─── Parse CSV ─────────────────────────────────────────────────
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
            title: title || '',
            assignedTo: (assignedTo || '').trim(),
            assignedBy: (assignedBy || '').trim(),
        });
    }
    return rows;
}

// ─── Main ──────────────────────────────────────────────────────
async function main() {
    const csvPath = 'C:\\Users\\user\\Downloads\\BENZ Task Management - Master - MASTER TASKS.csv';
    const csv = fs.readFileSync(csvPath, 'utf-8');
    const rows = parseCSV(csv);
    console.log(`📄 Parsed ${rows.length} rows from CSV\n`);

    // Clear all existing tasks
    console.log('🗑  Clearing existing tasks...');
    const { error: delError } = await sb.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delError) { console.log('  Delete error:', delError.message); return; }
    console.log('  ✅ Cleared\n');

    let imported = 0, failed = 0;

    for (const row of rows) {
        // 1. Try direct assignee map
        let assignedTo = ASSIGNEE_MAP[row.assignedTo.toLowerCase()];

        // 2. If no direct assignee, parse from description
        if (!assignedTo) {
            assignedTo = resolveFromDescription(row.task);
        }

        // 3. If still no match, assign to Chaitanya (director) — these go to "Other" tab
        if (!assignedTo) {
            console.log(`  ⚠ Unresolved, assigning to Chaitanya: "${row.task.substring(0, 50)}"`);
            assignedTo = DEFAULT_ASSIGNER;
        }

        // Resolve assigner
        let assignedBy = DEFAULT_ASSIGNER;
        if (row.assignedBy.toLowerCase().includes('manan')) assignedBy = IDS.manan;
        if (row.assignedBy.toLowerCase().includes('prashansa')) assignedBy = IDS.prashansa;

        const { error } = await sb.from('tasks').insert({
            title: row.task,
            assigned_to: assignedTo,
            assigned_by: assignedBy,
            priority: 'Normal',
            status: 'New',
        });

        if (error) {
            console.log(`  ❌ "${row.task.substring(0, 40)}" → ${error.message}`);
            failed++;
        } else {
            imported++;
        }
    }

    console.log(`\n${'═'.repeat(50)}`);
    console.log(`✅ Imported: ${imported}`);
    if (failed) console.log(`❌ Failed: ${failed}`);
    console.log(`${'═'.repeat(50)}`);
}

main().catch(console.error);
