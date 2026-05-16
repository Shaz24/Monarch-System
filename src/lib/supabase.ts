import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isValidUrl = (url: string) => {
  try { return url.startsWith('https://') || url.startsWith('http://'); }
  catch { return false; }
};

// Only create the real client if we have a valid URL
// Falls back to a dummy client to prevent crashes during local dev without credentials
export const supabase = isValidUrl(supabaseUrl)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-anon-key');

export const isSupabaseConfigured = isValidUrl(supabaseUrl) && supabaseUrl !== 'your_supabase_url';
