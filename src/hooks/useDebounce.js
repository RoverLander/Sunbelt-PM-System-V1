// ============================================================================
// useDebounce Hook - Debounce Values with Automatic Cleanup
// ============================================================================
// Debounces a value with automatic cleanup of pending timeouts.
// Useful for search inputs, form validation, etc.
//
// Usage:
//   const [searchTerm, setSearchTerm] = useState('');
//   const debouncedSearchTerm = useDebounce(searchTerm, 500);
//
//   useEffect(() => {
//     if (debouncedSearchTerm) {
//       performSearch(debouncedSearchTerm);
//     }
//   }, [debouncedSearchTerm]);
//
// Based on DEBUG_TEST_GUIDE Phase 2.2 recommendations.
// Created: January 16, 2026
// ============================================================================

import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce a value
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default: 300)
 * @returns {any} The debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set a timeout to update the debounced value
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: clear timeout if value changes or component unmounts
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
