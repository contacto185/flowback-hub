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

export type AdminEmail = typeof ADMIN_EMAILS[number];

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return (ADMIN_EMAILS as readonly string[]).includes(normalized);
}

export const TIER_RANK: Record<string, number> = {
  free: 0, basica: 1, vip: 2, premium: 3,
};

export type Tier = 'free' | 'basica' | 'vip' | 'premium';

export function canAccessTier(userTier: string | null | undefined, required: string): boolean {
  if (!required || required === 'free') return true;
  const u = (userTier ?? 'free').toLowerCase().trim();
  return (TIER_RANK[u] ?? 0) >= (TIER_RANK[required] ?? 0);
}
