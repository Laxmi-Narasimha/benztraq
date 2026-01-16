/**
 * Ergopack Presentations API
 * Handles PDF file upload, view, and delete for company presentations
 * 
 * POST /api/ergopack/presentations - Upload presentation
 * DELETE /api/ergopack/presentations?contactId=xxx - Delete presentation
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/utils/session';

const BUCKET_NAME = 'ergopack-presentations';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * POST - Upload a presentation PDF
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

        if (!file || !contactId) {
            return NextResponse.json({ error: 'File and contactId are required' }, { status: 400 });
        }

        // Validate file type
        if (file.type !== 'application/pdf') {
            return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Verify contact exists
        const { data: contact, error: contactError } = await supabase
            .from('ergopack_contacts')
            .select('id, company_name, presentation_file_path')
            .eq('id', contactId)
            .single();

        if (contactError || !contact) {
            return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
        }

        // Delete old file if exists
        if (contact.presentation_file_path) {
            await supabase.storage
                .from(BUCKET_NAME)
                .remove([contact.presentation_file_path]);
        }

        // Create unique file path
        const fileExtension = file.name.split('.').pop() || 'pdf';
        const fileName = `${contactId}/${Date.now()}_presentation.${fileExtension}`;

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
                error: 'Failed to upload file',
                details: uploadError.message
            }, { status: 500 });
        }

        // Update contact with file info
        const { error: updateError } = await supabase
            .from('ergopack_contacts')
            .update({
                presentation_file_path: fileName,
                presentation_file_name: file.name,
                presentation_uploaded_at: new Date().toISOString(),
                presentation_uploaded_by: user.id,
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
            title: 'Presentation uploaded',
            description: `Uploaded company presentation: ${file.name}`,
            created_by: user.id,
        });

        // Get public URL for the file
        const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(fileName);

        return NextResponse.json({
            success: true,
            message: 'Presentation uploaded successfully',
            filePath: fileName,
            fileName: file.name
        });

    } catch (error) {
        console.error('Presentation upload error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * GET - Get signed URL for viewing/downloading presentation
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

        // Get contact with presentation info
        const { data: contact, error: contactError } = await supabase
            .from('ergopack_contacts')
            .select('id, presentation_file_path, presentation_file_name, presentation_uploaded_at, presentation_uploaded_by')
            .eq('id', contactId)
            .single();

        if (contactError || !contact) {
            return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
        }

        if (!contact.presentation_file_path) {
            return NextResponse.json({
                success: true,
                hasPresentation: false,
                message: 'No presentation uploaded'
            });
        }

        // Create signed URL valid for 1 hour
        const { data: urlData, error: urlError } = await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrl(contact.presentation_file_path, 3600);

        if (urlError) {
            console.error('Signed URL error:', urlError);
            return NextResponse.json({
                error: 'Failed to generate access URL',
                details: urlError.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            hasPresentation: true,
            url: urlData.signedUrl,
            fileName: contact.presentation_file_name,
            uploadedAt: contact.presentation_uploaded_at
        });

    } catch (error) {
        console.error('Get presentation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE - Remove a presentation file
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

        // Get contact with presentation info
        const { data: contact, error: contactError } = await supabase
            .from('ergopack_contacts')
            .select('id, presentation_file_path, presentation_file_name')
            .eq('id', contactId)
            .single();

        if (contactError || !contact) {
            return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
        }

        if (!contact.presentation_file_path) {
            return NextResponse.json({ error: 'No presentation to delete' }, { status: 400 });
        }

        // Delete file from storage
        const { error: deleteError } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([contact.presentation_file_path]);

        if (deleteError) {
            console.error('Delete file error:', deleteError);
            // Continue anyway to clear the database reference
        }

        // Clear file info from contact
        const { error: updateError } = await supabase
            .from('ergopack_contacts')
            .update({
                presentation_file_path: null,
                presentation_file_name: null,
                presentation_uploaded_at: null,
                presentation_uploaded_by: null,
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
            title: 'Presentation removed',
            description: `Removed company presentation: ${contact.presentation_file_name}`,
            created_by: user.id,
        });

        return NextResponse.json({
            success: true,
            message: 'Presentation deleted successfully'
        });

    } catch (error) {
        console.error('Delete presentation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
