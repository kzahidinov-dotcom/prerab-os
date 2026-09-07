import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Cache client instance
let supabaseClientInstance: SupabaseClient | null = null;

export function getSupabaseClient(customUrl?: string, customKey?: string): SupabaseClient | null {
  // 1. Check custom credentials from parameters or localStorage
  let url = customUrl;
  let anonKey = customKey;

  if (typeof window !== 'undefined') {
    if (!url || !anonKey) {
      try {
        const storedSettings = localStorage.getItem('prerab_settings_v1');
        if (storedSettings) {
          const parsed = JSON.parse(storedSettings);
          if (parsed.supabase_url && parsed.supabase_anon_key) {
            url = parsed.supabase_url;
            anonKey = parsed.supabase_anon_key;
          }
        }
      } catch (e) {
        console.error('Error reading Supabase settings:', e);
      }
    }
  }

  // 2. Check process.env fallback
  if (!url) url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!anonKey) anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey || !url.startsWith('http')) {
    return null;
  }

  if (!supabaseClientInstance || customUrl || customKey) {
    try {
      supabaseClientInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      return null;
    }
  }

  return supabaseClientInstance;
}
