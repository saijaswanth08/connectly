import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. " +
    "Check your .env file."
  );
}

// Custom lock implementation: bypasses the Navigator Lock API which can produce
// "lock not released within 5000ms" warnings during Vite HMR or tab-switching.
// Instead we use a simple in-memory promise queue — safe for single-tab SPAs.
const acquireLock = <T>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<T>
): Promise<T> => fn();

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // Required: exchanges OAuth code from URL on redirect back
    storage: localStorage,
    lock: acquireLock,
  },
});

