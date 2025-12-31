/**
 * Date Utility Functions
 * 
 * Helper functions for date calculations and ranges.
 * Used for filter presets and data aggregation.
 * 
 * @module lib/utils/dates
 */

import {
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    startOfQuarter,
    endOfQuarter,
    startOfYear,
    endOfYear,
    subDays,
    subMonths,
    subYears,
    getDaysInMonth,
    differenceInDays,
    eachMonthOfInterval,
    format,
} from 'date-fns';

/**
 * Gets the date range for a preset filter value.
 * 
 * @param {string} preset - The preset identifier
 * @returns {{from: Date, to: Date}}
 */
export function getDateRangeFromPreset(preset) {
    const now = new Date();

    switch (preset) {
        case 'today':
            return {
                from: startOfDay(now),
                to: endOfDay(now),
            };

        case 'yesterday':
            const yesterday = subDays(now, 1);
            return {
                from: startOfDay(yesterday),
                to: endOfDay(yesterday),
            };

        case 'last_7_days':
            return {
                from: startOfDay(subDays(now, 6)),
                to: endOfDay(now),
            };

        case 'last_30_days':
            return {
                from: startOfDay(subDays(now, 29)),
                to: endOfDay(now),
            };

        case 'this_month':
            return {
                from: startOfMonth(now),
                to: endOfMonth(now),
            };

        case 'last_month':
            const lastMonth = subMonths(now, 1);
            return {
                from: startOfMonth(lastMonth),
                to: endOfMonth(lastMonth),
            };

        case 'this_quarter':
            return {
                from: startOfQuarter(now),
                to: endOfQuarter(now),
            };

        case 'this_year':
            return {
                from: startOfYear(now),
                to: endOfYear(now),
            };

        case 'last_year':
            const lastYear = subYears(now, 1);
            return {
                from: startOfYear(lastYear),
                to: endOfYear(lastYear),
            };

        default:
            // Default to this month
            return {
                from: startOfMonth(now),
                to: endOfMonth(now),
            };
    }
}

/**
 * Gets the number of days remaining in the current month.
 * 
 * @param {Date} [date=new Date()] - The reference date
 * @returns {number} Days remaining including today
 */
export function getDaysRemainingInMonth(date = new Date()) {
    const totalDays = getDaysInMonth(date);
    const currentDay = date.getDate();
    return totalDays - currentDay + 1;
}

/**
 * Gets month-to-date (MTD) date range.
 * 
 * @param {Date} [date=new Date()] - The reference date
 * @returns {{from: Date, to: Date}}
 */
export function getMTDRange(date = new Date()) {
    return {
        from: startOfMonth(date),
        to: endOfDay(date),
    };
}

/**
 * Gets quarter-to-date (QTD) date range.
 * 
 * @param {Date} [date=new Date()] - The reference date
 * @returns {{from: Date, to: Date}}
 */
export function getQTDRange(date = new Date()) {
    return {
        from: startOfQuarter(date),
        to: endOfDay(date),
    };
}

/**
 * Gets year-to-date (YTD) date range.
 * 
 * @param {Date} [date=new Date()] - The reference date
 * @returns {{from: Date, to: Date}}
 */
export function getYTDRange(date = new Date()) {
    return {
        from: startOfYear(date),
        to: endOfDay(date),
    };
}

/**
 * Gets the fiscal year start date (April 1st in India).
 * 
 * @param {Date} [date=new Date()] - The reference date
 * @returns {Date} Start of fiscal year
 */
export function getFiscalYearStart(date = new Date()) {
    const year = date.getMonth() < 3 ? date.getFullYear() - 1 : date.getFullYear();
    return new Date(year, 3, 1); // April 1st
}

/**
 * Gets the fiscal year-to-date (FY-TD) date range.
 * 
 * @param {Date} [date=new Date()] - The reference date
 * @returns {{from: Date, to: Date}}
 */
export function getFYTDRange(date = new Date()) {
    return {
        from: getFiscalYearStart(date),
        to: endOfDay(date),
    };
}

/**
 * Gets all months in a date range for chart data.
 * 
 * @param {Date} startDate - Start of range
 * @param {Date} endDate - End of range
 * @returns {Array<{month: number, year: number, label: string, startDate: Date, endDate: Date}>}
 */
export function getMonthsInRange(startDate, endDate) {
    const months = eachMonthOfInterval({ start: startDate, end: endDate });

    return months.map((monthDate) => ({
        month: monthDate.getMonth() + 1, // 1-indexed
        year: monthDate.getFullYear(),
        label: format(monthDate, 'MMM yyyy'),
        shortLabel: format(monthDate, 'MMM'),
        startDate: startOfMonth(monthDate),
        endDate: endOfMonth(monthDate),
    }));
}

/**
 * Gets the current month and year.
 * 
 * @returns {{month: number, year: number}}
 */
export function getCurrentMonthYear() {
    const now = new Date();
    return {
        month: now.getMonth() + 1, // 1-indexed
        year: now.getFullYear(),
    };
}

/**
 * Creates a date key for grouping (YYYY-MM format).
 * 
 * @param {Date | string} date - The date
 * @returns {string} Date key in YYYY-MM format
 */
export function createMonthKey(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, 'yyyy-MM');
}

/**
 * Gets the number of days between two dates.
 * 
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} Number of days
 */
export function getDaysBetween(startDate, endDate) {
    return differenceInDays(endDate, startDate);
}
