/**
 * Tax Computation Service - Odoo Style
 * Mimics Odoo's account.tax computation engine for Indian GST
 */

/**
 * Indian GST rates available
 */
export const GST_RATES = [
    { value: 0, label: 'Exempt (0%)' },
    { value: 5, label: 'GST 5%' },
    { value: 12, label: 'GST 12%' },
    { value: 18, label: 'GST 18%' },
    { value: 28, label: 'GST 28%' },
];

/**
 * Fiscal positions for Indian GST
 */
export const FISCAL_POSITIONS = {
    INTRASTATE: 'intrastate',   // Same state: CGST + SGST
    INTERSTATE: 'interstate',   // Different state: IGST
    EXPORT: 'export',           // Export: Zero-rated
    SEZ: 'sez',                 // SEZ: Zero-rated or IGST
};

/**
 * Benz Packaging company state (Haryana)
 */
export const COMPANY_STATE_CODE = 'HR';

/**
 * Determine fiscal position based on company and customer states
 * @param {string} companyStateCode - Company's state code (e.g., 'HR')
 * @param {string} customerStateCode - Customer's state code (e.g., 'MH')
 * @returns {string} - Fiscal position
 */
export function determineFiscalPosition(companyStateCode, customerStateCode) {
    if (!customerStateCode) {
        return FISCAL_POSITIONS.INTRASTATE; // Default to intrastate if unknown
    }

    const normalizedCompany = companyStateCode?.toUpperCase() || COMPANY_STATE_CODE;
    const normalizedCustomer = customerStateCode?.toUpperCase();

    return normalizedCompany === normalizedCustomer
        ? FISCAL_POSITIONS.INTRASTATE
        : FISCAL_POSITIONS.INTERSTATE;
}

/**
 * Compute line amounts (Odoo's _compute_amount equivalent)
 * @param {Object} line - Line item data
 * @param {string} fiscalPosition - Fiscal position (intrastate/interstate)
 * @returns {Object} - Computed amounts
 */
export function computeLineAmounts(line, fiscalPosition = FISCAL_POSITIONS.INTRASTATE) {
    const qty = parseFloat(line.product_uom_qty) || 0;
    const priceUnit = parseFloat(line.price_unit) || 0;
    const discount = parseFloat(line.discount) || 0;
    const gstRate = parseFloat(line.gst_rate) || 18;

    // Base amount after discount (Odoo: price_subtotal before tax)
    const baseAmount = qty * priceUnit * (1 - discount / 100);

    // Tax computation based on fiscal position
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (fiscalPosition === FISCAL_POSITIONS.EXPORT) {
        // Export: Zero-rated
        cgstAmount = 0;
        sgstAmount = 0;
        igstAmount = 0;
    } else if (fiscalPosition === FISCAL_POSITIONS.INTERSTATE || fiscalPosition === FISCAL_POSITIONS.SEZ) {
        // Interstate or SEZ: Only IGST
        igstAmount = baseAmount * (gstRate / 100);
    } else {
        // Intrastate: CGST + SGST (split equally)
        cgstAmount = baseAmount * (gstRate / 200);
        sgstAmount = baseAmount * (gstRate / 200);
    }

    const taxAmount = cgstAmount + sgstAmount + igstAmount;

    return {
        price_subtotal: round2(baseAmount),
        price_tax: round2(taxAmount),
        price_total: round2(baseAmount + taxAmount),
        cgst_amount: round2(cgstAmount),
        sgst_amount: round2(sgstAmount),
        igst_amount: round2(igstAmount),
    };
}

/**
 * Compute document totals from lines (Odoo's _compute_amounts equivalent)
 * @param {Array} lines - Array of line items with computed amounts
 * @returns {Object} - Document totals
 */
export function computeDocumentTotals(lines) {
    const validLines = lines.filter(line => !line.is_cancelled);

    return validLines.reduce((acc, line) => ({
        amount_untaxed: round2(acc.amount_untaxed + (parseFloat(line.price_subtotal) || 0)),
        amount_tax: round2(acc.amount_tax + (parseFloat(line.price_tax) || 0)),
        amount_total: round2(acc.amount_total + (parseFloat(line.price_total) || 0)),
        cgst_total: round2(acc.cgst_total + (parseFloat(line.cgst_amount) || 0)),
        sgst_total: round2(acc.sgst_total + (parseFloat(line.sgst_amount) || 0)),
        igst_total: round2(acc.igst_total + (parseFloat(line.igst_amount) || 0)),
    }), {
        amount_untaxed: 0,
        amount_tax: 0,
        amount_total: 0,
        cgst_total: 0,
        sgst_total: 0,
        igst_total: 0,
    });
}

