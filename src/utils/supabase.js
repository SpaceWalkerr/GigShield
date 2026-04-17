import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isPlaceholder = supabaseUrl?.includes("uzrhdhjasnofstqijvgq");

if (!supabaseUrl || !supabaseAnonKey || isPlaceholder) {
  console.warn(
    isPlaceholder 
      ? "Supabase is using a placeholder project ID (uzrhdhjasnofstqijvgq). Authentication and database features will use local fallbacks."
      : "Missing Supabase environment variables. Check your .env file."
  );
}

export const supabase = createClient(
  supabaseUrl || 'http://localhost', 
  supabaseAnonKey || 'dummy',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
