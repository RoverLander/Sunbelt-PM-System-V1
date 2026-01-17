// ============================================================================
// workerAuthService.js - Worker PWA Authentication Service
// ============================================================================
// Handles PIN-based authentication for factory floor workers via Edge Function.
// Workers are stored in the workers table, not Supabase Auth users table.
//
// Created: January 16, 2026
// ============================================================================

import { supabase } from '../utils/supabaseClient';

// Edge Function URL
const WORKER_AUTH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/worker-auth`;

// Local storage keys
const TOKEN_KEY = 'worker_session_token';
const WORKER_KEY = 'worker_session_data';
const EXPIRES_KEY = 'worker_session_expires';

// ============================================================================
// LOGIN / LOGOUT
// ============================================================================

/**
 * Authenticate a worker with employee ID and PIN
 *
 * @param {string} employeeId - Worker's employee ID (badge number)
 * @param {string} pin - 4-6 digit PIN
 * @param {string} factoryCode - Optional factory code to restrict login
 * @param {Object} deviceInfo - Optional device information
 * @returns {Promise<{success: boolean, worker: Object, error: string}>}
 */
export async function loginWorker(employeeId, pin, factoryCode = null, deviceInfo = null) {
  try {
    const url = `${WORKER_AUTH_URL}/login`;
    console.log('[workerAuthService] Login URL:', url);
    console.log('[workerAuthService] Attempting login for employee:', employeeId);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        employee_id: employeeId,
        pin: pin,
        factory_code: factoryCode,
        device_info: deviceInfo || {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          screenSize: `${window.screen.width}x${window.screen.height}`,
          language: navigator.language
        }
      })
    });

    console.log('[workerAuthService] Response status:', response.status);
    const data = await response.json();
    console.log('[workerAuthService] Response data:', data);

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Login failed',
        attemptsRemaining: data.attempts_remaining,
        locked: data.locked,
        lockedUntil: data.locked_until,
        minutesRemaining: data.minutes_remaining
      };
    }

    // Store session in localStorage
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(WORKER_KEY, JSON.stringify(data.worker));
    localStorage.setItem(EXPIRES_KEY, data.expires_at);

    return {
      success: true,
      worker: data.worker,
      expiresAt: data.expires_at
    };
  } catch (error) {
    console.error('Worker login error:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection.'
    };
  }
}

/**
 * Logout current worker session
 *
 * @returns {Promise<{success: boolean, error: string}>}
 */
export async function logoutWorker() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);

    if (token) {
      await fetch(`${WORKER_AUTH_URL}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        }
      });
    }

    // Clear local storage regardless of API response
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(WORKER_KEY);
    localStorage.removeItem(EXPIRES_KEY);

    return { success: true };
  } catch (error) {
    console.error('Worker logout error:', error);
    // Still clear local storage on error
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(WORKER_KEY);
    localStorage.removeItem(EXPIRES_KEY);
    return { success: true };
  }
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Get current worker session from localStorage
 *
 * @returns {Object|null} Worker data or null if not logged in
 */
export function getCurrentWorker() {
  const workerStr = localStorage.getItem(WORKER_KEY);
  const expiresAt = localStorage.getItem(EXPIRES_KEY);

  if (!workerStr || !expiresAt) {
    return null;
  }

  // Check if session expired
  if (new Date(expiresAt) <= new Date()) {
    logoutWorker();
    return null;
  }

  try {
    return JSON.parse(workerStr);
  } catch {
    return null;
  }
}

/**
 * Get current session token
 *
 * @returns {string|null} Session token or null
 */
export function getWorkerToken() {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiresAt = localStorage.getItem(EXPIRES_KEY);

  if (!token || !expiresAt) {
    return null;
  }

  // Check if session expired
  if (new Date(expiresAt) <= new Date()) {
    logoutWorker();
    return null;
  }

  return token;
}

/**
 * Check if worker is currently logged in
 *
 * @returns {boolean}
 */
export function isWorkerLoggedIn() {
  return getCurrentWorker() !== null;
}

/**
 * Verify session with server (use for important operations)
 *
 * @returns {Promise<{valid: boolean, error: string}>}
 */
