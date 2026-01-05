/**
 * Ergopack Product Catalog
 * 
 * Hardcoded product data for quotation generation.
 * Prices and specifications extracted from sample quotation.
 * 
 * @module lib/ergopack/products
 */

export const ERGOPACK_PRODUCTS = [
    {
        id: 'ergopack-726x-li',
        name: 'Ergopack 726X-Li',
        description: [
            'X-PERT Line',
            'Sealing Width: 9 - 13 mm',
            'With Sealing Tool',
            '600 Cycles & Touchscreen Model',
            'Integrated Line Laser'
        ],
        rate: 2790000, // ₹27,90,000
        gstRate: 18,
        uom: 'pc',
    },
    {
        id: 'ergopack-go',
        name: 'Ergopack Go',
        description: [
            'Economy Line',
            'Without Sealing Tool',
            '350 Cycles'
        ],
        rate: 1185000, // ₹11,85,000
        gstRate: 18,
        uom: 'pc',
    },
    {
        id: 'ergopack-700-crank',
        name: 'Ergopack 700 Crank',
        description: [
            'Economy Line',
            'Without Sealing Tool'
        ],
        rate: 675000, // ₹6,75,000
        gstRate: 18,
        uom: 'pc',
    },
];

/**
 * Company details for quotation header
 */
export const COMPANY_INFO = {
    name: 'BENZ PACKAGING SOLUTIONS PRIVATE LIMITED',
    address: 'Plot 83, Sec-5, IMT Manesar, Gurgaon, Gurgaon, Haryana, India - 122052',
    email: 'ccare6@benz-packaging.com',
    phone: '+919990744477',
    placeOfSupply: 'Haryana (06)',
    countryOfSupply: 'India',
};

/**
 * Fixed terms and conditions
 */
export const QUOTATION_TERMS = {
    payment: '50% Advance',
    delivery: 'Within 45 days from the date of receipt of confirmed PO.( inclusive all process)',
    validity: 'This quote is valid for 15 days from the date of making.',
    freight: 'Will Extra as applicable.',
    currency: 'INR',
};

/**
 * Generate quotation number
 */
export function generateQuotationNumber() {
    const prefix = 'SO';
    const timestamp = Date.now().toString().slice(-10);
    return `${prefix}${timestamp}`;
}

/**
 * Convert number to Indian words
 */
export function numberToWords(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (num === 0) return 'Zero';

    function convertLessThanThousand(n) {
        if (n === 0) return '';
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
        return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertLessThanThousand(n % 100) : '');
    }

    // Indian numbering: Crore, Lakh, Thousand
    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const remainder = num % 1000;

    let result = '';
    if (crore) result += convertLessThanThousand(crore) + ' Crore ';
    if (lakh) result += convertLessThanThousand(lakh) + ' Lakh ';
    if (thousand) result += convertLessThanThousand(thousand) + ' Thousand ';
    if (remainder) result += convertLessThanThousand(remainder);

    return result.trim() + ' Rupees Only';
}

/**
 * Format currency for display (Indian format)
 */
export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}
