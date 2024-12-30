import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = "https://thxywexgqmyuqxrfsbtf.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoeHl3ZXhncW15dXF4cmZzYnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1MjU0MjcsImV4cCI6MjA1MTEwMTQyN30.5PkRssOdPM4reYwj_LiYPWIdJVGiyWDUBpnQMnsl5Vs";

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Anon Key. Please connect your project to Supabase first.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);