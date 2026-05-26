import { createClient } from '@supabase/supabase-js';

const url     = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Don't crash at import time, but log loudly — easier to spot than a
  // confusing runtime error from a misconfigured client downstream.
  console.error(
    '[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing. ' +
    'Copy .env.example to .env.local and fill them in.',
  );
}

export const supabase = createClient(url ?? '', anonKey ?? '', {
  auth: {
    persistSession:     true,
    autoRefreshToken:   true,
    detectSessionInUrl: true,
  },
});

export const ADMIN_EMAILS = [
  'hi@wapnix.com',
  'hi@monkeia.com',
  'contacto@flowback.cl',
  'jimmylavinfeldman@gmail.com',
] as const;

export const TIER_RANK: Record<string, number> = {
  free: 0, basica: 1, vip: 2, premium: 3,
};
