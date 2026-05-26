import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  children: ReactNode;
  /** If true, only admins (by email) can pass. Default: any logged-in user. */
  adminOnly?: boolean;
}

/**
 * Route guard. While the initial session is loading, shows a neutral
 * placeholder so we don't flash the login page on first paint. Once
 * resolved: passes children through if authenticated, otherwise redirects
 * to /login and remembers the originally-requested path in location.state
 * (so Login.tsx can send the user back after sign-in).
 */
export default function ProtectedRoute({ children, adminOnly = false }: Props) {
  const { currentUser, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-dvh grid place-items-center bg-cream">
        <p className="text-ink/40 text-sm">Cargando…</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (adminOnly && !isAdmin) {
    return (
      <div className="min-h-dvh grid place-items-center bg-cream px-4 text-center">
        <div>
          <p className="text-5xl mb-3">🔒</p>
          <h1 className="font-serif text-2xl font-bold mb-1">Acceso denegado</h1>
          <p className="text-ink/50 text-sm">Esta sección es solo para administradores.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
