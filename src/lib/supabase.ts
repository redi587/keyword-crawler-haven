import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Ensure environment variables are defined
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Anon Key. Please connect your project to Supabase first.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);