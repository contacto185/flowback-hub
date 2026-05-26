import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '@/lib/auth-context';

/**
 * Consume the auth context. Throws if used outside <AuthProvider>.
 *
 * Returns: { currentUser, userProfile, isAdmin, isLoading, signOut }
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth() must be used inside an <AuthProvider>');
  }
  return ctx;
}
