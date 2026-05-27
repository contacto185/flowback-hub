import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isAdminEmail } from '@/lib/supabase';
import {
  AuthContext,
  type AuthContextValue,
  type UserProfile,
} from '@/lib/auth-context';

interface Props {
  children: ReactNode;
}

/**
 * Wraps the app, owns the auth state, and listens to Supabase auth changes.
 * Mounts once at the root — consumers read via useAuth().
 */
export default function AuthProvider({ children }: Props) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading]     = useState(true);

  // Standalone fetcher — used by both the auth-state listener AND by
  // refreshProfile() exposed to consumers. Returns the new profile so the
  // caller can react synchronously, but ALSO updates context state.
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, tier, avatar_url')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) {
      console.warn('[auth] profile fetch error:', error.message);
      setUserProfile(null);
      return null;
    }
    const profile = data as UserProfile | null;
    setUserProfile(profile);
    return profile;
  }, []);

  useEffect(() => {
    let cancelled = false;

    // 1) Resolve initial session synchronously-ish (via getSession),
    //    then unblock the UI by clearing isLoading.
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session?.user) {
        setCurrentUser(session.user);
        await fetchProfile(session.user.id);
      }
      if (!cancelled) setIsLoading(false);
    })();

    // 2) Subscribe to subsequent auth events. SIGNED_IN may fire again on
    //    token refresh or on a new tab — both safe to handle idempotently.
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;
      console.log('[auth] event:', event, '· user:', session?.user?.email ?? null);

      if (event === 'SIGNED_IN' && session?.user) {
        setCurrentUser(session.user);
        await fetchProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setUserProfile(null);
      } else if (event === 'USER_UPDATED' && session?.user) {
        setCurrentUser(session.user);
        await fetchProfile(session.user.id);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Keep currentUser fresh, but no need to re-fetch the profile
        setCurrentUser(session.user);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!currentUser) return;
    await fetchProfile(currentUser.id);
  }, [currentUser, fetchProfile]);

  const value = useMemo<AuthContextValue>(() => {
    const isAdmin = isAdminEmail(currentUser?.email);

    return {
      currentUser,
      userProfile,
      isAdmin,
      isLoading,
      refreshProfile,
      signOut: async () => {
        console.log('[auth] signOut requested');
        // 5s timeout — never let a hung network call lock the UI
        try {
          await Promise.race([
            supabase.auth.signOut(),
            new Promise(resolve => setTimeout(resolve, 5000)),
          ]);
        } catch (err) {
          console.error('[auth] signOut error:', err);
        }
        // Defensive purge of any persisted Supabase session keys
        try {
          Object.keys(localStorage).forEach(k => {
            if (k.startsWith('sb-') || k.toLowerCase().includes('supabase')) {
              localStorage.removeItem(k);
            }
          });
        } catch (e) {
          console.warn('[auth] storage purge failed:', e);
        }
        // Hard navigation guarantees a clean state across the whole tree
        window.location.assign('/login');
      },
    };
  }, [currentUser, userProfile, isLoading, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
