import { createContext } from 'react';
import type { User } from '@supabase/supabase-js';

export interface UserProfile {
  user_id:     string;
  full_name:   string | null;
  email:       string | null;
  tier:        string | null;
  avatar_url?: string | null;
}

export interface AuthContextValue {
  /** The Supabase auth user, or null if logged out */
  currentUser: User | null;
  /** Row from public.profiles for this user, or null if logged out / not synced yet */
  userProfile: UserProfile | null;
  /** True if the user's email is in ADMIN_EMAILS */
  isAdmin: boolean;
  /** True while we're resolving the initial session / fetching the profile */
  isLoading: boolean;
  /** Sign out, purge persisted session and redirect to /login */
  signOut: () => Promise<void>;
}

/**
 * undefined = consumer is outside an AuthProvider — the useAuth() hook
 * will throw in that case to surface the misuse loudly.
 */
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
