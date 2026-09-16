import { createClient } from '@supabase/supabase-js';

// 最新生產環境專案金鑰（包含所有既有學生、上課進度、成績、行事曆資料）
const PROD_SUPABASE_URL = "https://kdtmalqiezudatuwqtar.supabase.co";
const PROD_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkdG1hbHFpZXp1ZGF0dXdxdGFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5Njg4MzgsImV4cCI6MjEwMzU0NDgzOH0.7S9BDwtq5U0AWvs2xJJ2X17VtwsKCbl5aqpPYx9dUkY";

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 舊專案 ynkvxixhiwwnocqybprs 已停止解析；若環境變數殘留舊專案值或為空，一律強制回退至最新生產環境專案
const isInvalidUrl = !envUrl || envUrl.includes("ynkvxixhiwwnocqybprs");
const isInvalidKey = !envKey || envKey.includes("9Z_SKdFXQOrZXEHT4J4wkSXBpt097tOuuXI6IFJN_FA");

const supabaseUrl = isInvalidUrl ? PROD_SUPABASE_URL : envUrl;
const supabaseKey = isInvalidKey ? PROD_SUPABASE_KEY : envKey;

export const supabase = createClient(supabaseUrl, supabaseKey);