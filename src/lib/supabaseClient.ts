import { createClient } from '@supabase/supabase-js'

// Replace these with your actual Supabase project URL and anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fbwhjpfzgxfksamcmnlg.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZid2hqcGZ6Z3hma3NhbWNtbmxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjM2NDIsImV4cCI6MjA4MzAzOTY0Mn0.KDgY1zNgqX3MxqdrUdEqN30zg77EjnP5pwcbCIzF4lw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
