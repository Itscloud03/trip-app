import { createClient } from '@supabase/supabase-js';

// Ganti dua nilai ini dengan milik project Supabase kamu sendiri
// (Settings > API di dashboard Supabase). Bisa juga dipindah ke
// file .env sebagai VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xtqxdolwevuxuxcevjju.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cXhkb2x3ZXZ1eHV4Y2V2amp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyMDUzODQsImV4cCI6MjA5ODc4MTM4NH0.JMwOLKUvT0sSGzYysVldrejJ1jgwBDDfZdNz2OwUFXM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
