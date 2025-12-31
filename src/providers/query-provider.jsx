'use client';

/**
 * React Query Provider
 * 
 * Wraps the application with TanStack Query context.
 * Provides data fetching, caching, and synchronization capabilities.
 * 
 * @module providers/query-provider
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

/**
 * Default query client configuration.
 * Optimized for a small internal team with weekly usage.
 */
const defaultQueryClientOptions = {
    defaultOptions: {
        queries: {
            // Stale time: 5 minutes (data considered fresh)
            staleTime: 5 * 60 * 1000,

            // Cache time: 30 minutes (keep data in cache)
            gcTime: 30 * 60 * 1000,

            // Retry failed requests up to 2 times
            retry: 2,

            // Don't refetch on window focus for internal app
            refetchOnWindowFocus: false,

            // Refetch on reconnect
            refetchOnReconnect: true,
        },
        mutations: {
            // Retry mutations once on failure
            retry: 1,
        },
    },
};

/**
 * QueryProvider component that wraps the application.
 * Creates a stable QueryClient instance per component lifecycle.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.ReactElement}
 */
export function QueryProvider({ children }) {
    // Create QueryClient instance once per component mount
    // Using useState ensures the same client is used across re-renders
    const [queryClient] = useState(() => new QueryClient(defaultQueryClientOptions));

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
