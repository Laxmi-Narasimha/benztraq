/**
 * Comprehensive Unit Tests for dates.js
 * Tests all date utility functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    getDateRangeFromPreset,
    getDaysRemainingInMonth,
    getMTDRange,
    getQTDRange,
    getYTDRange,
    getFiscalYearStart,
    getFYTDRange,
    getMonthsInRange,
    getCurrentMonthYear,
    createMonthKey,
    getDaysBetween,
} from './dates';

describe('dates.js', () => {
    // Mock date for consistent testing
    const mockDate = new Date(2024, 5, 15); // June 15, 2024

    // =========================================================================
    // getDateRangeFromPreset
    // =========================================================================
    describe('getDateRangeFromPreset', () => {
        it('should return today range', () => {
            const result = getDateRangeFromPreset('today');
            expect(result.from).toBeDefined();
            expect(result.to).toBeDefined();
            expect(result.from.getDate()).toBe(result.to.getDate());
        });

        it('should return yesterday range', () => {
            const result = getDateRangeFromPreset('yesterday');
            const today = new Date();
            expect(result.from.getDate()).toBe(today.getDate() - 1);
        });

        it('should return last 7 days', () => {
            const result = getDateRangeFromPreset('last_7_days');
            const diff = Math.ceil((result.to - result.from) / (1000 * 60 * 60 * 24));
            expect(diff).toBe(7); // 7 days from start to end
        });

        it('should return last 30 days', () => {
            const result = getDateRangeFromPreset('last_30_days');
            const diff = Math.ceil((result.to - result.from) / (1000 * 60 * 60 * 24));
            expect(diff).toBe(30); // 30 days from start to end
        });

        it('should return this month range', () => {
            const result = getDateRangeFromPreset('this_month');
            expect(result.from.getDate()).toBe(1);
        });

        it('should return this year range', () => {
            const result = getDateRangeFromPreset('this_year');
            expect(result.from.getMonth()).toBe(0); // January
            expect(result.from.getDate()).toBe(1);
        });

        it('should default to this month for unknown preset', () => {
            const result = getDateRangeFromPreset('unknown');
            expect(result.from.getDate()).toBe(1);
        });
    });

    // =========================================================================
    // getDaysRemainingInMonth
    // =========================================================================
    describe('getDaysRemainingInMonth', () => {
        it('should calculate days remaining', () => {
            const result = getDaysRemainingInMonth(mockDate);
            // June has 30 days, June 15 means 16 days remaining (15-30 inclusive)
            expect(result).toBe(16);
        });

        it('should return 1 on last day of month', () => {
            const lastDay = new Date(2024, 5, 30); // June 30
            const result = getDaysRemainingInMonth(lastDay);
            expect(result).toBe(1);
        });

        it('should return full month on first day', () => {
            const firstDay = new Date(2024, 5, 1); // June 1
            const result = getDaysRemainingInMonth(firstDay);
            expect(result).toBe(30);
        });
    });

    // =========================================================================
    // getMTDRange
    // =========================================================================
    describe('getMTDRange', () => {
        it('should return month to date range', () => {
            const result = getMTDRange(mockDate);
            expect(result.from.getDate()).toBe(1);
            expect(result.to.getDate()).toBe(15);
        });
    });

    // =========================================================================
    // getQTDRange
    // =========================================================================
    describe('getQTDRange', () => {
        it('should return quarter to date range for Q2', () => {
            const result = getQTDRange(mockDate);
            expect(result.from.getMonth()).toBe(3); // April (Q2 start)
        });
    });

    // =========================================================================
    // getYTDRange
    // =========================================================================
    describe('getYTDRange', () => {
        it('should return year to date range', () => {
            const result = getYTDRange(mockDate);
            expect(result.from.getMonth()).toBe(0); // January
            expect(result.from.getDate()).toBe(1);
            expect(result.from.getFullYear()).toBe(2024);
        });
    });

    // =========================================================================
    // getFiscalYearStart (Indian FY starts April 1)
    // =========================================================================
    describe('getFiscalYearStart', () => {
        it('should return current FY start when in Q2-Q4', () => {
            const june = new Date(2024, 5, 15); // June 2024
            const result = getFiscalYearStart(june);
            expect(result.getMonth()).toBe(3); // April
            expect(result.getDate()).toBe(1);
            expect(result.getFullYear()).toBe(2024);
        });

        it('should return previous FY start when in Q1 (Jan-Mar)', () => {
            const february = new Date(2024, 1, 15); // Feb 2024
            const result = getFiscalYearStart(february);
            expect(result.getMonth()).toBe(3); // April
            expect(result.getFullYear()).toBe(2023); // Previous year
        });
    });

    // =========================================================================
    // getMonthsInRange
    // =========================================================================
    describe('getMonthsInRange', () => {
        it('should return all months in range', () => {
            const start = new Date(2024, 0, 1); // Jan 2024
            const end = new Date(2024, 2, 31); // Mar 2024
            const result = getMonthsInRange(start, end);
            expect(result).toHaveLength(3);
            expect(result[0].label).toBe('Jan 2024');
            expect(result[2].label).toBe('Mar 2024');
        });

        it('should include month number (1-indexed)', () => {
            const start = new Date(2024, 0, 1);
            const end = new Date(2024, 0, 31);
            const result = getMonthsInRange(start, end);
            expect(result[0].month).toBe(1);
        });
    });

    // =========================================================================
    // getCurrentMonthYear
    // =========================================================================
    describe('getCurrentMonthYear', () => {
        it('should return current month and year', () => {
            const result = getCurrentMonthYear();
            const now = new Date();
            expect(result.month).toBe(now.getMonth() + 1);
            expect(result.year).toBe(now.getFullYear());
        });
    });

    // =========================================================================
    // createMonthKey
    // =========================================================================
    describe('createMonthKey', () => {
        it('should create YYYY-MM key from Date', () => {
            const result = createMonthKey(mockDate);
            expect(result).toBe('2024-06');
        });

        it('should create key from ISO string', () => {
            const result = createMonthKey('2024-06-15');
            expect(result).toBe('2024-06');
        });
    });

    // =========================================================================
    // getDaysBetween
    // =========================================================================
    describe('getDaysBetween', () => {
        it('should calculate days between two dates', () => {
            const start = new Date(2024, 0, 1);
            const end = new Date(2024, 0, 10);
            const result = getDaysBetween(start, end);
            expect(result).toBe(9);
        });

        it('should return 0 for same date', () => {
            const date = new Date(2024, 0, 1);
            const result = getDaysBetween(date, date);
            expect(result).toBe(0);
        });
    });
});
