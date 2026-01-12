/**
 * Comprehensive Unit Tests for rbac.js
 * Tests Role-Based Access Control functions
 * 
 * CRITICAL: These tests verify the security logic of the application
 */

import { describe, it, expect } from 'vitest';
import {
    SYSTEM_USERS,
    ASM_NAMES,
    MANAGER_ROLES,
    normalizeRole,
    isDeveloper,
    isDirector,
    isHeadOfSales,
    isASM,
    isManager,
    canSetTargets,
    canViewAllData,
    canManageUsers,
    hasCompanyAccess,
    getASMsForFilter,
    getDataAccessFilter,
    isValidTargetSalesperson,
    isValidYear,
    isValidTargetAmount,
    createErrorResponse,
    createSuccessResponse,
} from './rbac';

describe('rbac.js - Role-Based Access Control', () => {
    // =========================================================================
    // SYSTEM USERS DEFINITION
    // =========================================================================
    describe('SYSTEM_USERS', () => {
        it('should have exactly 6 ASMs', () => {
            expect(SYSTEM_USERS.ASMS).toHaveLength(6);
        });

        it('should have ASM names matching regions', () => {
            const expectedNames = ['Madhya Pradesh', 'Rajasthan', 'Karnataka', 'Maharashtra', 'Noida', 'West Zone'];
            const actualNames = SYSTEM_USERS.ASMS.map(a => a.name);
            expect(actualNames).toEqual(expectedNames);
        });

        it('should have 3 directors', () => {
            expect(SYSTEM_USERS.DIRECTORS).toHaveLength(3);
        });

        it('should have 2 head of sales', () => {
            expect(SYSTEM_USERS.HEAD_OF_SALES).toHaveLength(2);
        });
    });

    // =========================================================================
    // normalizeRole
    // =========================================================================
    describe('normalizeRole', () => {
        it('should lowercase role', () => {
            expect(normalizeRole('DIRECTOR')).toBe('director');
        });

        it('should trim whitespace', () => {
            expect(normalizeRole('  director  ')).toBe('director');
        });

        it('should handle null', () => {
            expect(normalizeRole(null)).toBe('');
        });

        it('should handle undefined', () => {
            expect(normalizeRole(undefined)).toBe('');
        });
    });

    // =========================================================================
    // Role Detection Functions
    // =========================================================================
    describe('isDeveloper', () => {
        it('should return true for developer', () => {
            expect(isDeveloper('developer')).toBe(true);
            expect(isDeveloper('DEVELOPER')).toBe(true);
        });

        it('should return false for other roles', () => {
            expect(isDeveloper('director')).toBe(false);
            expect(isDeveloper('asm')).toBe(false);
        });
    });

    describe('isDirector', () => {
        it('should return true for director', () => {
            expect(isDirector('director')).toBe(true);
            expect(isDirector('Director')).toBe(true);
        });

        it('should return false for other roles', () => {
            expect(isDirector('developer')).toBe(false);
            expect(isDirector('asm')).toBe(false);
        });
    });

    describe('isHeadOfSales', () => {
        it('should return true for head_of_sales', () => {
            expect(isHeadOfSales('head_of_sales')).toBe(true);
        });

        it('should return true for head of sales (with space)', () => {
            expect(isHeadOfSales('head of sales')).toBe(true);
        });

        it('should return false for other roles', () => {
            expect(isHeadOfSales('director')).toBe(false);
        });
    });

    describe('isASM', () => {
        it('should return true for asm', () => {
            expect(isASM('asm')).toBe(true);
            expect(isASM('ASM')).toBe(true);
        });

        it('should return true for area_sales_manager', () => {
            expect(isASM('area_sales_manager')).toBe(true);
        });

        it('should return false for managers', () => {
            expect(isASM('director')).toBe(false);
            expect(isASM('developer')).toBe(false);
        });
    });

    describe('isManager', () => {
        it('should return true for developer', () => {
            expect(isManager('developer')).toBe(true);
        });

        it('should return true for director', () => {
            expect(isManager('director')).toBe(true);
        });

        it('should return true for head_of_sales', () => {
            expect(isManager('head_of_sales')).toBe(true);
            expect(isManager('head of sales')).toBe(true);
        });

        it('should return true for vp', () => {
            expect(isManager('vp')).toBe(true);
        });

        it('should return false for ASM', () => {
            expect(isManager('asm')).toBe(false);
        });
    });

    // =========================================================================
    // Permission Functions
    // =========================================================================
    describe('canSetTargets', () => {
        it('should allow managers to set targets', () => {
            expect(canSetTargets('director')).toBe(true);
            expect(canSetTargets('developer')).toBe(true);
            expect(canSetTargets('head_of_sales')).toBe(true);
        });

        it('should NOT allow ASMs to set targets', () => {
            expect(canSetTargets('asm')).toBe(false);
        });
    });

    describe('canViewAllData', () => {
        it('should allow managers to view all data', () => {
            expect(canViewAllData('director')).toBe(true);
            expect(canViewAllData('developer')).toBe(true);
        });

        it('should NOT allow ASMs to view all data', () => {
            expect(canViewAllData('asm')).toBe(false);
        });
    });

    describe('canManageUsers', () => {
        it('should allow developers to manage users', () => {
            expect(canManageUsers('developer')).toBe(true);
        });

        it('should allow directors to manage users', () => {
            expect(canManageUsers('director')).toBe(true);
        });

        it('should NOT allow head of sales to manage users', () => {
            expect(canManageUsers('head_of_sales')).toBe(false);
        });

        it('should NOT allow ASMs to manage users', () => {
            expect(canManageUsers('asm')).toBe(false);
        });
    });

    describe('hasCompanyAccess', () => {
        it('should give developers access to all companies', () => {
            expect(hasCompanyAccess('developer', 'Laxmi', 'benz')).toBe(true);
            expect(hasCompanyAccess('developer', 'Laxmi', 'ergopack')).toBe(true);
        });

        it('should give directors access to all companies', () => {
            expect(hasCompanyAccess('director', 'Manan Chopra', 'benz')).toBe(true);
            expect(hasCompanyAccess('director', 'Manan Chopra', 'ergopack')).toBe(true);
        });

        it('should limit head of sales to their company', () => {
            expect(hasCompanyAccess('head_of_sales', 'Pulak Biswas', 'benz')).toBe(true);
            expect(hasCompanyAccess('head_of_sales', 'Pulak Biswas', 'ergopack')).toBe(false);
        });

        it('should limit ASMs to Benz only', () => {
            expect(hasCompanyAccess('asm', 'Madhya Pradesh', 'benz')).toBe(true);
            expect(hasCompanyAccess('asm', 'Madhya Pradesh', 'ergopack')).toBe(false);
        });
    });

    // =========================================================================
    // Data Filtering Functions
    // =========================================================================
    describe('getASMsForFilter', () => {
        it('should filter to only ASM profiles', () => {
            const allProfiles = [
                { full_name: 'Madhya Pradesh', user_id: '1' },
                { full_name: 'Manan Chopra', user_id: '2' }, // Director - should be excluded
                { full_name: 'Rajasthan', user_id: '3' },
            ];
            const result = getASMsForFilter(allProfiles);
            expect(result).toHaveLength(2);
            expect(result.map(p => p.full_name)).toEqual(['Madhya Pradesh', 'Rajasthan']);
        });

        it('should return empty array for null input', () => {
            expect(getASMsForFilter(null)).toEqual([]);
        });

        it('should handle profiles without full_name', () => {
            const profiles = [{ user_id: '1' }];
            expect(getASMsForFilter(profiles)).toHaveLength(0);
        });
    });

    describe('getDataAccessFilter', () => {
        it('should not filter for managers', () => {
            const result = getDataAccessFilter('director', 'user123', 'Manan Chopra');
            expect(result.filterByUser).toBe(false);
            expect(result.filterByRegion).toBe(false);
        });

        it('should filter for ASMs', () => {
            const result = getDataAccessFilter('asm', 'user456', 'Madhya Pradesh');
            expect(result.filterByUser).toBe(true);
            expect(result.filterByRegion).toBe(true);
            expect(result.userId).toBe('user456');
            expect(result.regionName).toBe('Madhya Pradesh');
        });
    });

    // =========================================================================
    // Validation Functions
    // =========================================================================
    describe('isValidTargetSalesperson', () => {
        it('should return true for valid ASM names', () => {
            expect(isValidTargetSalesperson('Madhya Pradesh')).toBe(true);
            expect(isValidTargetSalesperson('Rajasthan')).toBe(true);
        });

        it('should return false for directors', () => {
            expect(isValidTargetSalesperson('Manan Chopra')).toBe(false);
        });

        it('should return false for random names', () => {
            expect(isValidTargetSalesperson('Random Person')).toBe(false);
        });
    });

    describe('isValidYear', () => {
        const currentYear = new Date().getFullYear();

        it('should allow current year', () => {
            expect(isValidYear(currentYear)).toBe(true);
        });

        it('should allow next year', () => {
            expect(isValidYear(currentYear + 1)).toBe(true);
        });

        it('should allow previous year', () => {
            expect(isValidYear(currentYear - 1)).toBe(true);
        });

        it('should reject very old years', () => {
            expect(isValidYear(2000)).toBe(false);
        });

        it('should reject far future years', () => {
            expect(isValidYear(currentYear + 10)).toBe(false);
        });
    });

    describe('isValidTargetAmount', () => {
        it('should allow valid amounts', () => {
            expect(isValidTargetAmount(1000000)).toBe(true);
            expect(isValidTargetAmount(50000000)).toBe(true);
        });

        it('should reject zero', () => {
            expect(isValidTargetAmount(0)).toBe(false);
        });

        it('should reject negative', () => {
            expect(isValidTargetAmount(-1000)).toBe(false);
        });

        it('should reject amounts over 100 crore', () => {
            expect(isValidTargetAmount(1000000001)).toBe(false);
        });

        it('should reject non-numbers', () => {
            expect(isValidTargetAmount('1000000')).toBe(false);
        });
    });

    // =========================================================================
    // Response Helpers
    // =========================================================================
    describe('createErrorResponse', () => {
        it('should create error response with default status', () => {
            const result = createErrorResponse('Something went wrong', 'ERR_001');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Something went wrong');
            expect(result.errorCode).toBe('ERR_001');
            expect(result.status).toBe(400);
        });

        it('should allow custom status', () => {
            const result = createErrorResponse('Not found', 'NOT_FOUND', 404);
            expect(result.status).toBe(404);
        });
    });

    describe('createSuccessResponse', () => {
        it('should create success response', () => {
            const result = createSuccessResponse({ data: 'test' }, 'Done');
            expect(result.success).toBe(true);
            expect(result.message).toBe('Done');
            expect(result.data).toBe('test');
        });

        it('should use default message', () => {
            const result = createSuccessResponse({ data: 'test' });
            expect(result.message).toBe('Success');
        });
    });
});
