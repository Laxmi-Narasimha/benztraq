/**
 * Application Constants
 * 
 * Centralized configuration values and enumerations used throughout the application.
 * Following the principle of single source of truth for all constant values.
 * 
 * @module lib/constants
 */

/**
 * User roles enumeration.
 * Defines the hierarchy of access levels in the application.
 * 
 * @readonly
 * @enum {string}
 */
export const USER_ROLES = Object.freeze({
    VP: 'vp',
    DIRECTOR: 'director',
    ASM: 'asm',
});

/**
 * Manager roles that have elevated access to all data.
 * @type {string[]}
 */
export const MANAGER_ROLES = [USER_ROLES.VP, USER_ROLES.DIRECTOR];

/**
 * Document types enumeration.
 * 
 * @readonly
 * @enum {string}
 */
export const DOC_TYPES = Object.freeze({
    QUOTATION: 'quotation',
    SALES_ORDER: 'sales_order',
    INVOICE: 'invoice',
});

/**
 * Document type labels for display.
 * @type {Object<string, string>}
 */
export const DOC_TYPE_LABELS = Object.freeze({
    [DOC_TYPES.QUOTATION]: 'Quotation',
    [DOC_TYPES.SALES_ORDER]: 'Sales Order',
    [DOC_TYPES.INVOICE]: 'Invoice',
});

/**
 * Quotation status options.
 * 
 * @readonly
 * @enum {string}
 */
export const QUOTATION_STATUS = Object.freeze({
    DRAFT: 'draft',
    SENT: 'sent',
    WON: 'won',
    LOST: 'lost',
});

/**
 * Sales order status options.
 * 
 * @readonly
 * @enum {string}
 */
export const SALES_ORDER_STATUS = Object.freeze({
    OPEN: 'open',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled',
});

/**
 * Invoice status options.
 * 
 * @readonly
 * @enum {string}
 */
export const INVOICE_STATUS = Object.freeze({
    RECORDED: 'recorded',
});

/**
 * Extraction status for PDF processing.
 * 
 * @readonly
 * @enum {string}
 */
export const EXTRACTION_STATUS = Object.freeze({
    QUEUED: 'queued',
    PROCESSING: 'processing',
    NEEDS_REVIEW: 'needs_review',
    CONFIRMED: 'confirmed',
    FAILED: 'failed',
});

/**
 * Quote to Sales Order link methods.
 * 
 * @readonly
 * @enum {string}
 */
export const LINK_METHOD = Object.freeze({
    MANUAL: 'manual',
    AUTO: 'auto',
});

/**
 * Report types for AI-generated reports.
 * 
 * @readonly
 * @enum {string}
 */
export const REPORT_TYPES = Object.freeze({
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    SALESPERSON_SUMMARY: 'salesperson_summary',
    CUSTOMER_SUMMARY: 'customer_summary',
    EXECUTIVE_DIGEST: 'executive_digest',
});

/**
 * Report subject types.
 * 
 * @readonly
 * @enum {string}
 */
export const REPORT_SUBJECT_TYPES = Object.freeze({
    TEAM: 'team',
    SALESPERSON: 'salesperson',
    CUSTOMER: 'customer',
    REGION: 'region',
    PRODUCT: 'product',
});

/**
 * Seeded regions for the application.
 * These are pre-defined and cannot be deleted.
 * 
 * @type {string[]}
 */
export const SEEDED_REGIONS = Object.freeze([
    'Gurgaon',
    'Jaipur',
    'Maharashtra',
    'Chennai',
    'Indore',
    'Noida',
]);

/**
 * Product categories.
 * 
 * @readonly
 * @enum {string}
 */
export const PRODUCT_CATEGORIES = Object.freeze({
    PVC: 'pvc',
    WOODEN: 'wooden',
    HARDWARE: 'hardware',
    OTHER: 'other',
});

/**
 * Common Units of Measurement.
 * 
 * @type {string[]}
 */
export const UNITS_OF_MEASUREMENT = Object.freeze([
    'pcs',
    'kgs',
    'nos',
    'litres',
    'sets',
    'pairs',
    'meters',
    'sq.ft',
    'sq.m',
]);

/**
 * Date filter presets for quick selection.
 * 
 * @type {Array<{label: string, value: string}>}
 */
export const DATE_PRESETS = Object.freeze([
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 7 days', value: 'last_7_days' },
    { label: 'Last 30 days', value: 'last_30_days' },
    { label: 'This Month', value: 'this_month' },
    { label: 'Last Month', value: 'last_month' },
    { label: 'This Quarter', value: 'this_quarter' },
    { label: 'This Year', value: 'this_year' },
    { label: 'Last Year', value: 'last_year' },
    { label: 'Custom', value: 'custom' },
]);

/**
 * Supabase storage bucket names.
 * 
 * @readonly
 * @enum {string}
 */
export const STORAGE_BUCKETS = Object.freeze({
    DOCUMENTS: 'documents',
});

/**
 * Maximum file size for PDF uploads (50MB as per Supabase free tier).
 * @type {number}
 */
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

/**
 * Accepted file types for document upload.
 * @type {Object}
 */
export const ACCEPTED_FILE_TYPES = Object.freeze({
    'application/pdf': ['.pdf'],
});

/**
 * Quote to Sales Order matching window in days.
 * Used for auto-suggestions.
 * @type {number}
 */
export const QUOTE_MATCH_WINDOW_DAYS = 90;

/**
 * Number of months in a year (for target calculations).
 * @type {number}
 */
export const MONTHS_IN_YEAR = 12;

/**
 * Navigation items for the sidebar.
 * Grouped by section for better organization.
 * 
 * @type {Array<{title: string, items: Array<{title: string, href: string, icon: string, roles?: string[]}>}>}
 */
export const NAVIGATION_ITEMS = Object.freeze([
    {
        title: 'Overview',
        items: [
            { title: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
        ],
    },
    {
        title: 'Documents',
        items: [
            { title: 'Document Center', href: '/documents', icon: 'FileText' },
            { title: 'Upload Document', href: '/documents/upload', icon: 'Upload' },
        ],
    },
    {
        title: 'Analytics',
        items: [
            { title: 'Quote Comparison', href: '/comparison', icon: 'GitCompare' },
            { title: 'Customers', href: '/customers', icon: 'Users' },
            { title: 'Products', href: '/products', icon: 'Package' },
            { title: 'Regions', href: '/regions', icon: 'MapPin' },
        ],
    },
    {
        title: 'Management',
        items: [
            { title: 'Targets', href: '/targets', icon: 'Target' },
            { title: 'Reports', href: '/reports', icon: 'BarChart3' },
        ],
    },
    {
        title: 'Admin',
        items: [
            { title: 'Admin Panel', href: '/admin', icon: 'Shield', roles: [USER_ROLES.VP] },
            { title: 'Manage Users', href: '/admin/users', icon: 'Users', roles: [USER_ROLES.VP] },
            { title: 'Roles & Permissions', href: '/admin/roles', icon: 'Settings', roles: [USER_ROLES.VP] },
        ],
    },
    {
        title: 'Settings',
        items: [
            { title: 'Settings', href: '/settings', icon: 'Settings', roles: MANAGER_ROLES },
        ],
    },
]);

/**
 * Chart color palette for consistent styling.
 * @type {string[]}
 */
export const CHART_COLORS = Object.freeze([
    '#3B82F6', // blue-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#8B5CF6', // violet-500
    '#EC4899', // pink-500
    '#06B6D4', // cyan-500
    '#84CC16', // lime-500
]);
