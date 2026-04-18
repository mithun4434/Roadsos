import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lgaxumlssatvtdipkqmb.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnYXh1bWxzc2F0dnRkaXBrcW1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NTk0NDAsImV4cCI6MjA5MTUzNTQ0MH0.VmYlrD7-D-8M2eOhF-dp9N7Z0bu38jXp6KgembY8ibw';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper for classes
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
