'use client';

/**
 * Authentication Context Provider
 * 
 * Provides authentication state and user information throughout the application.
 * Follows the Context + Provider pattern for clean dependency injection.
 * 
 * @module providers/auth-provider
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { USER_ROLES, MANAGER_ROLES } from '@/lib/constants';

/**
 * @typedef {Object} UserProfile
 * @property {string} user_id - User's UUID
 * @property {string} full_name - User's full name
 * @property {'vp' | 'director' | 'asm'} role - User's role
 * @property {string | null} region_id - Associated region ID (for ASM)
 * @property {boolean} is_active - Whether user is active
 */

/**
 * @typedef {Object} AuthContextValue
 * @property {import('@supabase/supabase-js').User | null} user - Supabase user object
 * @property {UserProfile | null} profile - User's profile data
 * @property {boolean} isLoading - Whether auth state is being loaded
 * @property {boolean} isAuthenticated - Whether user is authenticated
 * @property {boolean} isManager - Whether user has manager privileges
 * @property {Function} signIn - Sign in function
 * @property {Function} signOut - Sign out function
 * @property {Function} refreshProfile - Refresh user profile
 */

const AuthContext = createContext(undefined);

/**
 * Hook to access authentication context.
 * 
 * @returns {AuthContextValue}
 * @throws {Error} If used outside of AuthProvider
 */
export function useAuth() {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}

/**
 * Authentication provider component.
 * Manages auth state and provides it to child components.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const supabase = createClient();

    /**
     * Fetches the user's profile from the database.
     */
    const fetchProfile = useCallback(async (userId) => {
        if (!supabase) return null;

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error in fetchProfile:', error);
            return null;
        }
    }, [supabase]);

    /**
     * Refreshes the current user's profile.
     */
    const refreshProfile = useCallback(async () => {
        if (user) {
            const profileData = await fetchProfile(user.id);
            setProfile(profileData);
        }
    }, [user, fetchProfile]);

    /**
     * Signs in a user with email and password.
     */
    const signIn = useCallback(async (email, password) => {
        if (!supabase) {
            return { success: false, error: 'Supabase not initialized' };
        }

        setIsLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, user: data.user };
        } catch (error) {
            return { success: false, error: 'An unexpected error occurred' };
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    /**
     * Signs out the current user.
     */
    const signOut = useCallback(async () => {
        if (!supabase) {
            return { success: false, error: 'Supabase not initialized' };
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.signOut();

            if (error) {
                console.error('Sign out error:', error);
                return { success: false, error: error.message };
            }

            setUser(null);
            setProfile(null);

            return { success: true };
        } catch (error) {
            return { success: false, error: 'An unexpected error occurred' };
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    // Initialize auth state on mount
    useEffect(() => {
        if (!supabase) {
            setIsLoading(false);
            return;
        }

        const initializeAuth = async () => {
            setIsLoading(true);

            try {
                // Get current session
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    setUser(session.user);
                    const profileData = await fetchProfile(session.user.id);
                    setProfile(profileData);
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();

        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session?.user) {
                    setUser(session.user);
                    const profileData = await fetchProfile(session.user.id);
                    setProfile(profileData);
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setProfile(null);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase, fetchProfile]);

    // Derived state
    const isAuthenticated = !!user && !!profile;
    const isManager = profile ? MANAGER_ROLES.includes(profile.role) : false;

    const value = {
        user,
        profile,
        isLoading,
        isAuthenticated,
        isManager,
        signIn,
        signOut,
        refreshProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
