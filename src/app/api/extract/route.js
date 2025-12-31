/**
 * OpenAI Extraction API Route
 * 
 * Extracts structured data from PDFs using OpenAI API.
 * Uses Responses API with Structured Outputs for consistent parsing.
 * 
 * @module app/api/extract/route
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Creates OpenAI client (lazy initialization).
 * @returns {import('openai').default}
 */
function getOpenAIClient() {
    const OpenAI = require('openai').default;
    return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
}

/**
 * JSON Schema for structured extraction output.
 * Matches the extractedDocumentSchema from lib/schemas.
 */
const extractionJsonSchema = {
    name: 'extracted_document',
    strict: true,
    schema: {
        type: 'object',
        properties: {
            detected_doc_type: {
                type: 'string',
                enum: ['quotation', 'sales_order', 'invoice'],
                description: 'The detected type of document',
            },
            doc_number: {
                type: ['string', 'null'],
                description: 'Document number if visible',
            },
            doc_date: {
                type: ['string', 'null'],
                description: 'Document date in YYYY-MM-DD format',
            },
            customer_name: {
                type: ['string', 'null'],
                description: 'Customer/company name',
            },
            line_items: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        product_name: { type: 'string' },
                        description: { type: ['string', 'null'] },
                        qty: { type: 'number' },
                        uom: { type: 'string' },
                        unit_price: { type: 'number' },
                        base_unit_price: { type: ['number', 'null'] },
                        discount_amount: { type: ['number', 'null'] },
                        tax_amount: { type: ['number', 'null'] },
                        freight_packing_amount: { type: ['number', 'null'] },
                        line_total: { type: ['number', 'null'] },
                    },
                    required: ['product_name', 'qty', 'uom', 'unit_price'],
                    additionalProperties: false,
                },
            },
            subtotal: { type: ['number', 'null'] },
            discount_total: { type: ['number', 'null'] },
            tax_total: { type: ['number', 'null'] },
            freight_packing_total: { type: ['number', 'null'] },
            grand_total: { type: ['number', 'null'] },
            extraction_confidence: {
                type: 'number',
                description: 'Confidence score from 0 to 1',
            },
            field_confidence: {
                type: 'object',
                description: 'Confidence scores for key fields',
                additionalProperties: { type: 'number' },
            },
        },
        required: ['detected_doc_type', 'line_items', 'extraction_confidence'],
        additionalProperties: false,
    },
};

/**
 * POST /api/extract
 * Extract data from uploaded PDF.
 */
export async function POST(request) {
    try {
        // Validate OpenAI API key
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'OpenAI API key not configured' },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { fileUrl, intendedDocType, documentFileId } = body;

        if (!fileUrl) {
            return NextResponse.json(
                { error: 'File URL is required' },
                { status: 400 }
            );
        }

        // Update document file status to processing
        if (documentFileId) {
            const supabase = createAdminClient();
            await supabase
                .from('document_files')
                .update({ extraction_status: 'processing' })
                .eq('id', documentFileId);
        }

        // Build the extraction prompt
        const systemPrompt = `You are a document extraction specialist for a manufacturing company dealing with wood, PVC, and packaging products.

Your task is to extract structured data from business documents (quotations, sales orders, invoices).

Rules:
1. Extract all line items with product names, quantities, units of measurement, and prices
2. Detect the document type from the content
3. Extract totals if visible; otherwise compute from line items
4. Use INR (₹) as the currency
5. Convert dates to YYYY-MM-DD format
6. Provide confidence scores (0-1) for your extraction
7. If a field is unclear or missing, set it to null

Common UOMs: pcs, kgs, nos, litres, sets, meters, sq.ft, sq.m
Common products: PVC films, wooden pallets, packaging boxes, industrial crates, stretch wrap, export boxes`;

        const userPrompt = intendedDocType
            ? `The user expects this to be a ${intendedDocType}. Please extract all data and also verify if the document type matches.`
            : 'Please extract all structured data from this document.';

        // Call OpenAI with the PDF
        const openai = getOpenAIClient();
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: userPrompt },
                        {
                            type: 'image_url',
                            image_url: { url: fileUrl },
                        },
                    ],
                },
            ],
            response_format: {
                type: 'json_schema',
                json_schema: extractionJsonSchema,
            },
            max_tokens: 4096,
        });

        const extractedData = JSON.parse(response.choices[0].message.content);

        // Check for document type mismatch
        let warning = null;
        if (intendedDocType && extractedData.detected_doc_type !== intendedDocType) {
            warning = `Document appears to be a ${extractedData.detected_doc_type}, but you selected ${intendedDocType}. Please verify.`;
        }

        // Calculate line totals if missing
        extractedData.line_items = extractedData.line_items.map((item) => ({
            ...item,
            line_total: item.line_total || (item.qty * item.unit_price),
            uom: item.uom || 'pcs',
        }));

        // Calculate grand total if missing
        if (!extractedData.grand_total && extractedData.line_items.length > 0) {
            extractedData.subtotal = extractedData.line_items.reduce(
                (sum, item) => sum + (item.line_total || 0),
                0
            );
            extractedData.grand_total =
                (extractedData.subtotal || 0) -
                (extractedData.discount_total || 0) +
                (extractedData.tax_total || 0) +
                (extractedData.freight_packing_total || 0);
        }

        // Save extraction run if documentFileId provided
        if (documentFileId) {
            const supabase = createAdminClient();

            await supabase.from('extraction_runs').insert({
                document_file_id: documentFileId,
                model: 'gpt-4o',
                raw_response_json: response,
                extracted_json: extractedData,
                extraction_confidence: extractedData.extraction_confidence,
            });

            await supabase
                .from('document_files')
                .update({ extraction_status: 'needs_review' })
                .eq('id', documentFileId);
        }

        return NextResponse.json({
            success: true,
            data: extractedData,
            warning,
            model: 'gpt-4o',
            usage: response.usage,
        });
    } catch (error) {
        console.error('Extraction error:', error);

        // Update document file status to failed
        const body = await request.json().catch(() => ({}));
        if (body.documentFileId) {
            const supabase = createAdminClient();
            await supabase
                .from('document_files')
                .update({
                    extraction_status: 'failed',
                    extraction_error: error.message,
                })
                .eq('id', body.documentFileId);
        }

        return NextResponse.json(
            { error: 'Extraction failed', details: error.message },
            { status: 500 }
        );
    }
}
