import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Load environment variables securely from Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Safe check: Ensure variables exist before initialization
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("undefined")) {
  console.error("Supabase credentials missing or invalid! Authentication will fail.");
}

// Initialize the singleton instance with Database types
export const supabase = createClient<Database>(
  supabaseUrl || "", 
  supabaseAnonKey || "",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce", // Ensure PKCE for better compatibility
      storage: localStorage,
    }
  }
);
