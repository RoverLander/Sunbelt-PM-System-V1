// ============================================================================
// WorkerAuthContext.jsx - Worker Authentication Context for PWA
// ============================================================================
// Provides worker authentication state and methods throughout the PWA.
// Uses PIN-based authentication via Edge Function (not Supabase Auth).
//
// Created: January 17, 2026
// ============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  loginWorker,
  logoutWorker,
  getCurrentWorker,
  getWorkerToken,
  isWorkerLoggedIn,
  verifySession,
  getSessionTimeRemaining
} from '../../services/workerAuthService';

// ============================================================================
// CONTEXT
// ============================================================================

const WorkerAuthContext = createContext(null);

// ============================================================================
// PROVIDER
// ============================================================================

export function WorkerAuthProvider({ children }) {
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(null);

  // ==========================================================================
  // INITIALIZE - Check for existing session on mount
  // ==========================================================================
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentWorker = getCurrentWorker();

        if (currentWorker) {
          // Verify session is still valid with server
          const { valid } = await verifySession();

          if (valid) {
            setWorker(currentWorker);
            updateSessionTime();
          } else {
            // Session invalid - clear it
            await logoutWorker();
            setWorker(null);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // ==========================================================================
  // SESSION TIME TRACKING
  // ==========================================================================
  const updateSessionTime = useCallback(() => {
    const timeInfo = getSessionTimeRemaining();
    setSessionTimeRemaining(timeInfo);
  }, []);

  // Update session time every minute
  useEffect(() => {
    if (!worker) return;

    const interval = setInterval(updateSessionTime, 60000);
    return () => clearInterval(interval);
  }, [worker, updateSessionTime]);

  // ==========================================================================
  // LOGIN
  // ==========================================================================
  const login = useCallback(async (employeeId, pin, factoryCode = null) => {
    setLoading(true);
    setError(null);

    try {
      const result = await loginWorker(employeeId, pin, factoryCode);

      if (!result.success) {
        setError(result.error);
        return {
          success: false,
          error: result.error,
          attemptsRemaining: result.attemptsRemaining,
          locked: result.locked,
          lockedUntil: result.lockedUntil,
          minutesRemaining: result.minutesRemaining
        };
      }

      setWorker(result.worker);
      updateSessionTime();

      return {
        success: true,
        worker: result.worker
      };
    } catch (err) {
      const errorMsg = err.message || 'Login failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [updateSessionTime]);

  // ==========================================================================
  // LOGOUT
  // ==========================================================================
  const logout = useCallback(async () => {
    setLoading(true);

    try {
      await logoutWorker();
      setWorker(null);
      setSessionTimeRemaining(null);
      setError(null);
      return { success: true };
    } catch (err) {
      console.error('Logout error:', err);
      // Still clear local state even if API call fails
      setWorker(null);
      setSessionTimeRemaining(null);
      return { success: true };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================================================
  // REFRESH SESSION
  // ==========================================================================
  const refreshSession = useCallback(async () => {
    if (!worker) return { valid: false };

    try {
      const result = await verifySession();

      if (!result.valid) {
        // Session expired - force logout
        await logout();
        return { valid: false, error: result.error };
      }

      updateSessionTime();
      return { valid: true };
    } catch (err) {
      console.error('Session refresh error:', err);
      return { valid: false, error: err.message };
    }
  }, [worker, logout, updateSessionTime]);

  // ==========================================================================
  // CONTEXT VALUE
  // ==========================================================================
  const value = {
    // State
    worker,
    loading,
    error,
    isAuthenticated: !!worker,
    sessionTimeRemaining,

    // Computed
    factoryId: worker?.factory_id || null,
    isLead: worker?.is_lead || false,
    workerName: worker?.name || '',
    primaryStationId: worker?.primary_station?.id || null,

    // Methods
    login,
    logout,
    refreshSession,
    getToken: getWorkerToken,
    clearError: () => setError(null)
  };

  return (
    <WorkerAuthContext.Provider value={value}>
      {children}
    </WorkerAuthContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useWorkerAuth() {
  const context = useContext(WorkerAuthContext);

  if (!context) {
    throw new Error('useWorkerAuth must be used within a WorkerAuthProvider');
  }

  return context;
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default WorkerAuthContext;
