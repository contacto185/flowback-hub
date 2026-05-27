import { type ReactNode } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import AuthProvider from '@/components/AuthProvider';
import ProtectedRoute from '@/components/ProtectedRoute';
import BottomNav from '@/components/BottomNav';
import Home     from '@/pages/Home';
import Clases   from '@/pages/Clases';
import Eventos  from '@/pages/Eventos';
import Cursos   from '@/pages/Cursos';
import Agenda   from '@/pages/Agenda';
import Grabadas from '@/pages/Grabadas';
import MiCuenta from '@/pages/MiCuenta';
import Admin    from '@/pages/Admin';
import Login    from '@/pages/Login';
import NotFound from '@/pages/NotFound';

/** Layout used for every protected page: header on top, BottomNav fixed
    at the bottom, content in between. `pb-28` keeps content from being
    occluded by the floating BottomNav. */
function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-cream text-ink font-sans">
      <header className="sticky top-0 z-40 backdrop-blur bg-cream/80 border-b border-line">
        <nav className="max-w-screen-md mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="font-serif text-lg font-black grad-text">
            Flowback Hub
          </Link>
          <span className="ml-auto text-[10px] uppercase tracking-wider text-ink/30">
            react-v2
          </span>
        </nav>
      </header>

      <main className="max-w-screen-md mx-auto px-4 py-6 pb-28">{children}</main>

      <BottomNav />
    </div>
  );
}

/** Helper: wraps a page element in ProtectedRoute + AppShell. Cuts route
    declaration noise when we have ~10 protected pages. */
function Protected({ element, adminOnly = false }: { element: ReactNode; adminOnly?: boolean }) {
  return (
    <ProtectedRoute adminOnly={adminOnly}>
      <AppShell>{element}</AppShell>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected — any logged-in user */}
        <Route path="/"          element={<Protected element={<Home     />} />} />
        <Route path="/clases"    element={<Protected element={<Clases   />} />} />
        <Route path="/eventos"   element={<Protected element={<Eventos  />} />} />
        <Route path="/cursos"    element={<Protected element={<Cursos   />} />} />
        <Route path="/agenda"    element={<Protected element={<Agenda   />} />} />
        <Route path="/grabadas"  element={<Protected element={<Grabadas />} />} />
        <Route path="/mi-cuenta" element={<Protected element={<MiCuenta />} />} />

        {/* Protected — admins only */}
        <Route path="/admin"     element={<Protected element={<Admin    />} adminOnly />} />

        {/* 404 (also protected so we don't leak a layout-less page) */}
        <Route path="*"          element={<Protected element={<NotFound />} />} />
      </Routes>
    </AuthProvider>
  );
}
