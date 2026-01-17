// ============================================================================
// errorHandling.js - Standardized Error Handling Utilities
// ============================================================================
// Standard error handlers for Supabase operations and validation.
// Per DEBUG_TEST_GUIDE.md - Phase 1.4 recommendations.
//
// Created: January 17, 2026
// ============================================================================

/**
 * Standard error handler for Supabase operations
 * Maps technical errors to user-friendly messages
 *
 * @param {Error|Object} error - The error object from Supabase
 * @param {string} context - What operation failed (e.g., "create task")
 * @returns {string} - User-friendly error message
 */
export function handleSupabaseError(error, context = 'operation') {
  // Log for debugging
  console.error(`Supabase error during ${context}:`, error);

  // Network errors
  if (error?.message?.includes('Network') ||
      error?.message?.includes('Failed to fetch') ||
      error?.message?.includes('NetworkError') ||
      error?.message?.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }

  // Session/auth errors
  if (error?.message?.includes('JWT') ||
      error?.message?.includes('session') ||
      error?.message?.includes('token')) {
    return 'Your session has expired. Please log in again.';
  }

  // Permission errors (RLS)
  if (error?.message?.includes('permission denied') ||
      error?.message?.includes('RLS') ||
      error?.message?.includes('policy')) {
    return `You don't have permission to ${context}.`;
  }

  // PostgreSQL error codes
  if (error?.code) {
    switch (error.code) {
      case '23505': // Unique constraint violation
        return `This ${extractEntityFromContext(context)} already exists.`;

      case '23503': // Foreign key violation
        return `Invalid reference in ${context}. Please check your selections.`;

      case '23502': // Not null violation
        return `Missing required information for ${context}.`;

      case '22001': // String too long
        return `One or more fields exceed the maximum length for ${context}.`;

      case '42501': // Insufficient privilege
        return `You don't have permission to ${context}.`;

      case '42P01': // Undefined table
        return 'A system configuration error occurred. Please contact support.';

      case '08000': // Connection exception
      case '08003': // Connection does not exist
      case '08006': // Connection failure
        return 'Unable to connect to the server. Please try again.';

      default:
        // Log unknown codes for investigation
        console.warn(`Unhandled PostgreSQL error code: ${error.code}`);
    }
  }

  // Supabase-specific errors
  if (error?.hint?.includes('schema cache')) {
    return 'A database configuration error occurred. Please contact support.';
  }

  // Rate limiting
  if (error?.message?.includes('rate limit') ||
      error?.message?.includes('too many requests')) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  // Generic error with context
  return `Failed to ${context}. Please try again.`;
}

/**
 * Extract entity name from context for better error messages
 */
function extractEntityFromContext(context) {
  const matches = context.match(/create\s+(\w+)|update\s+(\w+)|delete\s+(\w+)/i);
  if (matches) {
    return matches[1] || matches[2] || matches[3];
  }
  return 'item';
}

/**
 * Wraps an async function with standard error handling
 *
 * @param {Function} fn - The async function to wrap
 * @param {string} context - What operation this is
 * @param {Function} showToast - Optional toast function
 * @returns {Function} Wrapped function that returns { success, data, error }
 */
export function withErrorHandling(fn, context, showToast = null) {
  return async (...args) => {
    try {
      const result = await fn(...args);
      return { success: true, data: result, error: null };
    } catch (error) {
      const message = handleSupabaseError(error, context);
      if (showToast) {
        showToast(message, 'error');
      }
      return { success: false, data: null, error: message };
    }
  };
}

/**
 * Standard validation before operations
 *
 * @param {Object} data - The data object to validate
 * @param {string[]} requiredFields - Array of required field names
 * @returns {{ valid: boolean, message?: string, missingFields?: string[] }}
 */
export function validateRequired(data, requiredFields) {
  const missing = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined ||
           value === null ||
           value === '' ||
           (Array.isArray(value) && value.length === 0);
  });

  if (missing.length > 0) {
    const formattedFields = missing.map(f =>
      f.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').toLowerCase().trim()
    );
    return {
      valid: false,
      message: `Please fill in: ${formattedFields.join(', ')}`,
      missingFields: missing
    };
  }

  return { valid: true };
}

/**
 * Validate email format
 *
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (US)
 *
 * @param {string} phone - Phone number to validate
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  const phoneRegex = /^[\d\s\-\(\)\+\.]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Create a standardized result object
 *
 * @param {boolean} success - Whether the operation succeeded
 * @param {any} data - The result data
 * @param {string|null} error - Error message if failed
 */
export function createResult(success, data = null, error = null) {
  return { success, data, error };
}

/**
 * Format error for display in UI
 * Ensures consistent error message formatting
 *
 * @param {Error|string|Object} error - The error to format
 * @returns {string}
 */
export function formatErrorForDisplay(error) {
  if (typeof error === 'string') {
    return error;
  }
  if (error?.message) {
    return error.message;
  }
  if (error?.error) {
    return typeof error.error === 'string' ? error.error : 'An error occurred';
  }
  return 'An unexpected error occurred';
}

// Export all utilities
export default {
  handleSupabaseError,
  withErrorHandling,
  validateRequired,
  isValidEmail,
  isValidPhone,
  createResult,
  formatErrorForDisplay
};
