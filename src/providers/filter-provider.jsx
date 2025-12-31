'use client';

/**
 * Global Filter Context Provider
 * 
 * Manages dashboard filters that affect all views.
 * Provides consistent filtering across charts, tables, and reports.
 * 
 * @module providers/filter-provider
 */

import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { getDateRangeFromPreset, getMTDRange } from '@/lib/utils/dates';
import { format } from 'date-fns';

/**
 * @typedef {Object} FilterState
 * @property {Object} dateRange - Date range filter
 * @property {string | null} dateRange.from - Start date (ISO string)
 * @property {string | null} dateRange.to - End date (ISO string)
 * @property {string} dateRange.preset - Active preset name
 * @property {string | null} salespersonId - Selected salesperson ID
 * @property {string | null} regionId - Selected region ID
 * @property {string | null} customerId - Selected customer ID
 * @property {string | null} productId - Selected product ID
 */

/**
 * @typedef {Object} FilterContextValue
 * @property {FilterState} filters - Current filter state
 * @property {Function} setDateRange - Set date range filter
 * @property {Function} setDatePreset - Set date range from preset
 * @property {Function} setSalespersonId - Set salesperson filter
 * @property {Function} setRegionId - Set region filter
 * @property {Function} setCustomerId - Set customer filter
 * @property {Function} setProductId - Set product filter
 * @property {Function} clearFilters - Clear all filters
 * @property {Function} clearFilter - Clear a specific filter
 * @property {Object} filterParams - Formatted params for API queries
 */

const FilterContext = createContext(undefined);

/**
 * Get initial date range (current month to date by default).
 */
function getInitialDateRange() {
    const { from, to } = getMTDRange();
    return {
        from: format(from, 'yyyy-MM-dd'),
        to: format(to, 'yyyy-MM-dd'),
        preset: 'this_month',
    };
}

/**
 * Hook to access filter context.
 * 
 * @returns {FilterContextValue}
 * @throws {Error} If used outside of FilterProvider
 */
export function useFilters() {
    const context = useContext(FilterContext);

    if (context === undefined) {
        throw new Error('useFilters must be used within a FilterProvider');
    }

    return context;
}

/**
 * Filter provider component.
 * Manages global filter state for the dashboard.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export function FilterProvider({ children }) {
    // Initialize with default filters
    const [filters, setFilters] = useState({
        dateRange: getInitialDateRange(),
        salespersonId: null,
        regionId: null,
        customerId: null,
        productId: null,
    });

    /**
     * Sets the date range filter with custom dates.
     */
    const setDateRange = useCallback((from, to) => {
        setFilters((prev) => ({
            ...prev,
            dateRange: {
                from: from ? format(new Date(from), 'yyyy-MM-dd') : null,
                to: to ? format(new Date(to), 'yyyy-MM-dd') : null,
                preset: 'custom',
            },
        }));
    }, []);

    /**
     * Sets the date range from a preset.
     */
    const setDatePreset = useCallback((preset) => {
        const { from, to } = getDateRangeFromPreset(preset);
        setFilters((prev) => ({
            ...prev,
            dateRange: {
                from: format(from, 'yyyy-MM-dd'),
                to: format(to, 'yyyy-MM-dd'),
                preset,
            },
        }));
    }, []);

    /**
     * Sets the salesperson filter.
     */
    const setSalespersonId = useCallback((id) => {
        setFilters((prev) => ({
            ...prev,
            salespersonId: id || null,
        }));
    }, []);

    /**
     * Sets the region filter.
     */
    const setRegionId = useCallback((id) => {
        setFilters((prev) => ({
            ...prev,
            regionId: id || null,
        }));
    }, []);

    /**
     * Sets the customer filter.
     */
    const setCustomerId = useCallback((id) => {
        setFilters((prev) => ({
            ...prev,
            customerId: id || null,
        }));
    }, []);

    /**
     * Sets the product filter.
     */
    const setProductId = useCallback((id) => {
        setFilters((prev) => ({
            ...prev,
            productId: id || null,
        }));
    }, []);

    /**
     * Clears all filters to defaults.
     */
    const clearFilters = useCallback(() => {
        setFilters({
            dateRange: getInitialDateRange(),
            salespersonId: null,
            regionId: null,
            customerId: null,
            productId: null,
        });
    }, []);

    /**
     * Clears a specific filter.
     */
    const clearFilter = useCallback((filterName) => {
        if (filterName === 'dateRange') {
            setFilters((prev) => ({
                ...prev,
                dateRange: getInitialDateRange(),
            }));
        } else {
            setFilters((prev) => ({
                ...prev,
                [filterName]: null,
            }));
        }
    }, []);

    /**
     * Formatted filter parameters for API queries.
     * Memoized to prevent unnecessary re-renders.
     */
    const filterParams = useMemo(() => {
        const params = {};

        if (filters.dateRange.from) {
            params.date_from = filters.dateRange.from;
        }
        if (filters.dateRange.to) {
            params.date_to = filters.dateRange.to;
        }
        if (filters.salespersonId) {
            params.salesperson_id = filters.salespersonId;
        }
        if (filters.regionId) {
            params.region_id = filters.regionId;
        }
        if (filters.customerId) {
            params.customer_id = filters.customerId;
        }
        if (filters.productId) {
            params.product_id = filters.productId;
        }

        return params;
    }, [filters]);

    const value = {
        filters,
        setDateRange,
        setDatePreset,
        setSalespersonId,
        setRegionId,
        setCustomerId,
        setProductId,
        clearFilters,
        clearFilter,
        filterParams,
    };

    return (
        <FilterContext.Provider value={value}>
            {children}
        </FilterContext.Provider>
    );
}
