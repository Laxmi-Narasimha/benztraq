'use client';

/**
 * Root Providers Wrapper
 * 
 * Combines all context providers into a single component.
 * Ensures proper nesting order for provider dependencies.
 * 
 * @module providers/index
 */

import { QueryProvider } from './query-provider';
import { AuthProvider } from './auth-provider';
import { FilterProvider } from './filter-provider';
import { Toaster } from '@/components/ui/sonner';

/**
 * Root providers component.
 * Wraps the application with all necessary context providers.
 * 
 * Provider order (outermost to innermost):
 * 1. QueryProvider - Data fetching
 * 2. AuthProvider - Authentication
 * 3. FilterProvider - Dashboard filters
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export function Providers({ children }) {
    return (
        <QueryProvider>
            <AuthProvider>
                <FilterProvider>
                    {children}
                    <Toaster position="top-right" richColors />
                </FilterProvider>
            </AuthProvider>
        </QueryProvider>
    );
}
