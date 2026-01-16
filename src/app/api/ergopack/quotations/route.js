/**
 * Ergopack Quotations Storage API
 * Handles saving and retrieving quotation PDFs for contacts
 * 
 * POST /api/ergopack/quotations - Save quotation PDF
 * GET /api/ergopack/quotations - Get quotation download URL
 * DELETE /api/ergopack/quotations - Delete quotation
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/utils/session';

// Increase body size limit for large PDF uploads (default is 4.5MB on Vercel)
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '15mb',
        },
    },
};

// Route segment config for App Router
export const maxDuration = 60; // Allow up to 60 seconds for upload

const BUCKET_NAME = 'ergopack-quotations';

/**
 * POST - Save a quotation PDF
 */
export async function POST(request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Parse the multipart form data
        const formData = await request.formData();
        const file = formData.get('file');
        const contactId = formData.get('contactId');
        const quotationNumber = formData.get('quotationNumber') || 'Quotation';

        if (!file || !contactId) {
            return NextResponse.json({ error: 'File and contactId are required' }, { status: 400 });
        }

        // Validate file type
        if (file.type !== 'application/pdf') {
            return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Verify contact exists
        const { data: contact, error: contactError } = await supabase
            .from('ergopack_contacts')
            .select('id, company_name, quotation_file_path')
            .eq('id', contactId)
            .single();

        if (contactError || !contact) {
            return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
        }

        // Delete old file if exists
        if (contact.quotation_file_path) {
            await supabase.storage
                .from(BUCKET_NAME)
                .remove([contact.quotation_file_path]);
        }

        // Create unique file path
        const timestamp = new Date().toISOString().split('T')[0];
        const fileName = `${contactId}/${timestamp}_${quotationNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, buffer, {
                contentType: 'application/pdf',
                upsert: true
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return NextResponse.json({
                error: 'Failed to upload quotation',
                details: uploadError.message
            }, { status: 500 });
        }

        // Update contact with file info
        const originalFileName = `${quotationNumber}_${contact.company_name}.pdf`;
        const { error: updateError } = await supabase
            .from('ergopack_contacts')
            .update({
                quotation_file_path: fileName,
                quotation_file_name: originalFileName,
                quotation_uploaded_at: new Date().toISOString(),
                quotation_uploaded_by: user.id,
                updated_by: user.id
            })
            .eq('id', contactId);

        if (updateError) {
            console.error('Update error:', updateError);
            return NextResponse.json({
                error: 'Failed to update contact record',
                details: updateError.message
            }, { status: 500 });
        }

        // Log activity
        await supabase.from('ergopack_activities').insert({
            contact_id: contactId,
            activity_type: 'note',
            title: 'Quotation saved',
            description: `Saved quotation: ${originalFileName}`,
            created_by: user.id,
        });

        return NextResponse.json({
            success: true,
            message: 'Quotation saved successfully',
            filePath: fileName,
            fileName: originalFileName
        });

    } catch (error) {
        console.error('Quotation save error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * GET - Get signed URL for downloading quotation
 */
export async function GET(request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const contactId = searchParams.get('contactId');

        if (!contactId) {
            return NextResponse.json({ error: 'contactId is required' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Get contact with quotation info
        const { data: contact, error: contactError } = await supabase
            .from('ergopack_contacts')
            .select('id, quotation_file_path, quotation_file_name, quotation_uploaded_at, quotation_uploaded_by')
            .eq('id', contactId)
            .single();

        if (contactError || !contact) {
            return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
        }

        if (!contact.quotation_file_path) {
            return NextResponse.json({
                success: true,
                hasQuotation: false,
                message: 'No quotation saved'
            });
        }

        // Create signed URL valid for 1 hour
        const { data: urlData, error: urlError } = await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrl(contact.quotation_file_path, 3600);

        if (urlError) {
            console.error('Signed URL error:', urlError);
            return NextResponse.json({
                error: 'Failed to generate access URL',
                details: urlError.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            hasQuotation: true,
            url: urlData.signedUrl,
            fileName: contact.quotation_file_name,
            uploadedAt: contact.quotation_uploaded_at
        });

    } catch (error) {
        console.error('Get quotation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE - Remove a quotation file
 */
export async function DELETE(request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const contactId = searchParams.get('contactId');

        if (!contactId) {
            return NextResponse.json({ error: 'contactId is required' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Get contact with quotation info
        const { data: contact, error: contactError } = await supabase
            .from('ergopack_contacts')
            .select('id, quotation_file_path, quotation_file_name')
            .eq('id', contactId)
            .single();

        if (contactError || !contact) {
            return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
        }

        if (!contact.quotation_file_path) {
            return NextResponse.json({ error: 'No quotation to delete' }, { status: 400 });
        }

        // Delete file from storage
        const { error: deleteError } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([contact.quotation_file_path]);

        if (deleteError) {
            console.error('Delete file error:', deleteError);
            // Continue anyway to clear the database reference
        }

        // Clear file info from contact
        const { error: updateError } = await supabase
            .from('ergopack_contacts')
            .update({
                quotation_file_path: null,
                quotation_file_name: null,
                quotation_uploaded_at: null,
                quotation_uploaded_by: null,
                updated_by: user.id
            })
            .eq('id', contactId);

        if (updateError) {
            console.error('Update error:', updateError);
            return NextResponse.json({
                error: 'Failed to update contact record',
                details: updateError.message
            }, { status: 500 });
        }

        // Log activity
        await supabase.from('ergopack_activities').insert({
            contact_id: contactId,
            activity_type: 'note',
            title: 'Quotation removed',
            description: `Removed quotation: ${contact.quotation_file_name}`,
            created_by: user.id,
        });

        return NextResponse.json({
            success: true,
            message: 'Quotation deleted successfully'
        });

    } catch (error) {
        console.error('Delete quotation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
