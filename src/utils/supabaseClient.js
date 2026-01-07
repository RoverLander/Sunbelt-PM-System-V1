import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kccdezbcnnmqodtwllya.supabase.co';
const supabaseAnonKey = 'sb_publishable_j2wbR5gzztMGIEIRCJ4s6g_XsA_r2jr';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);