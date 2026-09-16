import { createClient } from '@supabase/supabase-js';

// 正式生產環境資料庫連線資訊（與原始運作中版本完全一致，避免雲端環境變數干擾）
const supabaseUrl = "https://kdtmalqiezudatuwqtar.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkdG1hbHFpZXp1ZGF0dXdxdGFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5Njg4MzgsImV4cCI6MjEwMzU0NDgzOH0.7S9BDwtq5U0AWvs2xJJ2X17VtwsKCbl5aqpPYx9dUkY";

export const supabase = createClient(supabaseUrl, supabaseKey);