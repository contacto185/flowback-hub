import { type ReactNode } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import AuthProvider from '@/components/AuthProvider';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';

/** Logged-in user chip + sign out, shown in the header */
function UserMenu() {
  const { currentUser, userProfile, isAdmin, signOut } = useAuth();
  if (!currentUser) return null;
  const name = userProfile?.full_name || currentUser.email?.split('@')[0] || 'Usuario';
  const tier = userProfile?.tier || 'free';

  return (
    <div className="ml-auto flex items-center gap-2 text-xs">
      <span className="hidden sm:inline text-ink/50">{name}</span>
      <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wide
        ${tier === 'premium' ? 'bg-accent-orange/15 text-accent-orange' :
          tier === 'vip'     ? 'bg-accent-purple/15 text-accent-purple' :
          tier === 'basica'  ? 'bg-accent-blue/15 text-accent-blue' :
                               'bg-ink/[.06] text-ink/50'}`}>
        {tier}
      </span>
      {isAdmin && <span className="px-2 py-0.5 rounded-full bg-accent-orange text-white font-bold">admin</span>}
      <button
        onClick={signOut}
        className="ml-1 px-3 py-1.5 rounded-lg text-ink/60 hover:bg-ink/[.06] transition-colors"
      >
        Salir
      </button>
    </div>
  );
}

/** Layout used for every protected page: header + main wrapper. */
function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-cream text-ink font-sans">
      <header className="sticky top-0 z-40 backdrop-blur bg-cream/80 border-b border-line">
        <nav className="max-w-screen-md mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="font-serif text-lg font-black grad-text">
            Flowback Hub
          </Link>
          <UserMenu />
        </nav>
      </header>
      <main className="max-w-screen-md mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected (require any logged-in user) */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell><Home /></AppShell>
            </ProtectedRoute>
          }
        />

        {/* Catch-all — also protected so we don't leak a layout-less 404 */}
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <AppShell><NotFound /></AppShell>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
