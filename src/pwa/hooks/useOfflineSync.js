// ============================================================================
// useOfflineSync.js - Offline Sync Hook
// ============================================================================
// Provides offline sync functionality to PWA components. Handles queuing
// actions for offline use and syncing when connectivity is restored.
//
// Created: January 17, 2026
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import syncManager, {
  syncAll,
  getStatus,
  retryFailed,
  addSyncListener,
  startOnlineListener,
  registerBackgroundSync
} from '../lib/syncManager';
import {
  addPendingAction,
  addPhotoToQueue,
  getPendingActionCounts,
  getMinutesSinceSync,
  getStorageEstimate,
  isStorageLow,
  ACTION_TYPES,
  SYNC_STATUS
} from '../lib/indexedDB';

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Hook for managing offline sync operations
 * @param {Object} options - Hook options
 * @param {boolean} options.autoSync - Auto-sync when online (default: true)
 * @param {number} options.syncInterval - Auto-sync interval in ms (default: 30000)
 * @returns {Object} Sync state and methods
 */
export function useOfflineSync(options = {}) {
  const {
    autoSync = true,
    syncInterval = 30000 // 30 seconds
  } = options;

  // Online status
  const { isOnline, wasOffline, offlineDuration } = useOnlineStatus({
    onOnline: () => {
      if (autoSync) {
        triggerSync();
      }
    }
  });

  // Sync state
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, error, complete
  const [pendingCounts, setPendingCounts] = useState({ pending: 0, failed: 0, total: 0 });
  const [lastSyncMinutes, setLastSyncMinutes] = useState(null);
  const [storageInfo, setStorageInfo] = useState({ usage: 0, quota: 0, percent: 0 });
  const [isStorageWarning, setIsStorageWarning] = useState(false);

  // Refs
  const syncIntervalRef = useRef(null);
  const isMounted = useRef(true);

  // ==========================================================================
  // STATUS UPDATES
  // ==========================================================================

  /**
   * Refresh sync status info
   */
  const refreshStatus = useCallback(async () => {
    if (!isMounted.current) return;

    try {
      const [counts, minutes, storage, lowStorage] = await Promise.all([
        getPendingActionCounts(),
        getMinutesSinceSync(),
        getStorageEstimate(),
        isStorageLow()
      ]);

      setPendingCounts(counts);
      setLastSyncMinutes(minutes);
      setStorageInfo(storage);
      setIsStorageWarning(lowStorage);
    } catch (err) {
      console.error('Error refreshing sync status:', err);
    }
  }, []);

  // ==========================================================================
  // SYNC OPERATIONS
  // ==========================================================================

  /**
   * Trigger a sync operation
   * @returns {Promise<Object>}
   */
  const triggerSync = useCallback(async () => {
    if (!isOnline) {
      return { success: false, reason: 'offline' };
    }

    setSyncStatus('syncing');

    try {
      const result = await syncAll();

      if (result.success) {
        setSyncStatus('complete');
        // Reset to idle after a brief moment
        setTimeout(() => {
          if (isMounted.current) {
            setSyncStatus('idle');
          }
        }, 2000);
      } else {
        setSyncStatus('error');
      }

      await refreshStatus();
      return result;

    } catch (err) {
      console.error('Sync error:', err);
      setSyncStatus('error');
      return { success: false, error: err.message };
    }
  }, [isOnline, refreshStatus]);

  /**
   * Retry failed actions
   * @returns {Promise<Object>}
   */
  const retryFailedActions = useCallback(async () => {
    setSyncStatus('syncing');
    const result = await retryFailed();
    await refreshStatus();
    setSyncStatus(result.success ? 'idle' : 'error');
    return result;
  }, [refreshStatus]);

  // ==========================================================================
  // ACTION QUEUEING
  // ==========================================================================

  /**
   * Queue a QC submission for offline sync
   * @param {Object} qcData - QC submission data
   * @param {Array<Object>} photos - Photo blobs with metadata
   * @returns {Promise<number>} Action ID
   */
  const queueQCSubmission = useCallback(async (qcData, photos = []) => {
    const actionId = await addPendingAction(ACTION_TYPES.QC_SUBMIT, qcData);

    // Queue photos
    for (const photo of photos) {
      await addPhotoToQueue(
        actionId,
        photo.blob,
        photo.filename || `qc_${Date.now()}.jpg`,
        photo.metadata || {}
      );
    }

    await refreshStatus();

    // Try to sync immediately if online
    if (isOnline) {
      triggerSync();
    } else {
      // Register for background sync
      registerBackgroundSync();
    }

    return actionId;
  }, [isOnline, refreshStatus, triggerSync]);

  /**
   * Queue a station move for offline sync
   * @param {Object} moveData - Station move data
   * @returns {Promise<number>} Action ID
   */
  const queueStationMove = useCallback(async (moveData) => {
    const actionId = await addPendingAction(ACTION_TYPES.STATION_MOVE, moveData);
    await refreshStatus();

    if (isOnline) {
      triggerSync();
    } else {
      registerBackgroundSync();
    }

    return actionId;
  }, [isOnline, refreshStatus, triggerSync]);

  /**
   * Queue an inventory receive for offline sync
   * @param {Object} receiveData - Inventory receive data
   * @param {Array<Object>} photos - Photo blobs with metadata
   * @returns {Promise<number>} Action ID
   */
  const queueInventoryReceive = useCallback(async (receiveData, photos = []) => {
    const actionId = await addPendingAction(ACTION_TYPES.INVENTORY_RECEIVE, receiveData);

    // Queue photos
    for (const photo of photos) {
      await addPhotoToQueue(
        actionId,
        photo.blob,
        photo.filename || `receipt_${Date.now()}.jpg`,
        photo.metadata || {}
      );
    }

    await refreshStatus();

    if (isOnline) {
      triggerSync();
    } else {
      registerBackgroundSync();
    }

    return actionId;
  }, [isOnline, refreshStatus, triggerSync]);

  /**
   * Queue a clock in/out action
   * @param {string} type - 'clock_in' or 'clock_out'
   * @param {Object} clockData - Clock data
   * @returns {Promise<number>} Action ID
   */
  const queueClockAction = useCallback(async (type, clockData) => {
    const actionType = type === 'clock_in' ? ACTION_TYPES.CLOCK_IN : ACTION_TYPES.CLOCK_OUT;
    const actionId = await addPendingAction(actionType, {
      ...clockData,
      timestamp: new Date().toISOString()
    });

    await refreshStatus();

    if (isOnline) {
      triggerSync();
    } else {
      registerBackgroundSync();
    }

    return actionId;
  }, [isOnline, refreshStatus, triggerSync]);

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  // Initialize and set up listeners
  useEffect(() => {
    isMounted.current = true;

    // Initial status refresh
    refreshStatus();

    // Set up sync status listener
    const unsubscribe = addSyncListener((status, counts) => {
      if (!isMounted.current) return;

      setSyncStatus(status);
      if (counts) {
        setPendingCounts(counts);
      }
    });

    // Start online listener for automatic sync
    if (autoSync) {
      startOnlineListener();
    }

    // Set up periodic sync when online
    if (autoSync && syncInterval > 0) {
      syncIntervalRef.current = setInterval(() => {
        if (navigator.onLine && isMounted.current) {
          triggerSync();
        }
      }, syncInterval);
    }

    // Register for background sync
    registerBackgroundSync();

    return () => {
      isMounted.current = false;
      unsubscribe();

      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [autoSync, syncInterval, refreshStatus, triggerSync]);

  // Refresh status periodically
  useEffect(() => {
    const interval = setInterval(refreshStatus, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [refreshStatus]);

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    // Status
    isOnline,
    isOffline: !isOnline,
    wasOffline,
    offlineDuration,
    syncStatus,
    pendingCounts,
    lastSyncMinutes,
    hasPendingActions: pendingCounts.total > 0,
    hasFailedActions: pendingCounts.failed > 0,

    // Storage
    storageInfo,
    isStorageWarning,

    // Actions
    triggerSync,
    retryFailedActions,
    refreshStatus,

    // Queue methods
    queueQCSubmission,
    queueStationMove,
    queueInventoryReceive,
    queueClockAction
  };
}

// ============================================================================
// SIMPLIFIED HOOKS
// ============================================================================

/**
 * Simple hook for just checking pending action count
 * @returns {number}
 */
export function usePendingCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const refresh = async () => {
      const counts = await getPendingActionCounts();
      setCount(counts.total);
    };

    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, []);

  return count;
}

/**
 * Hook for last sync time
 * @returns {number|null} Minutes since last sync
 */
export function useLastSync() {
  const [minutes, setMinutes] = useState(null);

  useEffect(() => {
    const refresh = async () => {
      const mins = await getMinutesSinceSync();
      setMinutes(mins);
    };

    refresh();
    const interval = setInterval(refresh, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

  return minutes;
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default useOfflineSync;
