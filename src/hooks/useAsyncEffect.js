// ============================================================================
// useAsyncEffect Hook - Async/Await with Proper Cancellation
// ============================================================================
// Combines async/await patterns with proper cancellation to prevent
// setState calls on unmounted components.
//
// Usage:
//   useAsyncEffect(async (isCancelled) => {
//     const data = await fetchData();
//     if (isCancelled()) return; // Check before setState
//     setData(data);
//   }, [dependency]);
//
// Based on DEBUG_TEST_GUIDE Phase 2.2 recommendations.
// Created: January 16, 2026
// ============================================================================

import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for async effects with cancellation
 * @param {Function} asyncFunction - Async function that receives isCancelled checker
 * @param {Array} dependencies - Effect dependencies
 */
export function useAsyncEffect(asyncFunction, dependencies = []) {
  useEffect(() => {
    let cancelled = false;

    // Provide a function to check cancellation status
    const isCancelled = () => cancelled;

    (async () => {
      try {
        await asyncFunction(isCancelled);
      } catch (error) {
        if (!cancelled) {
          console.error('Async effect error:', error);
        }
      }
    })();

    return () => {
      cancelled = true; // Mark as cancelled on cleanup
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}

/**
 * Alternative: Hook that returns a cancellable promise wrapper
 * Usage:
 *   const makeCancellable = useCancellablePromise();
 *   const data = await makeCancellable(fetchData());
 */
export function useCancellablePromise() {
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    return () => {
      cancelledRef.current = true; // Mark as cancelled on unmount
    };
  }, []);

  const makeCancellable = useCallback((promise) => {
    return new Promise((resolve, reject) => {
      promise
        .then(value => {
          if (!cancelledRef.current) {
            resolve(value);
          }
        })
        .catch(error => {
          if (!cancelledRef.current) {
            reject(error);
          }
        });
    });
  }, []);

  return makeCancellable;
}

export default useAsyncEffect;
