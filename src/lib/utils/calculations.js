/**
 * Business Logic Calculations
 * 
 * Core calculation functions for targets, variances, and performance metrics.
 * These functions implement the exact business rules specified in requirements.
 * 
 * All functions are pure (no side effects) and thoroughly tested.
 * 
 * @module lib/utils/calculations
 */

import { MONTHS_IN_YEAR } from '../constants';

/**
 * Calculates the base monthly target from an annual target.
 * 
 * @param {number} annualTarget - The annual target amount in INR
 * @returns {number} The base monthly target (annual / 12)
 */
export function calculateBaseMonthlyTarget(annualTarget) {
    if (typeof annualTarget !== 'number' || annualTarget < 0) {
        return 0;
    }
    return annualTarget / MONTHS_IN_YEAR;
}

/**
 * Calculates the carryover from the previous month.
 * Carryover = Target - Achieved
 * 
 * - Positive carryover: target was missed by that amount
 * - Negative carryover: target was exceeded by that amount
 * 
 * @param {number} target - The target amount for the month
 * @param {number} achieved - The achieved amount for the month
 * @returns {number} The carryover amount
 */
export function calculateCarryover(target, achieved) {
    if (typeof target !== 'number' || typeof achieved !== 'number') {
        return 0;
    }
    return target - achieved;
}

/**
 * Calculates the adjusted monthly target including carryover.
 * 
 * Formula: max(0, base_monthly + carryover)
 * 
 * This ensures:
 * - If met exactly: next month = base monthly
 * - If missed by X: next month = base + X (more to achieve)
 * - If exceeded by Y: next month = base - Y (less to achieve, min 0)
 * 
 * @param {number} baseMonthlyTarget - The base monthly target (annual / 12)
 * @param {number} carryover - The carryover from previous month
 * @returns {number} The adjusted target for the current month
 */
export function calculateAdjustedTarget(baseMonthlyTarget, carryover) {
    if (typeof baseMonthlyTarget !== 'number' || typeof carryover !== 'number') {
        return 0;
    }
    return Math.max(0, baseMonthlyTarget + carryover);
}

/**
 * Calculates the monthly targets for a salesperson across all months of a year.
 * Implements the carryover logic as specified in requirements.
 * 
 * @param {number} annualTarget - The annual target amount in INR
 * @param {Object<number, number>} monthlyAchieved - Map of month (1-12) to achieved amount
 * @returns {Array<{month: number, baseTarget: number, carryover: number, adjustedTarget: number, achieved: number, gap: number, achievedPercent: number}>}
 */
export function calculateYearlyTargetBreakdown(annualTarget, monthlyAchieved = {}) {
    const baseMonthly = calculateBaseMonthlyTarget(annualTarget);
    const results = [];
    let previousCarryover = 0;

    for (let month = 1; month <= MONTHS_IN_YEAR; month++) {
        const achieved = monthlyAchieved[month] || 0;

        // First month has no carryover
        const currentCarryover = month === 1 ? 0 : previousCarryover;
        const adjustedTarget = calculateAdjustedTarget(baseMonthly, currentCarryover);
        const gap = adjustedTarget - achieved;
        const achievedPercent = adjustedTarget > 0 ? (achieved / adjustedTarget) * 100 : 0;

        results.push({
            month,
            baseTarget: baseMonthly,
            carryover: currentCarryover,
            adjustedTarget,
            achieved,
            gap,
            achievedPercent: Math.round(achievedPercent * 100) / 100,
        });

        // Calculate carryover for next month
        previousCarryover = calculateCarryover(adjustedTarget, achieved);
    }

    return results;
}

/**
 * Calculates the pace indicator to hit the monthly target.
 * Returns the required daily average to meet the remaining gap.
 * 
 * @param {number} target - The target amount for the month
 * @param {number} achieved - The achieved amount so far
 * @param {number} daysRemaining - Number of days remaining in the month
 * @returns {{requiredDaily: number, onTrack: boolean, requiredPercent: number}}
 */
export function calculatePaceToTarget(target, achieved, daysRemaining) {
    const gap = target - achieved;

    if (gap <= 0) {
        return {
            requiredDaily: 0,
            onTrack: true,
            requiredPercent: 100,
        };
    }

    if (daysRemaining <= 0) {
        return {
            requiredDaily: gap,
            onTrack: false,
            requiredPercent: target > 0 ? (achieved / target) * 100 : 0,
        };
    }

    const requiredDaily = gap / daysRemaining;
    const requiredPercent = target > 0 ? (achieved / target) * 100 : 0;

    return {
        requiredDaily: Math.round(requiredDaily * 100) / 100,
        onTrack: gap <= 0,
        requiredPercent: Math.round(requiredPercent * 100) / 100,
    };
}

/**
 * Calculates price variance between quote and sales order.
 * 
 * Formula: ((quote_price - sales_price) / quote_price) * 100
 * 
 * @param {number} quotePrice - The quoted price
 * @param {number} salesPrice - The sales order price
 * @returns {{amount: number, percent: number, direction: 'increase' | 'decrease' | 'same', isValid: boolean}}
 */
