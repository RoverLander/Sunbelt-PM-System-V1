import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kccdezbcnnmqodtwllya.supabase.co';
const supabaseAnonKey = 'sb_publishable_j2wbR5gzztMGIEIRCJ4s6g_XsA_r2jr';

/**
 * Supabase Client Configuration
 * Clean configuration for local development / production hosting
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'sunbelt-pm-auth',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  },
  realtime: {
    params: {
      eventsPerSecond: 10
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

/**
 * Helper to safely execute queries with error handling
 * @param {Function} queryFn - Async function that returns a Supabase query result
 * @param {any} fallback - Default value if query fails
 * @returns {Promise<{data: any, error: any}>}
 */
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

/**
 * Helper to check if user is authenticated
 * @returns {Promise<boolean>}
 */
export const isAuthenticated = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};

/**
 * Get current user
 * @returns {Promise<User|null>}
 */
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};
