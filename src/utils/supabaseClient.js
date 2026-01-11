import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kccdezbcnnmqodtwllya.supabase.co';
const supabaseAnonKey = 'sb_publishable_j2wbR5gzztMGIEIRCJ4s6g_XsA_r2jr';

// Configure for web container compatibility (StackBlitz, etc.)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: false, // Disable - causes "Cannot navigate" errors in web containers
    persistSession: true,
    detectSessionInUrl: false, // Disable URL detection which fails in sandboxed environments
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  },
  realtime: {
    params: {
      eventsPerSecond: 0 // Effectively disable realtime to prevent background errors
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'sunbelt-pm-web'
    }
  }
});

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
