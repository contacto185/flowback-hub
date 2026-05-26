import { Routes, Route, Link } from 'react-router-dom';
import Home from '@/pages/Home';
import NotFound from '@/pages/NotFound';

export default function App() {
  return (
    <div className="min-h-dvh bg-cream text-ink font-sans">
      <header className="sticky top-0 z-40 backdrop-blur bg-cream/80 border-b border-ink/5">
        <nav className="max-w-screen-md mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/" className="font-serif text-lg font-black grad-text">
            Flowback Hub
          </Link>
          <span className="ml-auto text-xs text-ink/40">react-v2 · alpha</span>
        </nav>
      </header>

      <main className="max-w-screen-md mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}
