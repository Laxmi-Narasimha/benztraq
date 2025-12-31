/**
 * Zod Validation Schemas
 * 
 * Runtime validation schemas for all data structures in the application.
 * Following the principle of validating at boundaries (API, forms, external data).
 * 
 * @module lib/schemas
 */

import { z } from 'zod';
import {
    DOC_TYPES,
    QUOTATION_STATUS,
    SALES_ORDER_STATUS,
    INVOICE_STATUS,
    USER_ROLES,
    EXTRACTION_STATUS,
    LINK_METHOD,
    PRODUCT_CATEGORIES,
} from './constants';

// ============================================================================
// Base Schemas
// ============================================================================

/**
 * UUID validation schema.
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Non-empty string schema.
 */
export const nonEmptyString = z.string().min(1, 'This field is required');

/**
 * Positive number schema.
 */
export const positiveNumber = z.number().min(0, 'Must be a positive number');

/**
 * Date string schema (ISO format).
 */
export const dateString = z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'Invalid date format' }
);

// ============================================================================
// User & Profile Schemas
// ============================================================================

/**
 * User role schema.
 */
export const userRoleSchema = z.enum([USER_ROLES.VP, USER_ROLES.DIRECTOR, USER_ROLES.ASM]);

/**
 * Profile schema for user data.
 */
export const profileSchema = z.object({
    user_id: uuidSchema,
    full_name: nonEmptyString,
    role: userRoleSchema,
    region_id: uuidSchema.nullable().optional(),
    is_active: z.boolean().default(true),
});

// ============================================================================
// Master Data Schemas
// ============================================================================

/**
 * Region schema.
 */
export const regionSchema = z.object({
    id: uuidSchema,
    name: nonEmptyString,
});

/**
 * Customer creation schema.
 */
export const customerCreateSchema = z.object({
    name: nonEmptyString,
    region_id: uuidSchema.nullable().optional(),
    email: z.string().email().nullable().optional(),
    address: z.string().nullable().optional(),
});

/**
 * Customer schema with ID.
 */
export const customerSchema = customerCreateSchema.extend({
    id: uuidSchema,
});

/**
 * Product creation schema.
 */
export const productCreateSchema = z.object({
    name: nonEmptyString,
    default_uom: z.string().nullable().optional(),
    category: z.enum([
        PRODUCT_CATEGORIES.PVC,
        PRODUCT_CATEGORIES.WOODEN,
        PRODUCT_CATEGORIES.HARDWARE,
        PRODUCT_CATEGORIES.OTHER,
    ]).nullable().optional(),
});

/**
 * Product schema with ID.
 */
export const productSchema = productCreateSchema.extend({
    id: uuidSchema,
});

// ============================================================================
// Document Schemas
// ============================================================================

/**
 * Document type enum schema.
 */
export const docTypeSchema = z.enum([
    DOC_TYPES.QUOTATION,
    DOC_TYPES.SALES_ORDER,
    DOC_TYPES.INVOICE,
]);

/**
 * Document status schema - varies by document type.
 */
export const quotationStatusSchema = z.enum([
    QUOTATION_STATUS.DRAFT,
    QUOTATION_STATUS.SENT,
    QUOTATION_STATUS.WON,
    QUOTATION_STATUS.LOST,
]);

export const salesOrderStatusSchema = z.enum([
    SALES_ORDER_STATUS.OPEN,
    SALES_ORDER_STATUS.CONFIRMED,
    SALES_ORDER_STATUS.CANCELLED,
]);

export const invoiceStatusSchema = z.enum([INVOICE_STATUS.RECORDED]);

/**
 * Document line item schema.
 */
export const documentLineSchema = z.object({
    product_id: uuidSchema.nullable().optional(),
    product_name_raw: nonEmptyString,
    description: z.string().nullable().optional(),
    qty: positiveNumber,
    uom: nonEmptyString,
    base_unit_price: positiveNumber.nullable().optional(),
    unit_price: positiveNumber,
    discount_amount: positiveNumber.nullable().optional(),
    tax_amount: positiveNumber.nullable().optional(),
    freight_packing_amount: positiveNumber.nullable().optional(),
    line_total: positiveNumber,
});

/**
 * Document creation schema (manual entry or after AI extraction).
 */
