/**
 * Role-Based Access Control (RBAC) Utilities
 * 
 * Centralized module for all role and permission management.
 * This is the SINGLE SOURCE OF TRUTH for the user hierarchy.
 * 
 * HIERARCHY:
 * - Developer (1): Laxmi - Full system access
 * - Director (3): Manan Chopra, Chaitanya Chopra, Prashansa Madan - Full access to both companies
 * - Head of Sales (2): Pulak Biswas (Benz), Lokesh (Ergopack) - Company-specific access
 * - ASM (6): Madhya Pradesh, Rajasthan, Karnataka, Maharashtra, Noida, West Zone - Region-specific access
 * 
 * @module lib/utils/rbac
 */

// ============================================================================
// USER DEFINITIONS - SINGLE SOURCE OF TRUTH
// ============================================================================

/**
 * Complete list of all system users with their roles and access
 */
export const SYSTEM_USERS = {
    // Developer - Full system access
    DEVELOPERS: [
        { name: 'Laxmi', email: 'laxmi@benz-packaging.com', companies: ['benz', 'ergopack'] }
    ],

    // Directors - Full access to both companies
    DIRECTORS: [
        { name: 'Manan Chopra', email: 'manan@benz-packaging.com', companies: ['benz', 'ergopack'] },
        { name: 'Chaitanya Chopra', email: 'chaitanya@benz-packaging.com', companies: ['benz', 'ergopack'] },
        { name: 'Prashansa Madan', email: 'prashansa@benz-packaging.com', companies: ['benz', 'ergopack'] }
    ],

    // Head of Sales - Company-specific access
    HEAD_OF_SALES: [
        { name: 'Pulak Biswas', email: 'pulak@benz-packaging.com', companies: ['benz'] },
        { name: 'Lokesh', email: 'lokesh@benz-packaging.com', companies: ['ergopack'] }
    ],

    // Area Sales Managers - Region-based, Benz only
    ASMS: [
        { name: 'Madhya Pradesh', email: 'abhishek@benz-packaging.com', region: 'Madhya Pradesh', companies: ['benz'] },
        { name: 'Rajasthan', email: 'wh.jaipur@benz-packaging.com', region: 'Rajasthan', companies: ['benz'] },
        { name: 'Karnataka', email: 'banglore@benz-packaging.com', region: 'Karnataka', companies: ['benz'] },
        { name: 'Maharashtra', email: 'rfq@benz-packaging.com', region: 'Maharashtra', companies: ['benz'] },
        { name: 'Noida', email: 'it@benz-packaging.com', region: 'Noida', companies: ['benz'] },
        { name: 'West Zone', email: 'west@benz-packaging.com', region: 'West Zone', companies: ['benz'] }
    ]
};

/**
 * Get list of ASM names only (for filters)
 * NO Directors, NO Head of Sales
 */
export const ASM_NAMES = SYSTEM_USERS.ASMS.map(asm => asm.name);

/**
 * All manager roles that can see all data and set targets
 */
export const MANAGER_ROLES = ['developer', 'director', 'head_of_sales', 'head of sales', 'vp'];

/**
 * ASM role names
 */
export const ASM_ROLES = ['asm', 'area_sales_manager'];

// ============================================================================
// ROLE DETECTION FUNCTIONS
// ============================================================================

/**
 * Normalize role name to lowercase for comparison
 * @param {string} role - Role name from any source
 * @returns {string} Normalized lowercase role
 */
export function normalizeRole(role) {
    if (!role) return '';
    return String(role).toLowerCase().trim();
}

/**
 * Check if user is a developer
 * @param {string} role - User's role
 * @returns {boolean}
 */
export function isDeveloper(role) {
    return normalizeRole(role) === 'developer';
}

/**
 * Check if user is a director
 * @param {string} role - User's role
 * @returns {boolean}
 */
export function isDirector(role) {
    return normalizeRole(role) === 'director';
}

/**
 * Check if user is head of sales
 * @param {string} role - User's role
 * @returns {boolean}
 */
export function isHeadOfSales(role) {
    const normalized = normalizeRole(role);
    return normalized === 'head_of_sales' || normalized === 'head of sales';
}

/**
 * Check if user is an ASM
 * @param {string} role - User's role
 * @returns {boolean}
 */
export function isASM(role) {
    const normalized = normalizeRole(role);
    return ASM_ROLES.includes(normalized);
}

/**
 * Check if user is a manager (can see all data, set targets)
 * Includes: Developer, Director, Head of Sales, VP
 * @param {string} role - User's role
 * @returns {boolean}
 */
export function isManager(role) {
    const normalized = normalizeRole(role);
    return MANAGER_ROLES.includes(normalized);
}

// ============================================================================
// PERMISSION CHECKING FUNCTIONS
// ============================================================================

/**
 * Check if user can set targets
 * Only managers can set targets
 * @param {string} role - User's role
 * @returns {boolean}
 */
export function canSetTargets(role) {
    return isManager(role);
}

/**
 * Check if user can view all data
 * @param {string} role - User's role
 * @returns {boolean}
 */
export function canViewAllData(role) {
    return isManager(role);
}

