export const SUPABASE_URL = 'https://mnwxoztptfxzjdfrkxfl.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ud3hvenRwdGZ4empkZnJreGZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTg2NTgsImV4cCI6MjA3ODI3NDY1OH0.b7-KpZyMBz_t5MjH_QsHFWjbEqvS25yGM9aQKuyPvME';

export const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
