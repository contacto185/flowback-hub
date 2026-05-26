import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

type LocationState = { from?: { pathname: string } } | null;

/** Translate Supabase auth error strings into something a non-tech user understands */
function translateAuthError(msg: string): string {
  if (!msg) return 'Error desconocido';
  if (msg.includes('Invalid login'))       return 'Email o contraseña incorrectos';
  if (msg.includes('Email not confirmed')) return 'Confirmá tu email antes de iniciar sesión';
  if (msg.includes('already registered'))  return 'Este email ya tiene una cuenta';
  if (msg.toLowerCase().includes('rate limit')) return 'Demasiados intentos. Esperá un momento.';
  if (msg.toLowerCase().includes('password'))   return 'La contraseña debe tener al menos 6 caracteres';
  return msg;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isLoading } = useAuth();

  const [mode, setMode]           = useState<'login' | 'forgot'>('login');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState<string | null>(null);
  const [info, setInfo]           = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as LocationState)?.from?.pathname ?? '/';

  // If we're already logged in (e.g. user typed /login while authenticated),
  // bounce them to where they came from (or home).
  if (!isLoading && currentUser) {
    return <Navigate to={from} replace />;
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Completá email y contraseña');
      return;
    }
    setSubmitting(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    setSubmitting(false);
    if (err) {
      setError(translateAuthError(err.message));
      return;
    }
    // AuthProvider's onAuthStateChange will fire SIGNED_IN and update state;
    // we navigate now so the user isn't stuck on /login waiting.
    navigate(from, { replace: true });
  }

  async function handleForgot(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Ingresá tu email');
      return;
    }
    setSubmitting(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: window.location.origin + '/login',
    });
    setSubmitting(false);
    if (err) {
      setError(translateAuthError(err.message));
      return;
    }
    setInfo('Listo. Revisá tu email para resetear la contraseña.');
  }

  return (
    <div className="min-h-dvh bg-cream text-ink font-sans grid place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Link to="/" className="block text-center mb-6">
          <span className="font-serif text-2xl font-black grad-text">Flowback Hub</span>
        </Link>

        <div className="card p-6">
          {mode === 'login' ? (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl grid place-items-center bg-accent-orange/15">
                  <span className="text-lg">🔐</span>
                </div>
                <div>
                  <p className="font-semibold text-sm">Acceso miembros</p>
                  <p className="text-xs text-ink/40">Iniciá sesión con tu cuenta</p>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <label htmlFor="login-email" className="text-xs text-ink/40 mb-1.5 block">Email</label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full bg-ink/[.04] border border-ink/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-orange focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="login-password" className="text-xs text-ink/40 mb-1.5 block">Contraseña</label>
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-ink/[.04] border border-ink/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-orange focus:bg-white transition-colors"
                  />
                </div>

                {error && <p className="text-xs text-red-500">{error}</p>}
                {info  && <p className="text-xs text-green-600">{info}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-grad w-full py-3 rounded-xl text-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Entrando…' : 'Iniciar sesión'}
                </button>
              </form>

              <button
                type="button"
                onClick={() => { setMode('forgot'); setError(null); setInfo(null); }}
                className="block w-full text-center text-xs text-ink/40 mt-4 hover:text-ink/60 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-5">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); setInfo(null); }}
                  className="w-8 h-8 rounded-xl grid place-items-center bg-ink/[.06] hover:bg-ink/10 transition-colors"
                  aria-label="Volver"
                >
                  ←
                </button>
                <div>
                  <p className="font-semibold text-sm">Recuperar contraseña</p>
                  <p className="text-xs text-ink/40">Te enviaremos un enlace al email</p>
                </div>
              </div>

              <form onSubmit={handleForgot} className="space-y-3">
                <div>
                  <label htmlFor="forgot-email" className="text-xs text-ink/40 mb-1.5 block">Email</label>
                  <input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full bg-ink/[.04] border border-ink/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-orange focus:bg-white transition-colors"
                  />
                </div>

                {error && <p className="text-xs text-red-500">{error}</p>}
                {info  && <p className="text-xs text-green-600">{info}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-grad w-full py-3 rounded-xl text-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Enviando…' : 'Enviar enlace'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-xs text-ink/30 text-center mt-6">
          react-v2 · alpha
        </p>
      </div>
    </div>
  );
}
