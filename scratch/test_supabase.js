import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uzrhdhjasnofstqijvgq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6cmhkaGphc25vZnN0cWlqdmdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNTU1MzUsImV4cCI6MjA5MTkzMTUzNX0.H3RUU_pg4fbUNmOGt4VeQwPLYomtISnT1itFI_gxO7c';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Connection Error (Auth):', error.message);
    } else {
      console.log('Auth connection successful. Session:', !!data.session);
    }

    const { data: restData, error: restError } = await supabase.from('profiles').select('*').limit(1);
    if (restError) {
       console.error('REST Error:', restError.message);
    } else {
       console.log('REST connection successful.');
    }
  } catch (err) {
    console.error('Fetch Error:', err.message);
  }
}

testConnection();