export function calculatePriceVariance(quotePrice, salesPrice) {
    // Handle invalid inputs
    if (typeof quotePrice !== 'number' || typeof salesPrice !== 'number' || quotePrice === 0) {
        return {
            amount: 0,
            percent: 0,
            direction: 'same',
            isValid: false,
        };
    }

    const amount = quotePrice - salesPrice;
    const percent = (amount / quotePrice) * 100;

    let direction = 'same';
    if (salesPrice < quotePrice) {
        direction = 'decrease';
    } else if (salesPrice > quotePrice) {
        direction = 'increase';
    }

    return {
        amount: Math.round(amount * 100) / 100,
        percent: Math.round(percent * 100) / 100,
        direction,
        isValid: true,
    };
}

/**
 * Calculates the quote to sales order conversion rate.
 * 
 * @param {number} totalQuotes - Total number of quotes
 * @param {number} linkedQuotes - Number of quotes linked to sales orders
 * @returns {number} Conversion rate as a percentage (0-100)
 */
export function calculateConversionRate(totalQuotes, linkedQuotes) {
    if (typeof totalQuotes !== 'number' || typeof linkedQuotes !== 'number' || totalQuotes === 0) {
        return 0;
    }

    const rate = (linkedQuotes / totalQuotes) * 100;
    return Math.round(rate * 100) / 100;
}

/**
 * Calculates line item total from quantity and unit price.
 * Includes optional discount, tax, and freight/packing amounts.
 * 
 * @param {number} qty - Quantity
 * @param {number} unitPrice - Unit price
 * @param {number} [discountAmount=0] - Discount amount
 * @param {number} [taxAmount=0] - Tax amount
 * @param {number} [freightPackingAmount=0] - Freight and packing amount
 * @returns {number} Calculated line total
 */
export function calculateLineTotal(qty, unitPrice, discountAmount = 0, taxAmount = 0, freightPackingAmount = 0) {
    if (typeof qty !== 'number' || typeof unitPrice !== 'number') {
        return 0;
    }

    const baseAmount = qty * unitPrice;
    const discount = discountAmount || 0;
    const tax = taxAmount || 0;
    const freight = freightPackingAmount || 0;

    const total = baseAmount - discount + tax + freight;
    return Math.round(total * 100) / 100;
}

/**
 * Calculates document grand total from line items and optional adjustments.
 * 
 * @param {Array<{line_total: number}>} lineItems - Array of line items
 * @param {number} [discountTotal=0] - Total discount
 * @param {number} [taxTotal=0] - Total tax
 * @param {number} [freightPackingTotal=0] - Total freight/packing
 * @returns {{subtotal: number, grandTotal: number}}
 */
export function calculateDocumentTotals(lineItems, discountTotal = 0, taxTotal = 0, freightPackingTotal = 0) {
    if (!Array.isArray(lineItems)) {
        return { subtotal: 0, grandTotal: 0 };
    }

    const subtotal = lineItems.reduce((sum, item) => {
        const lineTotal = item.line_total || 0;
        return sum + lineTotal;
    }, 0);

    const grandTotal = subtotal - discountTotal + taxTotal + freightPackingTotal;

    return {
        subtotal: Math.round(subtotal * 100) / 100,
        grandTotal: Math.round(grandTotal * 100) / 100,
    };
}

/**
 * Calculates Month-over-Month (MoM) change percentage.
 * 
 * @param {number} currentValue - Current month value
 * @param {number} previousValue - Previous month value
 * @returns {{change: number, percent: number, trend: 'up' | 'down' | 'neutral'}}
 */
export function calculateMoMChange(currentValue, previousValue) {
    if (typeof currentValue !== 'number' || typeof previousValue !== 'number') {
        return { change: 0, percent: 0, trend: 'neutral' };
    }

    const change = currentValue - previousValue;
    const percent = previousValue !== 0 ? (change / previousValue) * 100 : 0;

    let trend = 'neutral';
    if (change > 0) trend = 'up';
    if (change < 0) trend = 'down';

    return {
        change: Math.round(change * 100) / 100,
        percent: Math.round(percent * 100) / 100,
        trend,
    };
}

/**
 * Aggregates sales data by a given dimension (region, product, customer, etc.)
 * 
 * @param {Array<Object>} documents - Array of document objects
 * @param {string} groupByField - Field to group by (e.g., 'region_id', 'customer_id')
 * @param {string} [valueField='grand_total'] - Field to sum
 * @returns {Array<{key: string, total: number, count: number}>}
 */
export function aggregateSalesByDimension(documents, groupByField, valueField = 'grand_total') {
    if (!Array.isArray(documents) || !groupByField) {
        return [];
    }

    const aggregated = {};

    documents.forEach((doc) => {
        const key = doc[groupByField];
        if (key === undefined) return;

        if (!aggregated[key]) {
            aggregated[key] = { key, total: 0, count: 0 };
        }

        aggregated[key].total += doc[valueField] || 0;
        aggregated[key].count += 1;
    });

    return Object.values(aggregated).sort((a, b) => b.total - a.total);
}