export async function verifySession() {
  const token = getWorkerToken();

  if (!token) {
    return { valid: false, error: 'No session' };
  }

  try {
    const response = await fetch(`${WORKER_AUTH_URL}/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
      }
    });

    const data = await response.json();

    if (!response.ok || !data.valid) {
      // Session invalid - clear local storage
      logoutWorker();
      return { valid: false, error: data.error || 'Session invalid' };
    }

    return {
      valid: true,
      workerId: data.worker_id,
      factoryId: data.factory_id,
      isLead: data.is_lead,
      expiresAt: data.expires_at
    };
  } catch (error) {
    console.error('Session verification error:', error);
    return { valid: false, error: 'Network error' };
  }
}

/**
 * Get session time remaining
 *
 * @returns {Object} { valid: boolean, minutesRemaining: number, hoursRemaining: number }
 */
export function getSessionTimeRemaining() {
  const expiresAt = localStorage.getItem(EXPIRES_KEY);

  if (!expiresAt) {
    return { valid: false, minutesRemaining: 0, hoursRemaining: 0 };
  }

  const expires = new Date(expiresAt);
  const now = new Date();
  const msRemaining = expires.getTime() - now.getTime();

  if (msRemaining <= 0) {
    return { valid: false, minutesRemaining: 0, hoursRemaining: 0 };
  }

  return {
    valid: true,
    minutesRemaining: Math.floor(msRemaining / 60000),
    hoursRemaining: Math.floor(msRemaining / 3600000)
  };
}

// ============================================================================
// PIN MANAGEMENT (Manager Functions)
// ============================================================================

/**
 * Set or reset a worker's PIN (requires manager auth)
 *
 * @param {string} workerId - Worker UUID
 * @param {string} newPin - New 4-6 digit PIN
 * @returns {Promise<{success: boolean, message: string, error: string}>}
 */
export async function setWorkerPin(workerId, newPin) {
  try {
    // Get current Supabase session (manager must be logged in)
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { success: false, error: 'Manager authentication required' };
    }

    const response = await fetch(`${WORKER_AUTH_URL}/set-pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        worker_id: workerId,
        new_pin: newPin
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error };
    }

    return { success: true, message: data.message };
  } catch (error) {
    console.error('Set PIN error:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Check if a worker has a PIN set
 *
 * @param {string} workerId - Worker UUID
 * @returns {Promise<{hasPIN: boolean, error: string}>}
 */
export async function checkWorkerHasPIN(workerId) {
  try {
    const { data, error } = await supabase
      .from('workers')
      .select('pin_hash')
      .eq('id', workerId)
      .single();

    if (error) {
      return { hasPIN: false, error: error.message };
    }

    return { hasPIN: !!data?.pin_hash };
  } catch (error) {
    console.error('Check PIN error:', error);
    return { hasPIN: false, error: 'Network error' };
  }
}

/**
 * Get workers without PINs for a factory (manager view)
 *
 * @param {string} factoryId - Factory UUID
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getWorkersWithoutPIN(factoryId) {
  try {
    const { data, error } = await supabase
      .from('workers')
      .select('id, employee_id, first_name, last_name, full_name, is_lead, primary_station_id')
      .eq('factory_id', factoryId)
      .eq('is_active', true)
      .is('pin_hash', null)
      .order('last_name');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Get workers without PIN error:', error);
    return { data: [], error };
  }
}

/**
 * Unlock a locked worker account (manager function)
 *
 * @param {string} workerId - Worker UUID
 * @returns {Promise<{success: boolean, error: string}>}
 */
export async function unlockWorkerAccount(workerId) {
  try {
    const { error } = await supabase
      .from('workers')
      .update({
        pin_attempts: 0,
        pin_locked_until: null
      })
      .eq('id', workerId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Unlock account error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get locked worker accounts for a factory
 *
 * @param {string} factoryId - Factory UUID
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getLockedWorkers(factoryId) {
  try {
    const { data, error } = await supabase
      .from('workers')
      .select('id, employee_id, first_name, last_name, full_name, pin_locked_until, pin_attempts')
      .eq('factory_id', factoryId)
      .eq('is_active', true)
      .gt('pin_locked_until', new Date().toISOString())
      .order('pin_locked_until');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Get locked workers error:', error);
    return { data: [], error };
  }
}

// ============================================================================
// SESSION HISTORY (Admin Functions)
// ============================================================================

/**
 * Get recent sessions for a worker
 *
 * @param {string} workerId - Worker UUID
 * @param {number} limit - Max sessions to return
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getWorkerSessions(workerId, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('worker_sessions')
      .select('id, created_at, expires_at, last_activity, revoked_at, device_info, login_source, ip_address')
      .eq('worker_id', workerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Get worker sessions error:', error);
    return { data: [], error };
  }
}

/**
 * Revoke all sessions for a worker (force logout everywhere)
 *
 * @param {string} workerId - Worker UUID
 * @returns {Promise<{success: boolean, count: number, error: string}>}
 */
export async function revokeAllWorkerSessions(workerId) {
  try {
    const { data, error } = await supabase
      .from('worker_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('worker_id', workerId)
      .is('revoked_at', null)
      .select('id');

    if (error) throw error;
    return { success: true, count: data?.length || 0 };
  } catch (error) {
    console.error('Revoke sessions error:', error);
    return { success: false, count: 0, error: error.message };
  }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Login/Logout
  loginWorker,
  logoutWorker,

  // Session
  getCurrentWorker,
  getWorkerToken,
  isWorkerLoggedIn,
  verifySession,
  getSessionTimeRemaining,

  // PIN Management
  setWorkerPin,
  checkWorkerHasPIN,
  getWorkersWithoutPIN,
  unlockWorkerAccount,
  getLockedWorkers,

  // Session History
  getWorkerSessions,
  revokeAllWorkerSessions
};
