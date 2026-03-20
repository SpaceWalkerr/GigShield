import { createClient } from '@supabase/supabase-js';

// The URL is extracted from the Postgres connection string you provided.
// db.yezkltxljctnxxatogwi.supabase.co -> yezkltxljctnxxatogwi.supabase.co
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yezkltxljctnxxatogwi.supabase.co';

// IMPORTANT: Never expose your Postgres database password in your frontend!
// Instead, you must use your Supabase Project's "Anon" / "Public" API Key.
// You can find it in your Supabase Dashboard: Settings -> API -> Project API Keys.
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_vao7kcchBL6RIrNvwqg8NQ_a69q0NiF';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
