/**
 * Document Lines API
 * 
 * Fetch line items for a specific document.
 * 
 * @module app/api/documents/lines/route
 */

import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/utils/session';

export async function GET(request) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const supabase = createAdminClient();
        const { searchParams } = new URL(request.url);
        const documentId = searchParams.get('document_id');

        if (!documentId) {
            return NextResponse.json(
                { error: 'document_id is required' },
                { status: 400 }
            );
        }

        // Fetch line items
        const { data: lines, error } = await supabase
            .from('document_lines')
            .select('*')
            .eq('document_id', documentId)
            .order('line_number', { ascending: true });

        if (error) {
            console.error('Error fetching document lines:', error);
            return NextResponse.json(
                { error: 'Failed to fetch line items', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            lines: lines || [],
            count: lines?.length || 0,
        });
    } catch (error) {
        console.error('Document lines API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
