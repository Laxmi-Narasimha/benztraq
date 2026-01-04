import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        // 1. List all users
        const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

        if (usersError) throw usersError;

        const targets = [];
        const years = [2024, 2025, 2026];
        const amounts = { 2024: 5000000, 2025: 6000000, 2026: 7500000 };

        for (const user of users) {
            for (const year of years) {
                targets.push({
                    salesperson_user_id: user.id,
                    year: year,
                    annual_target: amounts[year],
                    created_by: user.id // Self-referenced for simplicity or admin ID
                });
            }
        }

        // 2. Upsert targets
        const { error: upsertError } = await supabaseAdmin
            .from('annual_targets')
            .upsert(targets, { onConflict: 'salesperson_user_id, year' });

        if (upsertError) {
            // If table doesn't exist, we might fail here. 
            return NextResponse.json({ error: upsertError.message }, { status: 500 });
        }

        return NextResponse.json({ message: `Seeded ${targets.length} targets for ${users.length} users.` });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
