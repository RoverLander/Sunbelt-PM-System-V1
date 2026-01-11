import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kccdezbcnnmqodtwllya.supabase.co';
const supabaseAnonKey = 'sb_publishable_j2wbR5gzztMGIEIRCJ4s6g_XsA_r2jr';

// Detect if running in WebContainer (StackBlitz, Bolt, etc.)
const isWebContainer = typeof window !== 'undefined' && (
  window.location.hostname.includes('webcontainer') ||
  window.location.hostname.includes('stackblitz') ||
  window.location.hostname.includes('local-credentialless')
);

// CRITICAL: Set up error suppression BEFORE Supabase client is created
if (isWebContainer && typeof window !== 'undefined') {
  console.info('[Supabase] Setting up WebContainer error handling');

  // Global handler to suppress "Cannot navigate to URL" errors from Supabase
  const originalOnError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    // Suppress navigation errors from Supabase's _refreshClients
    if (message && (
      message.includes('Cannot navigate') ||
      message.includes('navigate to URL') ||
      (source && source.includes('localservice'))
    )) {
      console.debug('[Supabase] Navigation error suppressed');
      return true; // Prevents the error from propagating
    }
    // Call original handler for other errors
    if (originalOnError) {
      return originalOnError.call(this, message, source, lineno, colno, error);
    }
    return false;
  };

  // Also handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || String(event.reason);
    if (message.includes('Cannot navigate') || message.includes('navigate to URL')) {
      console.debug('[Supabase] Navigation rejection suppressed');
      event.preventDefault();
    }
  });

  // Clear any existing Supabase auth data
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('sunbelt-auth'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => {
      console.info(`[Supabase] Clearing stale auth key: ${key}`);
      localStorage.removeItem(key);
    });
  } catch (e) {
    // Ignore storage errors
  }
}

// Custom storage that blocks auth data in WebContainer to prevent refresh attempts
const safeStorage = {
  getItem: (key) => {
    try {
      // In WebContainer, return null for auth keys to prevent session recovery
      // which triggers the _refreshClients navigation error
      if (isWebContainer && key && (key.includes('auth') || key.includes('token') || key.includes('session'))) {
        console.debug(`[Storage] Blocking read for: ${key}`);
        return null;
      }
      return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      // In WebContainer, don't persist auth data
      if (isWebContainer && key && (key.includes('auth') || key.includes('token') || key.includes('session'))) {
        console.debug(`[Storage] Blocking write for: ${key}`);
        return;
      }
      if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
    } catch {
      // Ignore storage errors
    }
  },
  removeItem: (key) => {
    try {
      if (typeof window !== 'undefined') window.localStorage.removeItem(key);
    } catch {
      // Ignore storage errors
    }
  }
};

// Configure for web container compatibility
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'implicit',
    autoRefreshToken: false,
    persistSession: false, // Critical: prevents getSession() from triggering refresh
    detectSessionInUrl: false,
    storage: safeStorage,
    storageKey: 'sunbelt-auth-v2',
    debug: false
  },
  realtime: {
    params: {
      eventsPerSecond: 0
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'sunbelt-pm-web'
    }
  },
  db: {
    schema: 'public'
  }
});

// CRITICAL: Stop auto refresh immediately after client creation
// This prevents the background timer that causes "Cannot navigate to URL" errors
// See: https://github.com/orgs/supabase/discussions/17788
try {
  supabase.auth.stopAutoRefresh();
} catch (e) {
  // Ignore - method may not exist in older versions
}

// Disable realtime completely
try {
  supabase.realtime.disconnect();
} catch {
  // Ignore if not initialized
}

// Log environment detection
if (isWebContainer) {
  console.info('[Supabase] Running in WebContainer - auth refresh disabled');
}

// Helper to safely execute queries
export const safeQuery = async (queryFn, fallback = null) => {
  try {
    const result = await queryFn();
    if (result.error) {
      console.warn('Supabase query error:', result.error.message);
      return { data: fallback, error: result.error };
    }
    return result;
  } catch (err) {
    console.warn('Supabase query exception:', err.message);
    return { data: fallback, error: err };
  }
};

// Export environment detection for other modules
export { isWebContainer };
