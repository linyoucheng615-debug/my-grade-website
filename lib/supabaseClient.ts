import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kdtmalqiezudatuwqtar.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkdG1hbHFpZXp1ZGF0dXdxdGFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5Njg4MzgsImV4cCI6MjEwMzU0NDgzOH0.7S9BDwtq5U0AWvs2xJJ2X17VtwsKCbl5aqpPYx9dUkY";

export const supabase = createClient(supabaseUrl, supabaseKey);