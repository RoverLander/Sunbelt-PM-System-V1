import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kccdezbcnnmqodtwllya.supabase.co';
const supabaseAnonKey = 'sb_publishable_j2wbR5gzztMGIEIRCJ4s6g_XsA_r2jr';

// Detect if running in WebContainer (StackBlitz, Bolt, etc.)
const isWebContainer = typeof window !== 'undefined' && (
  window.location.hostname.includes('webcontainer') ||
  window.location.hostname.includes('stackblitz') ||
  window.location.hostname.includes('local-credentialless')
);

// Custom storage that doesn't trigger errors
const safeStorage = {
  getItem: (key) => {
    try {
      return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
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
