// ============================================================================
// useRealtimeSubscription.js - Real-Time Supabase Subscription Hooks
// ============================================================================
// Provides hooks for subscribing to real-time database changes in the PWA.
// Handles visibility changes and reconnection automatically.
//
// Created: January 17, 2026
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useIsOnline } from './useOnlineStatus';

// ============================================================================
// GENERIC SUBSCRIPTION HOOK
// ============================================================================

/**
 * Generic hook for subscribing to real-time changes on a table
 * @param {Object} options - Subscription options
 * @param {string} options.table - Table name to subscribe to
 * @param {string} options.event - Event type: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
 * @param {Object} options.filter - Filter object (e.g., { column: 'factory_id', value: 'uuid' })
 * @param {Function} options.onInsert - Callback for INSERT events
 * @param {Function} options.onUpdate - Callback for UPDATE events
 * @param {Function} options.onDelete - Callback for DELETE events
 * @param {boolean} options.enabled - Whether subscription is enabled (default: true)
 * @returns {Object} { isSubscribed, error, unsubscribe }
 */
export function useRealtimeSubscription(options) {
  const {
    table,
    event = '*',
    filter,
    onInsert,
    onUpdate,
    onDelete,
    enabled = true
  } = options;

  const isOnline = useIsOnline();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState(null);
  const channelRef = useRef(null);
  const isMounted = useRef(true);

  // Handle real-time payload
  const handlePayload = useCallback((payload) => {
    if (!isMounted.current) return;

    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
        onInsert?.(newRecord);
        break;
      case 'UPDATE':
        onUpdate?.(newRecord, oldRecord);
        break;
      case 'DELETE':
        onDelete?.(oldRecord);
        break;
      default:
        // For '*' event, call all applicable handlers
        if (newRecord && !oldRecord) onInsert?.(newRecord);
        else if (newRecord && oldRecord) onUpdate?.(newRecord, oldRecord);
        else if (!newRecord && oldRecord) onDelete?.(oldRecord);
    }
  }, [onInsert, onUpdate, onDelete]);

  // Subscribe to channel
  const subscribe = useCallback(() => {
    if (!enabled || !isOnline || !table) return;

    // Clean up existing subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    try {
      // Build channel name
      const channelName = filter
        ? `${table}-${filter.column}-${filter.value}`
        : `${table}-all`;

      // Build subscription config
      const subscriptionConfig = {
        event,
        schema: 'public',
        table
      };

      // Add filter if provided
      if (filter) {
        subscriptionConfig.filter = `${filter.column}=eq.${filter.value}`;
      }

      // Create channel
      channelRef.current = supabase
        .channel(channelName)
        .on('postgres_changes', subscriptionConfig, handlePayload)
        .subscribe((status) => {
          if (!isMounted.current) return;

          if (status === 'SUBSCRIBED') {
            setIsSubscribed(true);
            setError(null);
            console.log(`[Realtime] Subscribed to ${table}`);
          } else if (status === 'CHANNEL_ERROR') {
            setIsSubscribed(false);
            setError(new Error(`Failed to subscribe to ${table}`));
            console.error(`[Realtime] Error subscribing to ${table}`);
          } else if (status === 'CLOSED') {
            setIsSubscribed(false);
          }
        });

    } catch (err) {
      console.error('[Realtime] Subscription error:', err);
      setError(err);
      setIsSubscribed(false);
    }
  }, [enabled, isOnline, table, event, filter, handlePayload]);

  // Unsubscribe from channel
  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setIsSubscribed(false);
    }
  }, []);

  // Handle visibility changes - pause when hidden, resume when visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden - unsubscribe to save resources
        unsubscribe();
      } else {
        // Page is visible - resubscribe
        subscribe();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [subscribe, unsubscribe]);

  // Set up subscription
  useEffect(() => {
    isMounted.current = true;

    if (enabled && isOnline && !document.hidden) {
      subscribe();
    }

    return () => {
      isMounted.current = false;
      unsubscribe();
    };
  }, [enabled, isOnline, subscribe, unsubscribe]);

  return {
    isSubscribed,
    error,
    unsubscribe,
    resubscribe: subscribe
  };
}

// ============================================================================
// TABLE-SPECIFIC HOOKS
// ============================================================================

/**
 * Subscribe to module changes for a factory
 * @param {string} factoryId - Factory UUID
 * @param {Function} onModuleChange - Callback (module, eventType) => void
 * @param {boolean} enabled - Whether to enable subscription
 * @returns {Object}
 */
export function useModulesSubscription(factoryId, onModuleChange, enabled = true) {
  return useRealtimeSubscription({
    table: 'modules',
    event: '*',
    filter: factoryId ? { column: 'factory_id', value: factoryId } : null,
    onInsert: (module) => onModuleChange?.(module, 'INSERT'),
    onUpdate: (module) => onModuleChange?.(module, 'UPDATE'),
    onDelete: (module) => onModuleChange?.(module, 'DELETE'),
    enabled: enabled && !!factoryId
  });
}

/**
 * Subscribe to station assignment changes
 * @param {string} factoryId - Factory UUID
 * @param {Function} onAssignmentChange - Callback (assignment, eventType) => void
 * @param {boolean} enabled - Whether to enable subscription
 * @returns {Object}
 */
