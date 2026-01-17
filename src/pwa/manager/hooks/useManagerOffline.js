// ============================================================================
// useManagerOffline.js - Offline Support Hook for Manager PWA
// ============================================================================
// Provides read-only offline caching for manager data (projects, tasks, RFIs).
// Uses localStorage for simple caching since managers have smaller data sets
// compared to floor workers.
//
// Created: January 17, 2026
// Phase 6 Implementation
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// CONSTANTS
// ============================================================================

const CACHE_KEYS = {
  PROJECTS: 'manager_projects',
  TASKS: 'manager_tasks',
  RFIS: 'manager_rfis',
  DASHBOARD_METRICS: 'manager_dashboard_metrics',
  LAST_SYNC: 'manager_last_sync'
};

const CACHE_EXPIRY_MINUTES = 30; // Cache expires after 30 minutes

// ============================================================================
// CACHE UTILITIES
// ============================================================================

/**
 * Get cached data from localStorage
 * @param {string} key - Cache key
 * @returns {Object|null} - Cached data or null if expired/missing
 */
function getCachedData(key) {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const ageMinutes = (Date.now() - timestamp) / 60000;

    // Return null if cache is expired
    if (ageMinutes > CACHE_EXPIRY_MINUTES) {
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch (err) {
    console.error('[useManagerOffline] Cache read error:', err);
    return null;
  }
}

/**
 * Set cached data in localStorage
 * @param {string} key - Cache key
 * @param {*} data - Data to cache
 */
function setCachedData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (err) {
    console.error('[useManagerOffline] Cache write error:', err);
    // If storage is full, clear old manager caches
    if (err.name === 'QuotaExceededError') {
      clearManagerCache();
    }
  }
}

/**
 * Clear all manager caches
 */
function clearManagerCache() {
  Object.values(CACHE_KEYS).forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Ignore errors during cleanup
    }
  });
}

/**
 * Get last sync timestamp
 * @returns {number|null}
 */
function getLastSyncTime() {
  try {
    const time = localStorage.getItem(CACHE_KEYS.LAST_SYNC);
    return time ? parseInt(time, 10) : null;
  } catch {
    return null;
  }
}

/**
 * Set last sync timestamp
 */
function setLastSyncTime() {
  try {
    localStorage.setItem(CACHE_KEYS.LAST_SYNC, Date.now().toString());
  } catch (e) {
    // Ignore errors
  }
}

/**
 * Get minutes since last sync
 * @returns {number|null}
 */
function getMinutesSinceSync() {
  const lastSync = getLastSyncTime();
  if (!lastSync) return null;
  return Math.floor((Date.now() - lastSync) / 60000);
}

// ============================================================================
// HOOK: useManagerOffline
// ============================================================================

/**
 * Hook for managing offline data caching in Manager PWA
 * @returns {Object} - Cache utilities and state
 */
export function useManagerOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState(getLastSyncTime());

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ==========================================================================
  // CACHE OPERATIONS
  // ==========================================================================

  const cacheProjects = useCallback((projects) => {
    setCachedData(CACHE_KEYS.PROJECTS, projects);
    setLastSyncTime();
    setLastSync(Date.now());
  }, []);

  const getCachedProjects = useCallback(() => {
    return getCachedData(CACHE_KEYS.PROJECTS);
  }, []);

  const cacheTasks = useCallback((tasks) => {
    setCachedData(CACHE_KEYS.TASKS, tasks);
  }, []);

  const getCachedTasks = useCallback(() => {
    return getCachedData(CACHE_KEYS.TASKS);
  }, []);

  const cacheRFIs = useCallback((rfis) => {
    setCachedData(CACHE_KEYS.RFIS, rfis);
  }, []);

  const getCachedRFIs = useCallback(() => {
    return getCachedData(CACHE_KEYS.RFIS);
  }, []);

  const cacheDashboardMetrics = useCallback((metrics) => {
    setCachedData(CACHE_KEYS.DASHBOARD_METRICS, metrics);
  }, []);

  const getCachedDashboardMetrics = useCallback(() => {
    return getCachedData(CACHE_KEYS.DASHBOARD_METRICS);
  }, []);

  const clearCache = useCallback(() => {
    clearManagerCache();
    setLastSync(null);
  }, []);

  // ==========================================================================
  // SYNC STATUS
  // ==========================================================================

  const minutesSinceSync = getMinutesSinceSync();
  const isStale = minutesSinceSync !== null && minutesSinceSync > 15;

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    // Online status
    isOnline,
    isOffline: !isOnline,

    // Sync status
    lastSync,
    minutesSinceSync,
    isStale,

    // Projects cache
    cacheProjects,
    getCachedProjects,

    // Tasks cache
    cacheTasks,
    getCachedTasks,

    // RFIs cache
    cacheRFIs,
    getCachedRFIs,

    // Dashboard metrics cache
    cacheDashboardMetrics,
    getCachedDashboardMetrics,

    // Clear cache
    clearCache
  };
}

// ============================================================================
// HOOK: useCachedData
// ============================================================================

/**
 * Hook for fetching data with offline fallback
 * @param {Function} fetchFn - Async function to fetch fresh data
 * @param {Function} getCacheFn - Function to get cached data
 * @param {Function} setCacheFn - Function to set cached data
 * @param {Array} deps - Dependencies for refetching
 * @returns {Object} - { data, loading, error, isFromCache, refresh }
 */
export function useCachedData(fetchFn, getCacheFn, setCacheFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const isOnline = navigator.onLine;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    // If offline, try cache first
    if (!isOnline) {
      const cached = getCacheFn();
      if (cached) {
        setData(cached);
        setIsFromCache(true);
        setLoading(false);
        return;
      }
      setError('You are offline and no cached data is available');
      setLoading(false);
      return;
    }

    // Online - fetch fresh data
    try {
      const freshData = await fetchFn();
      setData(freshData);
      setIsFromCache(false);

      // Cache the fresh data
      if (setCacheFn && freshData) {
        setCacheFn(freshData);
      }
    } catch (err) {
      console.error('[useCachedData] Fetch error:', err);

      // Fall back to cache on error
      const cached = getCacheFn();
      if (cached) {
        setData(cached);
        setIsFromCache(true);
        setError('Using cached data due to network error');
      } else {
        setError(err.message || 'Failed to fetch data');
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFn, getCacheFn, setCacheFn, isOnline]);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...deps]);

  return {
    data,
    loading,
    error,
    isFromCache,
    refresh: fetchData
  };
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  useManagerOffline,
  useCachedData,
  CACHE_KEYS,
  getCachedData,
  setCachedData,
  clearManagerCache,
  getLastSyncTime,
  getMinutesSinceSync
};
