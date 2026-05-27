import { LogOut, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const TIER_LABEL: Record<string, string> = {
  free:    'Gratis',
  basica:  'Básica',
  vip:     'VIP',
  premium: 'Premium',
};

const TIER_STYLES: Record<string, string> = {
  free:    'bg-green-500/15  text-green-700',
  basica:  'bg-accent-blue/15  text-accent-blue',
  vip:     'bg-accent-purple/15 text-accent-purple',
  premium: 'bg-accent-orange/15 text-accent-orange',
};

/**
 * Stub mínimo de Mi cuenta — muestra los datos básicos del perfil + logout.
 * Las features completas (cambiar nombre, cambiar contraseña, ver planes
 * y upgrade vía PayPal) se migrarán en commits siguientes.
 */
export default function MiCuenta() {
  const { currentUser, userProfile, signOut, isAdmin } = useAuth();
  const name  = userProfile?.full_name || currentUser?.email?.split('@')[0] || 'Usuario';
  const email = userProfile?.email || currentUser?.email || '—';
  const tier  = (userProfile?.tier || 'free').toLowerCase();

  return (
    <section className="py-2">
      <h1 className="font-serif text-2xl font-black mb-5">Mi cuenta</h1>

      <div className="card p-5 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-14 h-14 rounded-full bg-grad-brand text-white grid place-items-center font-bold text-lg flex-shrink-0"
            aria-hidden
          >
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-ink truncate">{name}</p>
            <p className="text-xs text-ink/50 truncate flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3 h-3 flex-shrink-0" strokeWidth={2} />
              {email}
            </p>
            <span
              className={`inline-block text-xs font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full mt-1.5 ${TIER_STYLES[tier] || TIER_STYLES.free}`}
            >
              {TIER_LABEL[tier] || tier}
            </span>
            {isAdmin && (
              <span className="inline-block text-xs font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full mt-1.5 ml-2 bg-accent-orange text-white">
                admin
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={signOut}
        className="w-full card p-4 flex items-center gap-3 hover:border-red-300/50 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl grid place-items-center flex-shrink-0 bg-red-500/10">
          <LogOut className="w-5 h-5 text-red-500" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm text-ink">Cerrar sesión</p>
          <p className="text-xs text-ink/50">Vas a volver a la pantalla de login</p>
        </div>
      </button>

      <p className="text-[10px] uppercase tracking-wider text-ink/30 text-center mt-8">
        react-v2 · alpha — más opciones próximamente
      </p>
    </section>
  );
}
