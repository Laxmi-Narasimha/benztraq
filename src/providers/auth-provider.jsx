/**
 * Auth Provider - BENZTRAQ
 * 
 * Provides authentication context using custom JWT tokens.
 * Handles login, logout, and session management.
 * 
 * @module providers/auth-provider
 */

'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext({
    user: null,
    profile: null, // Alias for backwards compatibility
    isLoading: true,
    isAuthenticated: false,
    permissions: {},
    signIn: async () => ({ success: false }),
    signOut: async () => { },
    hasPermission: () => false,
    refreshSession: async () => { },
    isManager: false,
});

/**
 * Custom hook to access auth context
 * @returns {Object} Auth context value
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

/**
 * Auth Provider Component
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [permissions, setPermissions] = useState({});
    const router = useRouter();
    const pathname = usePathname();

    /**
     * Check session on mount and refresh - fetch fresh permissions from server
     */
    const refreshSession = useCallback(async () => {
        try {
            // First check localStorage for cached user (quick UI)
            const cachedUser = localStorage.getItem('benztraq_user');
            if (cachedUser && isLoading) {
                const parsed = JSON.parse(cachedUser);
                setUser(parsed);
                setPermissions(parsed.permissions || {});
            }

            // Then verify with server and get fresh permissions
            const response = await fetch('/api/auth/session');
            const data = await response.json();

            if (data.authenticated && data.user) {
                setUser(data.user);
                setPermissions(data.user.permissions || {});
                localStorage.setItem('benztraq_user', JSON.stringify(data.user));
            } else {
                // Clear stale data
                setUser(null);
                setPermissions({});
                localStorage.removeItem('benztraq_user');
            }
        } catch (error) {
            console.error('Session refresh error:', error);
            // Don't clear user on network error to allow offline access
        } finally {
            setIsLoading(false);
        }
    }, [isLoading]);

    // Initial session check
    useEffect(() => {
        refreshSession();
    }, []);

    // Refresh permissions on route change (real-time updates)
    useEffect(() => {
        if (!isLoading && user) {
            // Quietly refresh session to get updated permissions
            fetch('/api/auth/session')
                .then(res => res.json())
                .then(data => {
                    if (data.authenticated && data.user) {
                        setUser(data.user);
                        setPermissions(data.user.permissions || {});
                        localStorage.setItem('benztraq_user', JSON.stringify(data.user));
                    }
                })
                .catch(console.error);
        }
    }, [pathname]);

    /**
     * Sign in with email and password
     */
    const signIn = useCallback(async (email, password) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setUser(data.user);
                setPermissions(data.user.permissions || {});
                localStorage.setItem('benztraq_user', JSON.stringify(data.user));
                return { success: true, user: data.user };
            } else {
                return { success: false, error: data.error || 'Login failed' };
            }
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: 'An error occurred during sign in' };
        }
    }, []);

    /**
     * Sign out
     */
    const signOut = useCallback(async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Sign out error:', error);
        } finally {
            setUser(null);
            setPermissions({});
            localStorage.removeItem('benztraq_user');
            router.push('/login');
        }
    }, [router]);

    /**
     * Check if user has a specific permission
     */
    const hasPermission = useCallback((resource, action = 'read') => {
        if (!permissions[resource]) return false;
        return permissions[resource][action] === true;
    }, [permissions]);

    /**
     * Get permission scope for a resource
     */
    const getScope = useCallback((resource) => {
        return permissions[resource]?.scope || 'none';
    }, [permissions]);

    // Role helpers
    const isDeveloper = user?.role === 'developer';
    const isDirector = user?.role === 'director';
    const isHeadOfSales = user?.role === 'head_of_sales';
    const isASM = user?.role === 'asm';
    const isManager = isDeveloper || isDirector || isHeadOfSales;

    // Create profile object for backwards compatibility with sidebar
    const profile = useMemo(() => {
        if (!user) return null;
        return {
            id: user.id,
            user_id: user.id,
            full_name: user.fullName,
            fullName: user.fullName,
            email: user.email,
            // Pass actual role name for proper RBAC checks
            role: user.role,
            designation: user.designation,
        };
    }, [user]);

    const value = {
        user,
        profile, // Backwards compatibility
        isLoading,
        isAuthenticated: !!user,
        permissions,
        signIn,
        signOut,
        hasPermission,
        getScope,
        refreshSession,
        isDeveloper,
        isDirector,
        isHeadOfSales,
        isASM,
        isManager,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;