export const documentCreateSchema = z.object({
    doc_type: docTypeSchema,
    doc_number: z.string().nullable().optional(),
    doc_date: dateString,
    customer_id: uuidSchema,
    region_id: uuidSchema,
    salesperson_user_id: uuidSchema,
    status: nonEmptyString,
    is_partial: z.boolean().default(false),
    partial_group_ref: z.string().nullable().optional(),
    remarks: z.string().nullable().optional(),
    subtotal: positiveNumber,
    discount_total: positiveNumber.nullable().optional(),
    tax_total: positiveNumber.nullable().optional(),
    freight_packing_total: positiveNumber.nullable().optional(),
    grand_total: positiveNumber,
    line_items: z.array(documentLineSchema).min(1, 'At least one line item is required'),
});

/**
 * Document schema with ID and metadata.
 */
export const documentSchema = documentCreateSchema.extend({
    id: uuidSchema,
    created_by: uuidSchema,
    created_at: z.string(),
    updated_at: z.string(),
});

// ============================================================================
// AI Extraction Schemas
// ============================================================================

/**
 * Extracted line item from AI.
 */
export const extractedLineItemSchema = z.object({
    product_name: nonEmptyString,
    description: z.string().nullable().optional(),
    qty: positiveNumber,
    uom: nonEmptyString.default('pcs'),
    unit_price: positiveNumber,
    base_unit_price: positiveNumber.nullable().optional(),
    discount_amount: positiveNumber.nullable().optional(),
    tax_amount: positiveNumber.nullable().optional(),
    freight_packing_amount: positiveNumber.nullable().optional(),
    line_total: positiveNumber.nullable().optional(),
});

/**
 * AI extraction response schema (matches OpenAI Structured Output).
 */
export const extractedDocumentSchema = z.object({
    detected_doc_type: docTypeSchema,
    doc_number: z.string().nullable().optional(),
    doc_date: z.string().nullable().optional(),
    customer_name: z.string().nullable().optional(),
    line_items: z.array(extractedLineItemSchema),
    subtotal: positiveNumber.nullable().optional(),
    discount_total: positiveNumber.nullable().optional(),
    tax_total: positiveNumber.nullable().optional(),
    freight_packing_total: positiveNumber.nullable().optional(),
    grand_total: positiveNumber.nullable().optional(),
    extraction_confidence: z.number().min(0).max(1),
    field_confidence: z.record(z.string(), z.number().min(0).max(1)).optional(),
});

/**
 * Extraction status schema.
 */
export const extractionStatusSchema = z.enum([
    EXTRACTION_STATUS.QUEUED,
    EXTRACTION_STATUS.PROCESSING,
    EXTRACTION_STATUS.NEEDS_REVIEW,
    EXTRACTION_STATUS.CONFIRMED,
    EXTRACTION_STATUS.FAILED,
]);

// ============================================================================
// Target Schemas
// ============================================================================

/**
 * Annual target creation schema.
 */
export const annualTargetCreateSchema = z.object({
    salesperson_user_id: uuidSchema,
    year: z.number().int().min(2020).max(2100),
    annual_target: positiveNumber,
});

/**
 * Annual target schema with ID.
 */
export const annualTargetSchema = annualTargetCreateSchema.extend({
    id: uuidSchema,
    created_by: uuidSchema,
    created_at: z.string(),
});

// ============================================================================
// Quote-Sales Link Schemas
// ============================================================================

/**
 * Quote to sales order link schema.
 */
export const quoteSalesLinkSchema = z.object({
    quote_document_id: uuidSchema,
    sales_order_document_id: uuidSchema,
    link_method: z.enum([LINK_METHOD.MANUAL, LINK_METHOD.AUTO]),
});

// ============================================================================
// Filter Schemas
// ============================================================================

/**
 * Dashboard filter schema.
 */
export const filterSchema = z.object({
    dateRange: z.object({
        from: z.string().nullable().optional(),
        to: z.string().nullable().optional(),
    }).optional(),
    salespersonId: uuidSchema.nullable().optional(),
    regionId: uuidSchema.nullable().optional(),
    customerId: uuidSchema.nullable().optional(),
    productId: uuidSchema.nullable().optional(),
});

// ============================================================================
// Form Validation Helpers
// ============================================================================

/**
 * Validates data against a schema and returns formatted errors.
 * 
 * @param {z.ZodSchema} schema - The Zod schema to validate against
 * @param {unknown} data - The data to validate
 * @returns {{success: boolean, data?: unknown, errors?: Object<string, string>}}
 */
export function validateWithSchema(schema, data) {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    const errors = {};
    result.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        errors[path] = issue.message;
    });

    return { success: false, errors };
}
