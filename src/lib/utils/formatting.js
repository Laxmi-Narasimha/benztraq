/**
 * Formatting Utilities
 * 
 * Functions for formatting values for display throughout the application.
 * Includes currency, dates, numbers, and percentages.
 * 
 * @module lib/utils/formatting
 */

import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

/**
 * Default locale for INR currency formatting.
 * @type {string}
 */
const DEFAULT_LOCALE = 'en-IN';

/**
 * Formats a number as Indian Rupees (INR).
 * 
 * @param {number} amount - The amount to format
 * @param {Object} [options] - Formatting options
 * @param {boolean} [options.compact=false] - Use compact notation (e.g., ₹1.5L)
 * @param {number} [options.decimals=2] - Number of decimal places
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, options = {}) {
    const { compact = false, decimals = 2 } = options;

    if (typeof amount !== 'number' || isNaN(amount)) {
        return '₹0.00';
    }

    if (compact) {
        return formatCompactCurrency(amount);
    }

    return new Intl.NumberFormat(DEFAULT_LOCALE, {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(amount);
}

/**
 * Formats a large number in compact Indian notation.
 * Uses Lakhs (L) and Crores (Cr) for readability.
 * 
 * @param {number} amount - The amount to format
 * @returns {string} Compact formatted string
 */
export function formatCompactCurrency(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return '₹0';
    }

    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';

    if (absAmount >= 10000000) {
        // Crores (1Cr = 10,000,000)
        const crores = absAmount / 10000000;
        return `${sign}₹${crores.toFixed(2)}Cr`;
    }

    if (absAmount >= 100000) {
        // Lakhs (1L = 100,000)
        const lakhs = absAmount / 100000;
        return `${sign}₹${lakhs.toFixed(2)}L`;
    }

    if (absAmount >= 1000) {
        // Thousands
        const thousands = absAmount / 1000;
        return `${sign}₹${thousands.toFixed(1)}K`;
    }

    return `${sign}₹${absAmount.toFixed(0)}`;
}

/**
 * Formats a number with Indian locale separations.
 * 
 * @param {number} value - The number to format
 * @param {number} [decimals=0] - Number of decimal places
 * @returns {string} Formatted number string
 */
export function formatNumber(value, decimals = 0) {
    if (typeof value !== 'number' || isNaN(value)) {
        return '0';
    }

    return new Intl.NumberFormat(DEFAULT_LOCALE, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
}

/**
 * Formats a percentage value.
 * 
 * @param {number} value - The percentage value (0-100)
 * @param {number} [decimals=1] - Number of decimal places
 * @param {boolean} [includeSign=false] - Include + or - sign
 * @returns {string} Formatted percentage string
 */
export function formatPercent(value, decimals = 1, includeSign = false) {
    if (typeof value !== 'number' || isNaN(value)) {
        return '0%';
    }

    const rounded = value.toFixed(decimals);
    const sign = includeSign && value > 0 ? '+' : '';

    return `${sign}${rounded}%`;
}

/**
 * Formats a date for display.
 * 
 * @param {Date | string} date - The date to format
 * @param {string} [pattern='dd MMM yyyy'] - date-fns format pattern
 * @returns {string} Formatted date string
 */
export function formatDate(date, pattern = 'dd MMM yyyy') {
    if (!date) return '';

    let dateObj = date;

    if (typeof date === 'string') {
        dateObj = parseISO(date);
    }

    if (!isValid(dateObj)) {
        return '';
    }

    return format(dateObj, pattern);
}

/**
 * Formats a date with time.
 * 
 * @param {Date | string} date - The date to format
 * @returns {string} Formatted date-time string
 */
export function formatDateTime(date) {
    return formatDate(date, 'dd MMM yyyy, hh:mm a');
}

/**
 * Formats a date as relative time (e.g., "2 hours ago").
 * 
 * @param {Date | string} date - The date to format
 * @returns {string} Relative time string
 */
export function formatRelativeTime(date) {
    if (!date) return '';

    let dateObj = date;

    if (typeof date === 'string') {
        dateObj = parseISO(date);
    }

    if (!isValid(dateObj)) {
        return '';
    }

    return formatDistanceToNow(dateObj, { addSuffix: true });
}

/**
 * Formats a date range for display.
 * 
 * @param {Date | string} startDate - Start date
 * @param {Date | string} endDate - End date
 * @returns {string} Formatted date range string
 */
export function formatDateRange(startDate, endDate) {
    const start = formatDate(startDate, 'dd MMM yyyy');
    const end = formatDate(endDate, 'dd MMM yyyy');

    if (!start || !end) return '';
    if (start === end) return start;

    return `${start} - ${end}`;
}

/**
 * Formats a document number for display.
 * Returns a placeholder if not available.
 * 
 * @param {string | null} docNumber - The document number
 * @returns {string} Document number or placeholder
 */
export function formatDocNumber(docNumber) {
    return docNumber || 'N/A';
}

/**
 * Formats a user's initials from their full name.
 * 
 * @param {string} fullName - The full name
 * @returns {string} Initials (max 2 characters)
 */
export function formatInitials(fullName) {
    if (!fullName || typeof fullName !== 'string') {
        return '??';
    }

    const parts = fullName.trim().split(/\s+/);

    if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Truncates a string with ellipsis if it exceeds max length.
 * 
 * @param {string} text - The text to truncate
 * @param {number} [maxLength=50] - Maximum length before truncation
 * @returns {string} Truncated string
 */
export function truncateText(text, maxLength = 50) {
    if (!text || typeof text !== 'string') {
        return '';
    }

    if (text.length <= maxLength) {
        return text;
    }

    return `${text.substring(0, maxLength - 3)}...`;
}

/**
 * Formats a file size in bytes to human-readable format.
 * 
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes) {
    if (typeof bytes !== 'number' || bytes === 0) {
        return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    const base = 1024;
    const unitIndex = Math.floor(Math.log(bytes) / Math.log(base));
    const size = bytes / Math.pow(base, unitIndex);

    return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
}

/**
 * Formats a variance direction with proper label and styling info.
 * 
 * @param {'increase' | 'decrease' | 'same'} direction - The variance direction
 * @param {number} percent - The variance percentage
 * @returns {{label: string, colorClass: string, icon: string}}
 */
export function formatVarianceDirection(direction, percent) {
    const absPercent = Math.abs(percent);

    switch (direction) {
        case 'decrease':
            return {
                label: `${absPercent.toFixed(1)}% decrease`,
                colorClass: 'text-red-600',
                icon: 'TrendingDown',
            };
        case 'increase':
            return {
                label: `${absPercent.toFixed(1)}% increase`,
                colorClass: 'text-green-600',
                icon: 'TrendingUp',
            };
        default:
            return {
                label: 'No change',
                colorClass: 'text-gray-500',
                icon: 'Minus',
            };
    }
}