/**
 * Check if user can manage users
 * Only developers and directors
 * @param {string} role - User's role
 * @returns {boolean}
 */
export function canManageUsers(role) {
    return isDeveloper(role) || isDirector(role);
}

/**
 * Check if user has access to a specific company
 * @param {string} role - User's role
 * @param {string} userName - User's full name
 * @param {string} company - Company to check ('benz' or 'ergopack')
 * @returns {boolean}
 */
export function hasCompanyAccess(role, userName, company) {
    // Developers and Directors have access to all companies
    if (isDeveloper(role) || isDirector(role)) {
        return true;
    }

    // Find the user in our definitions
    const allUsers = [
        ...SYSTEM_USERS.HEAD_OF_SALES,
        ...SYSTEM_USERS.ASMS
    ];

    const user = allUsers.find(u =>
        u.name.toLowerCase() === userName?.toLowerCase()
    );

    if (!user) {
        // Unknown user - default to Benz only for safety
        return company === 'benz';
    }

    return user.companies.includes(company);
}

// ============================================================================
// DATA FILTERING FUNCTIONS
// ============================================================================

/**
 * Get the list of ASM profiles to show in filters
 * STRICT: Only the 6 ASM region names, never Directors or Head of Sales
 * @param {Array} allProfiles - All profiles from database
 * @returns {Array} Filtered list of ASM profiles
 */
export function getASMsForFilter(allProfiles) {
    if (!Array.isArray(allProfiles)) {
        return [];
    }

    return allProfiles.filter(profile => {
        if (!profile || !profile.full_name) {
            return false;
        }
        return ASM_NAMES.includes(profile.full_name);
    });
}

/**
 * Get accessible data based on user's role
 * @param {string} role - User's role
 * @param {string} userId - User's ID
 * @param {string} userName - User's name
 * @returns {Object} Filter configuration
 */
export function getDataAccessFilter(role, userId, userName) {
    if (isManager(role)) {
        // Managers see all data
        return {
            filterByUser: false,
            filterByRegion: false,
            userId: null,
            regionName: null
        };
    }

    // ASMs only see their own data
    return {
        filterByUser: true,
        filterByRegion: true,
        userId: userId,
        regionName: userName // For ASMs, their name IS the region
    };
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate that a salesperson ID belongs to an ASM
 * Used when setting targets - can only set targets for ASMs
 * @param {string} salespersonName - Name of the salesperson
 * @returns {boolean}
 */
export function isValidTargetSalesperson(salespersonName) {
    return ASM_NAMES.includes(salespersonName);
}

/**
 * Validate year for targets (reasonable range)
 * @param {number} year - Year to validate
 * @returns {boolean}
 */
export function isValidYear(year) {
    const currentYear = new Date().getFullYear();
    return year >= currentYear - 1 && year <= currentYear + 2;
}

/**
 * Validate target amount (positive number)
 * @param {number} amount - Target amount
 * @returns {boolean}
 */
export function isValidTargetAmount(amount) {
    return typeof amount === 'number' && amount > 0 && amount < 1000000000; // Max 100 crore
}

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Create a standardized error response
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {number} status - HTTP status code
 * @returns {Object}
 */
export function createErrorResponse(message, code, status = 400) {
    return {
        success: false,
        error: message,
        errorCode: code,
        status
    };
}

/**
 * Create a standardized success response
 * @param {Object} data - Response data
 * @param {string} message - Success message
 * @returns {Object}
 */
export function createSuccessResponse(data, message = 'Success') {
    return {
        success: true,
        message,
        ...data
    };
}

// ============================================================================
// LOGGING UTILITIES
// ============================================================================

/**
 * Log API access for debugging
 * @param {string} apiName - Name of the API
 * @param {string} userId - User ID
 * @param {string} role - User's role
 * @param {Object} params - Request parameters
 */
export function logAPIAccess(apiName, userId, role, params = {}) {
    console.log(`[${apiName}] User: ${userId}, Role: ${role}, Params:`, JSON.stringify(params));
}

/**
 * Log API error for debugging
 * @param {string} apiName - Name of the API
 * @param {Error} error - The error
 * @param {Object} context - Additional context
 */
export function logAPIError(apiName, error, context = {}) {
    console.error(`[${apiName}] ERROR:`, error.message, 'Context:', JSON.stringify(context));
}

// ============================================================================
// EXPORT SUMMARY
// ============================================================================

export default {
    // User Definitions
    SYSTEM_USERS,
    ASM_NAMES,
    MANAGER_ROLES,
    ASM_ROLES,

    // Role Detection
    normalizeRole,
    isDeveloper,
    isDirector,
    isHeadOfSales,
    isASM,
    isManager,

    // Permissions
    canSetTargets,
    canViewAllData,
    canManageUsers,
    hasCompanyAccess,

    // Data Filtering
    getASMsForFilter,
    getDataAccessFilter,

    // Validation
    isValidTargetSalesperson,
    isValidYear,
    isValidTargetAmount,

    // Error Handling
    createErrorResponse,
    createSuccessResponse,

    // Logging
    logAPIAccess,
    logAPIError
};
