import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kccdezbcnnmqodtwllya.supabase.co';
const supabaseAnonKey = 'sb_publishable_j2wbR5gzztMGIEIRCJ4s6g_XsA_r2jr';

// Custom storage that doesn't trigger navigation errors
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
      // Ignore storage errors in sandboxed environments
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

// Configure for web container compatibility (StackBlitz, etc.)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'implicit', // Use implicit flow - simpler, no redirects
    autoRefreshToken: false, // Disable token refresh completely
    persistSession: false, // Don't persist - prevents refresh attempts
    detectSessionInUrl: false, // Don't detect OAuth redirects
    storage: safeStorage,
    storageKey: 'sunbelt-auth', // Custom key to avoid conflicts
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

// Disable realtime completely after creation
try {
  supabase.realtime.disconnect();
} catch {
  // Ignore if realtime not initialized
}

// Helper to safely execute queries with error handling
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
