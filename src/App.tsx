import { type ReactNode } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import AuthProvider from '@/components/AuthProvider';
import ProtectedRoute from '@/components/ProtectedRoute';
import BottomNav from '@/components/BottomNav';
import Home          from '@/pages/Home';
import Clases        from '@/pages/Clases';
import Eventos       from '@/pages/Eventos';
import Cursos        from '@/pages/Cursos';
import Agenda        from '@/pages/Agenda';
import Grabadas      from '@/pages/Grabadas';
import Documentos    from '@/pages/Documentos';
import MiCuenta      from '@/pages/MiCuenta';
import Login         from '@/pages/Login';
import NotFound      from '@/pages/NotFound';
import AdminLayout       from '@/pages/admin/AdminLayout';
import AdminVideos       from '@/pages/admin/AdminVideos';
import AdminEventos      from '@/pages/admin/AdminEventos';
import AdminCursos       from '@/pages/admin/AdminCursos';
import AdminComingSoon   from '@/pages/admin/AdminComingSoon';

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

/** Helper: wraps a page element in ProtectedRoute + AppShell. */
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
        <Route path="/"           element={<Protected element={<Home       />} />} />
        <Route path="/clases"     element={<Protected element={<Clases     />} />} />
        <Route path="/eventos"    element={<Protected element={<Eventos    />} />} />
        <Route path="/cursos"     element={<Protected element={<Cursos     />} />} />
        <Route path="/agenda"     element={<Protected element={<Agenda     />} />} />
        <Route path="/grabadas"   element={<Protected element={<Grabadas   />} />} />
        <Route path="/documentos" element={<Protected element={<Documentos />} />} />
        <Route path="/mi-cuenta"  element={<Protected element={<MiCuenta   />} />} />

        {/* Admin — nested routes. /admin redirects to /admin/videos. */}
        <Route path="/admin"      element={<Protected element={<AdminLayout />} adminOnly />}>
          <Route index             element={<Navigate to="videos"   replace />} />
          <Route path="videos"     element={<AdminVideos  />} />
          <Route path="eventos"    element={<AdminEventos />} />
          <Route path="cursos"     element={<AdminCursos  />} />
          <Route path="webinars"   element={<AdminComingSoon tabLabel="Webinars"  />} />
          <Route path="docs"       element={<AdminComingSoon tabLabel="Documentos" />} />
          <Route path="planes"     element={<AdminComingSoon tabLabel="Planes"    />} />
          <Route path="bloques"    element={<AdminComingSoon tabLabel="Bloques"   />} />
          <Route path="imagenes"   element={<AdminComingSoon tabLabel="Imágenes"  />} />
          <Route path="usuarios"   element={<AdminComingSoon tabLabel="Usuarios"  />} />
        </Route>

        {/* 404 (also protected so we don't leak a layout-less page) */}
        <Route path="*" element={<Protected element={<NotFound />} />} />
      </Routes>
    </AuthProvider>
  );
}
