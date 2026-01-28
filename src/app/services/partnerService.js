import { createClient } from '@supabase/supabase-js';

// Regex constants from Odoo l10n_in module
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

/**
 * Validates Indian GSTIN format
 * @param {string} gstin 
 * @returns {boolean}
 */
export function validateGSTIN(gstin) {
    if (!gstin) return true; // Optional field
    return GSTIN_REGEX.test(gstin);
}

/**
 * Validates Indian PAN format
 * @param {string} pan 
 * @returns {boolean}
 */
export function validatePAN(pan) {
    if (!pan) return true; // Optional field
    return PAN_REGEX.test(pan);
}

/**
 * Service to handle Partner (Customer) logic
 */
export class PartnerService {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
    }

    /**
     * Create a new partner (Individual or Company)
     * @param {Object} data 
     */
    async createPartner(data) {
        // 1. Validation
        if (data.l10n_in_gst_treatment !== 'consumer' && data.l10n_in_gst_treatment !== 'unregistered' && data.l10n_in_gst_treatment !== 'overseas') {
            // If registered, valid GSTIN is usually expected, but Odoo serves warnings essentially.
            // We enforce format if provided.
            if (data.vat && !validateGSTIN(data.vat)) {
                throw new Error('Invalid GSTIN format. Format: 22AAAAA0000A1Z5');
            }
        }

        if (data.l10n_in_pan && !validatePAN(data.l10n_in_pan)) {
            throw new Error('Invalid PAN format. Format: AAAAA0000A');
        }

        // 2. Logic for Company Type
        const partnerData = {
            ...data,
            // Ensure correct company_type / is_company mapping if not provided
            company_type: data.company_type || (data.is_company ? 'company' : 'person'),
            display_name: data.company_type === 'person' && data.parent_id ? `${data.name}` : data.name, // Simplified Logic
        };

        // 3. Insert into DB
        const { data: newPartner, error } = await this.supabase
            .from('customers')
            .insert(partnerData)
            .select()
            .single();

        if (error) throw error;
        return newPartner;
    }

    /**
     * Create a child contact (Invoice/Delivery address)
     * @param {string} parentId 
     * @param {string} type 
     * @param {Object} contactData 
     */
    async createChildContact(parentId, type, contactData) {
        const payload = {
            ...contactData,
            parent_id: parentId,
            type: type, // 'invoice', 'delivery', etc.
            is_company: false,
            company_type: 'person',
        };

        return this.createPartner(payload);
    }
}
