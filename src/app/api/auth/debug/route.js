import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// WARNING: This route is for debugging only. Remove in production.
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const key = searchParams.get('key');

    // Simple protection
    if (key !== 'debug_secret') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!email) {
        return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    try {
        const supabase = createAdminClient();

        // 1. Check exact match
        const { data: exact, error: exactError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', email)
            .single();

        // 2. Check case-insensitive match
        const { data: insensitive, error: insensitiveError } = await supabase
            .from('profiles')
            .select('*')
            .ilike('email', email)
            .single();

        return NextResponse.json({
            debugInfo: {
                input: email,
                normalizedInput: email.toLowerCase().trim(),
            },
            results: {
                exactMatch: {
                    found: !!exact,
                    email: exact?.email,
                    error: exactError?.message
                },
                insensitiveMatch: {
                    found: !!insensitive,
                    email: insensitive?.email,
                    passwordHashLength: insensitive?.password_hash?.length,
                    isActive: insensitive?.is_active,
                    error: insensitiveError?.message
                }
            }
        });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
