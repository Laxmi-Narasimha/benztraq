/**
 * Comprehensive Unit Tests for calculations.js
 * Tests all business logic calculation functions
 */

import { describe, it, expect } from 'vitest';
import {
    calculateBaseMonthlyTarget,
    calculateCarryover,
    calculateAdjustedTarget,
    calculateYearlyTargetBreakdown,
    calculatePaceToTarget,
    calculatePriceVariance,
    calculateConversionRate,
    calculateLineTotal,
    calculateDocumentTotals,
    calculateMoMChange,
    aggregateSalesByDimension,
} from './calculations';

describe('calculations.js', () => {
    // =========================================================================
    // calculateBaseMonthlyTarget
    // =========================================================================
    describe('calculateBaseMonthlyTarget', () => {
        it('should calculate correct monthly target from annual', () => {
            expect(calculateBaseMonthlyTarget(1200000)).toBe(100000);
        });

        it('should handle zero annual target', () => {
            expect(calculateBaseMonthlyTarget(0)).toBe(0);
        });

        it('should handle negative annual target', () => {
            expect(calculateBaseMonthlyTarget(-1200000)).toBe(0);
        });

        it('should return 0 for invalid input', () => {
            expect(calculateBaseMonthlyTarget('invalid')).toBe(0);
            expect(calculateBaseMonthlyTarget(null)).toBe(0);
            expect(calculateBaseMonthlyTarget(undefined)).toBe(0);
        });
    });

    // =========================================================================
    // calculateCarryover
    // =========================================================================
    describe('calculateCarryover', () => {
        it('should calculate positive carryover when target missed', () => {
            expect(calculateCarryover(100000, 80000)).toBe(20000);
        });

        it('should calculate negative carryover when target exceeded', () => {
            expect(calculateCarryover(100000, 120000)).toBe(-20000);
        });

        it('should return zero when target met exactly', () => {
            expect(calculateCarryover(100000, 100000)).toBe(0);
        });

        it('should return 0 for invalid inputs', () => {
            expect(calculateCarryover('100000', 80000)).toBe(0);
            expect(calculateCarryover(100000, 'invalid')).toBe(0);
        });
    });

    // =========================================================================
    // calculateAdjustedTarget
    // =========================================================================
    describe('calculateAdjustedTarget', () => {
        it('should add positive carryover to base', () => {
            expect(calculateAdjustedTarget(100000, 20000)).toBe(120000);
        });

        it('should subtract negative carryover from base', () => {
            expect(calculateAdjustedTarget(100000, -20000)).toBe(80000);
        });

        it('should never return negative', () => {
            expect(calculateAdjustedTarget(100000, -150000)).toBe(0);
        });

        it('should return 0 for invalid inputs', () => {
            expect(calculateAdjustedTarget('invalid', 20000)).toBe(0);
        });
    });

    // =========================================================================
    // calculateYearlyTargetBreakdown
    // =========================================================================
    describe('calculateYearlyTargetBreakdown', () => {
        it('should return 12 months of data', () => {
            const result = calculateYearlyTargetBreakdown(1200000, {});
            expect(result).toHaveLength(12);
        });

        it('should have no carryover for first month', () => {
            const result = calculateYearlyTargetBreakdown(1200000, {});
            expect(result[0].carryover).toBe(0);
        });

        it('should carry over missed amount to next month', () => {
            const monthlyAchieved = { 1: 80000 }; // Missed by 20000
            const result = calculateYearlyTargetBreakdown(1200000, monthlyAchieved);
            expect(result[1].carryover).toBe(20000);
            expect(result[1].adjustedTarget).toBe(120000);
        });

        it('should reduce next month target when exceeded', () => {
            const monthlyAchieved = { 1: 120000 }; // Exceeded by 20000
            const result = calculateYearlyTargetBreakdown(1200000, monthlyAchieved);
            expect(result[1].carryover).toBe(-20000);
            expect(result[1].adjustedTarget).toBe(80000);
        });
    });

    // =========================================================================
    // calculatePaceToTarget
    // =========================================================================
    describe('calculatePaceToTarget', () => {
        it('should return on track when target already met', () => {
            const result = calculatePaceToTarget(100000, 100000, 10);
            expect(result.onTrack).toBe(true);
            expect(result.requiredDaily).toBe(0);
        });

        it('should calculate required daily pace', () => {
            const result = calculatePaceToTarget(100000, 50000, 10);
            expect(result.requiredDaily).toBe(5000);
            expect(result.onTrack).toBe(false);
        });

        it('should handle zero days remaining', () => {
            const result = calculatePaceToTarget(100000, 50000, 0);
            expect(result.requiredDaily).toBe(50000);
            expect(result.onTrack).toBe(false);
        });
    });

    // =========================================================================
    // calculatePriceVariance
    // =========================================================================
    describe('calculatePriceVariance', () => {
        it('should calculate decrease when sales price lower', () => {
            const result = calculatePriceVariance(100, 90);
            expect(result.direction).toBe('decrease');
            expect(result.percent).toBe(10);
            expect(result.amount).toBe(10);
            expect(result.isValid).toBe(true);
        });

        it('should calculate increase when sales price higher', () => {
            const result = calculatePriceVariance(100, 110);
            expect(result.direction).toBe('increase');
            expect(result.percent).toBe(-10);
        });

        it('should return same when prices equal', () => {
            const result = calculatePriceVariance(100, 100);
            expect(result.direction).toBe('same');
        });

        it('should handle invalid inputs', () => {
            const result = calculatePriceVariance(0, 100);
            expect(result.isValid).toBe(false);
        });
    });

    // =========================================================================
    // calculateConversionRate
    // =========================================================================
    describe('calculateConversionRate', () => {
        it('should calculate correct conversion rate', () => {
            expect(calculateConversionRate(100, 25)).toBe(25);
        });

        it('should handle zero quotes', () => {
            expect(calculateConversionRate(0, 0)).toBe(0);
        });

        it('should handle 100% conversion', () => {
            expect(calculateConversionRate(10, 10)).toBe(100);
        });
    });

    // =========================================================================
    // calculateLineTotal
    // =========================================================================
    describe('calculateLineTotal', () => {
        it('should calculate basic line total', () => {
            expect(calculateLineTotal(10, 100)).toBe(1000);
        });

        it('should apply discount', () => {
            expect(calculateLineTotal(10, 100, 50)).toBe(950);
        });

        it('should add tax and freight', () => {
            expect(calculateLineTotal(10, 100, 0, 100, 50)).toBe(1150);
        });

        it('should handle invalid inputs', () => {
            expect(calculateLineTotal('invalid', 100)).toBe(0);
        });
    });

    // =========================================================================
    // calculateDocumentTotals
    // =========================================================================
    describe('calculateDocumentTotals', () => {
        it('should sum line totals', () => {
            const items = [{ line_total: 1000 }, { line_total: 2000 }];
            const result = calculateDocumentTotals(items);
            expect(result.subtotal).toBe(3000);
            expect(result.grandTotal).toBe(3000);
        });

        it('should apply adjustments', () => {
            const items = [{ line_total: 1000 }];
            const result = calculateDocumentTotals(items, 50, 100, 25);
            expect(result.grandTotal).toBe(1075); // 1000 - 50 + 100 + 25
        });

        it('should handle empty array', () => {
            const result = calculateDocumentTotals([]);
            expect(result.subtotal).toBe(0);
        });

        it('should handle non-array input', () => {
            const result = calculateDocumentTotals(null);
            expect(result.subtotal).toBe(0);
        });
    });

    // =========================================================================
    // calculateMoMChange
    // =========================================================================
    describe('calculateMoMChange', () => {
        it('should calculate upward trend', () => {
            const result = calculateMoMChange(120, 100);
            expect(result.trend).toBe('up');
            expect(result.change).toBe(20);
            expect(result.percent).toBe(20);
        });

        it('should calculate downward trend', () => {
            const result = calculateMoMChange(80, 100);
            expect(result.trend).toBe('down');
            expect(result.change).toBe(-20);
            expect(result.percent).toBe(-20);
        });

        it('should handle no change', () => {
            const result = calculateMoMChange(100, 100);
            expect(result.trend).toBe('neutral');
        });

        it('should handle zero previous value', () => {
            const result = calculateMoMChange(100, 0);
            expect(result.percent).toBe(0);
        });
    });

    // =========================================================================
    // aggregateSalesByDimension
    // =========================================================================
    describe('aggregateSalesByDimension', () => {
        it('should aggregate by region', () => {
            const docs = [
                { region_id: 'r1', grand_total: 1000 },
                { region_id: 'r1', grand_total: 2000 },
                { region_id: 'r2', grand_total: 500 },
            ];
            const result = aggregateSalesByDimension(docs, 'region_id');
            expect(result).toHaveLength(2);
            expect(result[0].key).toBe('r1');
            expect(result[0].total).toBe(3000);
            expect(result[0].count).toBe(2);
        });

        it('should sort by total descending', () => {
            const docs = [
                { region_id: 'r1', grand_total: 100 },
                { region_id: 'r2', grand_total: 500 },
            ];
            const result = aggregateSalesByDimension(docs, 'region_id');
            expect(result[0].key).toBe('r2');
        });

        it('should handle empty array', () => {
            const result = aggregateSalesByDimension([], 'region_id');
            expect(result).toHaveLength(0);
        });

        it('should skip documents without the groupBy field', () => {
            const docs = [
                { region_id: 'r1', grand_total: 1000 },
                { grand_total: 500 }, // No region_id
            ];
            const result = aggregateSalesByDimension(docs, 'region_id');
            expect(result).toHaveLength(1);
        });
    });
});