export function useStationAssignmentsSubscription(factoryId, onAssignmentChange, enabled = true) {
  return useRealtimeSubscription({
    table: 'station_assignments',
    event: '*',
    filter: factoryId ? { column: 'factory_id', value: factoryId } : null,
    onInsert: (assignment) => onAssignmentChange?.(assignment, 'INSERT'),
    onUpdate: (assignment) => onAssignmentChange?.(assignment, 'UPDATE'),
    onDelete: (assignment) => onAssignmentChange?.(assignment, 'DELETE'),
    enabled: enabled && !!factoryId
  });
}

/**
 * Subscribe to QC record changes
 * @param {string} factoryId - Factory UUID
 * @param {Function} onQCChange - Callback (record, eventType) => void
 * @param {boolean} enabled - Whether to enable subscription
 * @returns {Object}
 */
export function useQCRecordsSubscription(factoryId, onQCChange, enabled = true) {
  return useRealtimeSubscription({
    table: 'qc_records',
    event: '*',
    filter: factoryId ? { column: 'factory_id', value: factoryId } : null,
    onInsert: (record) => onQCChange?.(record, 'INSERT'),
    onUpdate: (record) => onQCChange?.(record, 'UPDATE'),
    onDelete: (record) => onQCChange?.(record, 'DELETE'),
    enabled: enabled && !!factoryId
  });
}

/**
 * Subscribe to inventory receipt changes
 * @param {string} factoryId - Factory UUID
 * @param {Function} onReceiptChange - Callback (receipt, eventType) => void
 * @param {boolean} enabled - Whether to enable subscription
 * @returns {Object}
 */
export function useInventoryReceiptsSubscription(factoryId, onReceiptChange, enabled = true) {
  return useRealtimeSubscription({
    table: 'inventory_receipts',
    event: '*',
    filter: factoryId ? { column: 'factory_id', value: factoryId } : null,
    onInsert: (receipt) => onReceiptChange?.(receipt, 'INSERT'),
    onUpdate: (receipt) => onReceiptChange?.(receipt, 'UPDATE'),
    onDelete: (receipt) => onReceiptChange?.(receipt, 'DELETE'),
    enabled: enabled && !!factoryId
  });
}

/**
 * Subscribe to worker shift changes
 * @param {string} factoryId - Factory UUID
 * @param {Function} onShiftChange - Callback (shift, eventType) => void
 * @param {boolean} enabled - Whether to enable subscription
 * @returns {Object}
 */
export function useWorkerShiftsSubscription(factoryId, onShiftChange, enabled = true) {
  return useRealtimeSubscription({
    table: 'worker_shifts',
    event: '*',
    filter: factoryId ? { column: 'factory_id', value: factoryId } : null,
    onInsert: (shift) => onShiftChange?.(shift, 'INSERT'),
    onUpdate: (shift) => onShiftChange?.(shift, 'UPDATE'),
    onDelete: (shift) => onShiftChange?.(shift, 'DELETE'),
    enabled: enabled && !!factoryId
  });
}

// ============================================================================
// COMBINED SUBSCRIPTION HOOK
// ============================================================================

/**
 * Subscribe to multiple tables at once
 * @param {string} factoryId - Factory UUID
 * @param {Object} callbacks - Callbacks for each table
 * @param {boolean} enabled - Whether to enable subscriptions
 * @returns {Object}
 */
export function usePWASubscriptions(factoryId, callbacks = {}, enabled = true) {
  const {
    onModuleChange,
    onAssignmentChange,
    onQCChange,
    onReceiptChange,
    onShiftChange
  } = callbacks;

  const modules = useModulesSubscription(factoryId, onModuleChange, enabled && !!onModuleChange);
  const assignments = useStationAssignmentsSubscription(factoryId, onAssignmentChange, enabled && !!onAssignmentChange);
  const qcRecords = useQCRecordsSubscription(factoryId, onQCChange, enabled && !!onQCChange);
  const receipts = useInventoryReceiptsSubscription(factoryId, onReceiptChange, enabled && !!onReceiptChange);
  const shifts = useWorkerShiftsSubscription(factoryId, onShiftChange, enabled && !!onShiftChange);

  const isFullySubscribed = (
    (!onModuleChange || modules.isSubscribed) &&
    (!onAssignmentChange || assignments.isSubscribed) &&
    (!onQCChange || qcRecords.isSubscribed) &&
    (!onReceiptChange || receipts.isSubscribed) &&
    (!onShiftChange || shifts.isSubscribed)
  );

  const unsubscribeAll = () => {
    modules.unsubscribe();
    assignments.unsubscribe();
    qcRecords.unsubscribe();
    receipts.unsubscribe();
    shifts.unsubscribe();
  };

  const resubscribeAll = () => {
    modules.resubscribe();
    assignments.resubscribe();
    qcRecords.resubscribe();
    receipts.resubscribe();
    shifts.resubscribe();
  };

  return {
    isFullySubscribed,
    subscriptions: {
      modules,
      assignments,
      qcRecords,
      receipts,
      shifts
    },
    unsubscribeAll,
    resubscribeAll
  };
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  useRealtimeSubscription,
  useModulesSubscription,
  useStationAssignmentsSubscription,
  useQCRecordsSubscription,
  useInventoryReceiptsSubscription,
  useWorkerShiftsSubscription,
  usePWASubscriptions
};
