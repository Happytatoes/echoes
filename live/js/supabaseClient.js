import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://orgnduftnhgufeiweyoe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZ25kdWZ0bmhndWZlaXdleW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzAzMTIsImV4cCI6MjA2OTAwNjMxMn0.Tdty67UyqoagmxFFhnINdg4zt3YbwwPZJdbPDjnupcI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,   // saves session in localStorage
    autoRefreshToken: true, // keeps session alive
    detectSessionInUrl: true,
  },
});