// ============================================================================
// useOnlineStatus.js - Online/Offline Status Hook
// ============================================================================
// Provides reactive online/offline status with debouncing to avoid
// flickering during brief connectivity changes.
//
// Created: January 17, 2026
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';

// Debounce time to avoid flickering (ms)
const DEBOUNCE_MS = 2000;

/**
 * Hook to track online/offline status
 * @param {Object} options - Hook options
 * @param {number} options.debounceMs - Debounce delay for status changes
 * @param {Function} options.onOnline - Callback when coming online
 * @param {Function} options.onOffline - Callback when going offline
 * @returns {Object} { isOnline, wasOffline, offlineDuration }
 */
export function useOnlineStatus(options = {}) {
  const {
    debounceMs = DEBOUNCE_MS,
    onOnline,
    onOffline
  } = options;

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [offlineSince, setOfflineSince] = useState(null);

  const debounceTimer = useRef(null);
  const wasOfflineTimer = useRef(null);

  // Calculate offline duration in minutes
  const offlineDuration = offlineSince
    ? Math.floor((Date.now() - offlineSince) / 60000)
    : 0;

  // Handle online event with debounce
  const handleOnline = useCallback(() => {
    // Clear any pending offline timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }

    // Debounce the online event to avoid flickering
    debounceTimer.current = setTimeout(() => {
      setIsOnline(true);

      // Set wasOffline flag briefly to show reconnection message
      if (offlineSince) {
        setWasOffline(true);
        setOfflineSince(null);

        // Clear wasOffline flag after a few seconds
        wasOfflineTimer.current = setTimeout(() => {
          setWasOffline(false);
        }, 5000);
      }

      if (onOnline) {
        onOnline();
      }
    }, debounceMs);
  }, [debounceMs, onOnline, offlineSince]);

  // Handle offline event with debounce
  const handleOffline = useCallback(() => {
    // Clear any pending online timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }

    // Debounce the offline event
    debounceTimer.current = setTimeout(() => {
      setIsOnline(false);
      setOfflineSince(Date.now());

      if (onOffline) {
        onOffline();
      }
    }, debounceMs);
  }, [debounceMs, onOffline]);

  // Set up event listeners
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    if (!navigator.onLine) {
      setIsOnline(false);
      setOfflineSince(Date.now());
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (wasOfflineTimer.current) {
        clearTimeout(wasOfflineTimer.current);
      }
    };
  }, [handleOnline, handleOffline]);

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
    offlineDuration,
    offlineSince
  };
}

/**
 * Simple hook that just returns online status
 * @returns {boolean}
 */
export function useIsOnline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  return isOnline;
}

export default useOnlineStatus;