/**
 * Recompute all lines when fiscal position changes
 * @param {Array} lines - Array of line items
 * @param {string} fiscalPosition - New fiscal position
 * @returns {Array} - Lines with recomputed amounts
 */
export function recomputeAllLines(lines, fiscalPosition) {
    return lines.map(line => ({
        ...line,
        ...computeLineAmounts(line, fiscalPosition),
    }));
}

/**
 * Prepare line data for saving (Odoo's onchange equivalent)
 * @param {Object} line - Line item input
 * @param {Object} product - Product data
 * @param {string} fiscalPosition - Fiscal position
 * @returns {Object} - Complete line data
 */
export function prepareLineForSave(line, product, fiscalPosition) {
    const preparedLine = {
        ...line,
        name: line.name || product?.item_name || product?.name || 'Product',
        hsn_code: line.hsn_code || product?.hsn_code || '',
        gst_rate: line.gst_rate ?? product?.default_gst_rate ?? 18,
        product_uom: line.product_uom || product?.product_uom || 'Units',
        product_uom_qty: parseFloat(line.product_uom_qty) || 1,
        price_unit: parseFloat(line.price_unit) || parseFloat(product?.selling_price) || 0,
        discount: parseFloat(line.discount) || 0,
    };

    // Compute amounts
    const computed = computeLineAmounts(preparedLine, fiscalPosition);

    return {
        ...preparedLine,
        ...computed,
    };
}

/**
 * Generate next sequence number for line items
 * @param {Array} existingLines - Existing line items
 * @returns {number} - Next sequence number
 */
export function getNextSequence(existingLines) {
    if (!existingLines || existingLines.length === 0) {
        return 10;
    }

    const maxSequence = Math.max(...existingLines.map(l => l.sequence || 0));
    return maxSequence + 10;
}

/**
 * Convert amount to words (Indian format)
 * @param {number} amount - Amount to convert
 * @returns {string} - Amount in words
 */
export function amountToWords(amount) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
        'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (amount === 0) return 'Zero Rupees Only';

    const rupees = Math.floor(amount);
    const paise = Math.round((amount - rupees) * 100);

    function convertNumber(n) {
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
        if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertNumber(n % 100) : '');
        if (n < 100000) return convertNumber(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convertNumber(n % 1000) : '');
        if (n < 10000000) return convertNumber(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convertNumber(n % 100000) : '');
        return convertNumber(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convertNumber(n % 10000000) : '');
    }

    let result = convertNumber(rupees) + ' Rupees';
    if (paise > 0) {
        result += ' and ' + convertNumber(paise) + ' Paise';
    }
    result += ' Only';

    return result;
}

/**
 * Round to 2 decimal places
 * @param {number} num - Number to round
 * @returns {number} - Rounded number
 */
function round2(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * State workflow transitions (Odoo-style)
 */
export const STATE_TRANSITIONS = {
    draft: ['sent', 'sale', 'cancel'],
    sent: ['draft', 'sale', 'cancel'],
    sale: ['done', 'cancel'],
    done: [],
    cancel: ['draft'],
};

/**
 * Check if state transition is allowed
 * @param {string} currentState - Current state
 * @param {string} newState - Target state
 * @returns {boolean} - Whether transition is allowed
 */
export function canTransitionTo(currentState, newState) {
    return STATE_TRANSITIONS[currentState]?.includes(newState) || false;
}

/**
 * Get state display properties
 * @param {string} state - State code
 * @returns {Object} - Display properties
 */
export function getStateDisplay(state) {
    const displays = {
        draft: { label: 'Quotation', color: 'secondary', icon: 'FileEdit' },
        sent: { label: 'Quotation Sent', color: 'info', icon: 'Send' },
        sale: { label: 'Sales Order', color: 'success', icon: 'CheckCircle' },
        done: { label: 'Locked', color: 'muted', icon: 'Lock' },
        cancel: { label: 'Cancelled', color: 'destructive', icon: 'XCircle' },
    };
    return displays[state] || displays.draft;
}
