/**
 * Comprehensive Unit Tests for formatting.js
 * Tests all formatting utility functions
 */

import { describe, it, expect } from 'vitest';
import {
    formatCurrency,
    formatCompactCurrency,
    formatNumber,
    formatPercent,
    formatDate,
    formatDateTime,
    formatRelativeTime,
    formatDateRange,
    formatDocNumber,
    formatInitials,
    truncateText,
    formatFileSize,
    formatVarianceDirection,
} from './formatting';

describe('formatting.js', () => {
    // =========================================================================
    // formatCurrency
    // =========================================================================
    describe('formatCurrency', () => {
        it('should format positive amounts', () => {
            const result = formatCurrency(1234567.89);
            expect(result).toContain('₹');
            expect(result).toContain('12,34,567.89');
        });

        it('should handle zero', () => {
            expect(formatCurrency(0)).toBe('₹0.00');
        });

        it('should handle negative amounts', () => {
            const result = formatCurrency(-1000);
            expect(result).toContain('-');
        });

        it('should handle NaN', () => {
            expect(formatCurrency(NaN)).toBe('₹0.00');
        });

        it('should handle non-number input', () => {
            expect(formatCurrency('invalid')).toBe('₹0.00');
        });

        it('should use compact notation when requested', () => {
            const result = formatCurrency(1500000, { compact: true });
            expect(result).toContain('L');
        });
    });

    // =========================================================================
    // formatCompactCurrency
    // =========================================================================
    describe('formatCompactCurrency', () => {
        it('should format crores (1Cr = 10,000,000)', () => {
            const result = formatCompactCurrency(15000000);
            expect(result).toBe('₹1.50Cr');
        });

        it('should format lakhs (1L = 100,000)', () => {
            const result = formatCompactCurrency(250000);
            expect(result).toBe('₹2.50L');
        });

        it('should format thousands', () => {
            const result = formatCompactCurrency(5000);
            expect(result).toBe('₹5.0K');
        });

        it('should format small amounts without suffix', () => {
            const result = formatCompactCurrency(500);
            expect(result).toBe('₹500');
        });

        it('should handle negative values', () => {
            const result = formatCompactCurrency(-15000000);
            expect(result).toBe('-₹1.50Cr');
        });
    });

    // =========================================================================
    // formatNumber
    // =========================================================================
    describe('formatNumber', () => {
        it('should format numbers with Indian locale', () => {
            const result = formatNumber(1234567);
            expect(result).toBe('12,34,567');
        });

        it('should handle decimals', () => {
            const result = formatNumber(1234.567, 2);
            expect(result).toContain('1,234.57');
        });

        it('should handle NaN', () => {
            expect(formatNumber(NaN)).toBe('0');
        });
    });

    // =========================================================================
    // formatPercent
    // =========================================================================
    describe('formatPercent', () => {
        it('should format basic percentage', () => {
            expect(formatPercent(75.5)).toBe('75.5%');
        });

        it('should include sign when requested', () => {
            expect(formatPercent(10, 1, true)).toBe('+10.0%');
            expect(formatPercent(-10, 1, true)).toBe('-10.0%');
        });

        it('should handle zero', () => {
            expect(formatPercent(0)).toBe('0.0%');
        });

        it('should handle NaN', () => {
            expect(formatPercent(NaN)).toBe('0%');
        });
    });

    // =========================================================================
    // formatDate
    // =========================================================================
    describe('formatDate', () => {
        it('should format Date object', () => {
            const result = formatDate(new Date(2024, 0, 15));
            expect(result).toBe('15 Jan 2024');
        });

        it('should format ISO string', () => {
            const result = formatDate('2024-01-15');
            expect(result).toBe('15 Jan 2024');
        });

        it('should use custom pattern', () => {
            const result = formatDate('2024-01-15', 'yyyy-MM-dd');
            expect(result).toBe('2024-01-15');
        });

        it('should handle null', () => {
            expect(formatDate(null)).toBe('');
        });

        it('should handle invalid date', () => {
            expect(formatDate('invalid')).toBe('');
        });
    });

    // =========================================================================
    // formatDocNumber
    // =========================================================================
    describe('formatDocNumber', () => {
        it('should return document number', () => {
            expect(formatDocNumber('INV-001')).toBe('INV-001');
        });

        it('should return N/A for null', () => {
            expect(formatDocNumber(null)).toBe('N/A');
        });

        it('should return N/A for empty string', () => {
            expect(formatDocNumber('')).toBe('N/A');
        });
    });

    // =========================================================================
    // formatInitials
    // =========================================================================
    describe('formatInitials', () => {
        it('should extract initials from two words', () => {
            expect(formatInitials('John Doe')).toBe('JD');
        });

        it('should handle single name', () => {
            expect(formatInitials('John')).toBe('JO');
        });

        it('should handle three words', () => {
            expect(formatInitials('John Michael Doe')).toBe('JD');
        });

        it('should handle null', () => {
            expect(formatInitials(null)).toBe('??');
        });

        it('should uppercase result', () => {
            expect(formatInitials('john doe')).toBe('JD');
        });
    });

    // =========================================================================
    // truncateText
    // =========================================================================
    describe('truncateText', () => {
        it('should truncate long text', () => {
            const result = truncateText('This is a very long text', 10);
            expect(result).toBe('This is...');
            expect(result.length).toBe(10);
        });

        it('should not truncate short text', () => {
            expect(truncateText('Short', 10)).toBe('Short');
        });

        it('should handle null', () => {
            expect(truncateText(null)).toBe('');
        });

        it('should use default max length of 50', () => {
            const longText = 'a'.repeat(60);
            const result = truncateText(longText);
            expect(result.length).toBe(50);
        });
    });

    // =========================================================================
    // formatFileSize
    // =========================================================================
    describe('formatFileSize', () => {
        it('should format bytes', () => {
            expect(formatFileSize(500)).toBe('500 B');
        });

        it('should format KB', () => {
            expect(formatFileSize(1024)).toBe('1.0 KB');
        });

        it('should format MB', () => {
            expect(formatFileSize(1048576)).toBe('1.0 MB');
        });

        it('should format GB', () => {
            expect(formatFileSize(1073741824)).toBe('1.0 GB');
        });

        it('should handle zero', () => {
            expect(formatFileSize(0)).toBe('0 B');
        });
    });

    // =========================================================================
    // formatVarianceDirection
    // =========================================================================
    describe('formatVarianceDirection', () => {
        it('should format decrease', () => {
            const result = formatVarianceDirection('decrease', 10);
            expect(result.label).toBe('10.0% decrease');
            expect(result.colorClass).toBe('text-red-600');
        });

        it('should format increase', () => {
            const result = formatVarianceDirection('increase', 15);
            expect(result.label).toBe('15.0% increase');
            expect(result.colorClass).toBe('text-green-600');
        });

        it('should format no change', () => {
            const result = formatVarianceDirection('same', 0);
            expect(result.label).toBe('No change');
        });
    });
});
