/**
 * Quote Templates API - Pre-defined quotation templates
 * SECURITY: Uses custom JWT auth via getCurrentUser()
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/utils/session';

export const dynamic = 'force-dynamic';

// Roles that can manage templates
const MANAGER_ROLES = ['developer', 'director', 'vp', 'head_of_sales', 'manager'];

/**
 * GET /api/quote-templates - List all templates
 */
export async function GET(request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createAdminClient();

        const { data: templates, error } = await supabase
            .from('quote_templates')
            .select(`
                *,
                lines:quote_template_lines(
                    id,
                    sequence,
                    product_id,
                    name,
                    quantity,
                    display_type,
                    product:products(id, name, selling_price, hsn_code)
                )
            `)
            .eq('active', true)
            .order('name', { ascending: true });

        if (error) throw error;

        // Sort lines by sequence
        const templatesWithSortedLines = templates.map(t => ({
            ...t,
            lines: (t.lines || []).sort((a, b) => a.sequence - b.sequence)
        }));

        return NextResponse.json({ success: true, data: templatesWithSortedLines });

    } catch (error) {
        console.error('GET /api/quote-templates error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/quote-templates - Create template
 */
export async function POST(request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!MANAGER_ROLES.includes(currentUser.role)) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const supabase = createAdminClient();
        const body = await request.json();

        // Create template
        const { data: template, error: templateError } = await supabase
            .from('quote_templates')
            .insert({
                name: body.name,
                note: body.note,
                number_of_days: body.number_of_days || 30,
                require_signature: body.require_signature || false,
                require_payment: body.require_payment || false,
                prepayment_percent: body.prepayment_percent || 0,
                company_id: body.company_id
            })
            .select()
            .single();

        if (templateError) throw templateError;

        // Create lines if provided
        if (body.lines && body.lines.length > 0) {
            const lines = body.lines.map((line, idx) => ({
                template_id: template.id,
                sequence: line.sequence || (idx + 1) * 10,
                product_id: line.product_id,
                name: line.name,
                quantity: line.quantity || 1,
                display_type: line.display_type
            }));

            const { error: linesError } = await supabase
                .from('quote_template_lines')
                .insert(lines);

            if (linesError) throw linesError;
        }

        // Fetch template with lines
        const { data: fullTemplate } = await supabase
            .from('quote_templates')
            .select(`
                *,
                lines:quote_template_lines(*)
            `)
            .eq('id', template.id)
            .single();

        return NextResponse.json({ success: true, data: fullTemplate }, { status: 201 });

    } catch (error) {
        console.error('POST /api/quote-templates error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
