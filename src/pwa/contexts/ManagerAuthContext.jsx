// ============================================================================
// ManagerAuthContext.jsx - Manager Authentication Context for PWA
// ============================================================================
// Provides Supabase-based authentication for management roles (PM, PC, VP, Director).
// Unlike WorkerAuthContext which uses PIN auth, this uses email/password via Supabase Auth.
//
// Created: January 17, 2026
// ============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../utils/supabaseClient';

// ============================================================================
// CONSTANTS
// ============================================================================

// Roles that can access the manager app (case-insensitive comparison)
// Database uses various formats: "Project Manager", Project_Manager, PM, etc.
const ALLOWED_ROLES = [
  'pm',
  'project manager',   // Database format with space
  'project_manager',   // Underscore variant
  'pc',
  'project coordinator',
  'project_coordinator',
  'vp',
  'director',
  'admin',
  'it',
  'it_manager',
  'it manager',
  'plant_gm',
  'plant gm',
  'production_manager',
  'production manager'
];
const SESSION_KEY = 'manager_session';

// ============================================================================
// CONTEXT
// ============================================================================

const ManagerAuthContext = createContext(null);

// ============================================================================
// PROVIDER
// ============================================================================

export function ManagerAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const subscriptionRef = useRef(null);
  const initializingRef = useRef(false);

  // ==========================================================================
  // INITIALIZE - Check for existing session on mount
  // ==========================================================================
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      if (initializingRef.current) return;
      initializingRef.current = true;

      try {
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.warn('[ManagerAuth] Session check failed:', sessionError.message);
          if (isMounted) setLoading(false);
          return;
        }

        if (data?.session?.user && isMounted) {
          await fetchUserDetails(data.session.user.id);
        } else if (isMounted) {
          setLoading(false);
        }
      } catch (err) {
        console.error('[ManagerAuth] Init error:', err);
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Set up auth state listener
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[ManagerAuth] State change:', event);

      if (session?.user && isMounted) {
        await fetchUserDetails(session.user.id);
      } else if (isMounted && event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });
    subscriptionRef.current = data?.subscription;

    return () => {
      isMounted = false;
      initializingRef.current = false;
      subscriptionRef.current?.unsubscribe();
    };
  }, []);

  // ==========================================================================
  // FETCH USER DETAILS
  // ==========================================================================
  const fetchUserDetails = async (userId) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      // Check if user has an allowed role
      const userRole = data.role?.toLowerCase();
      if (!ALLOWED_ROLES.includes(userRole)) {
        console.warn('[ManagerAuth] User role not allowed for manager app:', userRole);
        setError('Your role does not have access to the manager app');
        await supabase.auth.signOut();
        setUser(null);
        return;
      }

      setUser(data);
      setError(null);

      // Store session indicator
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        userId: data.id,
        role: data.role,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.error('[ManagerAuth] Error fetching user:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // LOGIN
  // ==========================================================================
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      // Fetch user details to verify role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError) throw userError;

      // Check role
      const userRole = userData.role?.toLowerCase();
      if (!ALLOWED_ROLES.includes(userRole)) {
        await supabase.auth.signOut();
        throw new Error('Your role does not have access to the manager app');
      }

      setUser(userData);

      // Store session
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        userId: userData.id,
        role: userData.role,
        timestamp: Date.now()
      }));

      return { success: true, user: userData };
    } catch (err) {
      const errorMsg = err.message || 'Login failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================================================
  // LOGOUT
  // ==========================================================================
  const logout = useCallback(async () => {
    setLoading(true);

    try {
      await supabase.auth.signOut();
      setUser(null);
      setError(null);
      localStorage.removeItem(SESSION_KEY);
      return { success: true };
    } catch (err) {
      console.error('[ManagerAuth] Logout error:', err);
      // Still clear local state
      setUser(null);
      localStorage.removeItem(SESSION_KEY);
      return { success: true };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================================================
  // ROLE CHECKS
  // ==========================================================================
  const hasRole = useCallback((roles) => {
    if (!user?.role) return false;
    const userRole = user.role.toLowerCase();
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.some(r => r.toLowerCase() === userRole);
  }, [user]);

  const canViewAllProjects = useCallback(() => {
    return hasRole(['vp', 'director', 'admin']);
  }, [hasRole]);

  const canViewAllFactories = useCallback(() => {
    return hasRole(['vp', 'director', 'admin']);
  }, [hasRole]);

  // ==========================================================================
  // CONTEXT VALUE
  // ==========================================================================
  const value = {
    // State
    user,
    loading,
    error,
    isAuthenticated: !!user,

    // Computed
    userId: user?.id || null,
    userRole: user?.role?.toLowerCase() || null,
    userName: user?.name || '',
    userEmail: user?.email || '',
    factoryCode: user?.factory || null,

    // Role checks (handle both short and database formats)
    isPM: hasRole(['pm', 'project manager', 'project_manager']),
    isPC: hasRole(['pc', 'project coordinator', 'project_coordinator']),
    isVP: hasRole('vp'),
    isDirector: hasRole('director'),
    isAdmin: hasRole('admin'),
    isPlantGM: hasRole(['plant_gm', 'plant gm']),
    isProductionManager: hasRole(['production_manager', 'production manager']),
    canViewAllProjects: canViewAllProjects(),
    canViewAllFactories: canViewAllFactories(),

    // Methods
    login,
    logout,
    hasRole,
    clearError: () => setError(null)
  };

  return (
    <ManagerAuthContext.Provider value={value}>
      {children}
    </ManagerAuthContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useManagerAuth() {
  const context = useContext(ManagerAuthContext);

  if (!context) {
    throw new Error('useManagerAuth must be used within a ManagerAuthProvider');
  }

  return context;
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default ManagerAuthContext;
