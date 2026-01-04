import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
                },
            },
        }
    );

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, role')
        .eq('is_active', true)
        .order('full_name');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Transform to standard format { id, name, role }
    const users = profiles.map(p => ({
        id: p.user_id,
        name: p.full_name,
        role: p.role
    }));

    return NextResponse.json({ users });
}
