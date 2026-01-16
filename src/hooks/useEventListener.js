// ============================================================================
// useEventListener Hook - Safe Event Listeners with Automatic Cleanup
// ============================================================================
// Adds event listeners with automatic cleanup on unmount.
// Prevents memory leaks from un-removed event listeners.
//
// Usage:
//   // Window resize
//   useEventListener('resize', () => setWidth(window.innerWidth));
//
//   // Keyboard shortcuts
//   useEventListener('keydown', (e) => {
//     if (e.key === 'Escape') closeModal();
//   });
//
//   // Custom element
//   useEventListener('scroll', handleScroll, containerRef.current);
//
// Based on DEBUG_TEST_GUIDE Phase 1.3 recommendations.
// Created: January 16, 2026
// ============================================================================

import { useEffect, useRef } from 'react';

/**
 * Custom hook for event listeners with automatic cleanup
 * @param {string} eventName - Name of the event (e.g., 'resize', 'keydown')
 * @param {Function} handler - Event handler function
 * @param {Element} element - Element to attach listener to (default: window)
 */
export function useEventListener(eventName, handler, element = typeof window !== 'undefined' ? window : null) {
  // Store handler in ref to avoid re-subscribing on every render
  const savedHandler = useRef(handler);

  // Update ref.current value if handler changes
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    // Make sure element supports addEventListener
    const isSupported = element && element.addEventListener;
    if (!isSupported) return;

    // Create event listener that calls handler function stored in ref
    const eventListener = (event) => savedHandler.current(event);

    // Add event listener
    element.addEventListener(eventName, eventListener);

    // Cleanup: Remove event listener on unmount
    return () => {
      element.removeEventListener(eventName, eventListener);
    };
  }, [eventName, element]);
}

export default useEventListener;
