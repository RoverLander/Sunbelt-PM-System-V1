// ============================================================================
// useInterval Hook - Safe Interval with Automatic Cleanup
// ============================================================================
// Custom hook for setInterval with automatic cleanup on unmount.
// Prevents memory leaks from uncleaned intervals.
//
// Usage:
//   useInterval(() => fetchData(), 5000);        // Run every 5 seconds
//   useInterval(() => fetchData(), isActive ? 5000 : null); // Pause when inactive
//
// Based on DEBUG_TEST_GUIDE Phase 1.3 recommendations.
// Created: January 16, 2026
// ============================================================================

import { useEffect, useRef } from 'react';

/**
 * Custom hook for setInterval with automatic cleanup
 * @param {Function} callback - Function to call on each interval
 * @param {number|null} delay - Interval in milliseconds, or null to pause
 */
export function useInterval(callback, delay) {
  const savedCallback = useRef(callback);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    // Don't schedule if delay is null
    if (delay === null) {
      return;
    }

    const tick = () => {
      savedCallback.current();
    };

    const id = setInterval(tick, delay);

    return () => {
      clearInterval(id); // Cleanup on unmount or delay change
    };
  }, [delay]);
}

export default useInterval;
