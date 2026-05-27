import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Gift,
  GraduationCap,
  Video,
  PlayCircle,
  UserCircle,
  FolderOpen,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
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

interface QuickCard {
  to:       string;
  icon:     LucideIcon;
  iconBg:   string;     // tailwind bg color class for the icon tile
  iconFg:   string;     // tailwind text color class
  title:    string;
  subtitle: string;
}

const QUICK_CARDS: QuickCard[] = [
  { to: '/eventos',  icon: CalendarDays,  iconBg: 'bg-accent-orange/15', iconFg: 'text-accent-orange', title: 'Próximos eventos', subtitle: 'Talleres y encuentros en vivo' },
  { to: '/clases',   icon: Gift,          iconBg: 'bg-green-500/15',     iconFg: 'text-green-700',     title: 'Clases gratis',    subtitle: 'Acceso libre para empezar' },
  { to: '/cursos',   icon: GraduationCap, iconBg: 'bg-accent-blue/15',   iconFg: 'text-accent-blue',   title: 'Cursos',           subtitle: 'Programas de transformación' },
  { to: '/agenda',   icon: Video,         iconBg: 'bg-accent-purple/15', iconFg: 'text-accent-purple', title: 'Tu agenda',        subtitle: 'Clases grabadas para miembros' },
  { to: '/grabadas',  icon: PlayCircle,    iconBg: 'bg-accent-warm/20',   iconFg: 'text-accent-orange', title: 'Sesiones grabadas',subtitle: 'Contenido exclusivo VIP / Premium' },
  { to: '/documentos',icon: FolderOpen,    iconBg: 'bg-accent-blue/15',   iconFg: 'text-accent-blue',   title: 'Documentos',       subtitle: 'Guías y materiales descargables' },
  { to: '/mi-cuenta', icon: UserCircle,    iconBg: 'bg-ink/[.06]',        iconFg: 'text-ink/70',        title: 'Mi cuenta',        subtitle: 'Perfil, plan y configuración' },
];

export default function Home() {
  const { currentUser, userProfile } = useAuth();
  const name = userProfile?.full_name || currentUser?.email?.split('@')[0] || 'usuario';
  const tier = (userProfile?.tier || 'free').toLowerCase();
  const tierLabel = TIER_LABEL[tier] || tier;
  const tierStyle = TIER_STYLES[tier] || TIER_STYLES.free;

  return (
    <section className="py-2">
      {/* Greeting */}
      <header className="mb-6">
        <p className="text-xs uppercase tracking-wider text-ink/40 mb-1">Hola,</p>
        <h1 className="font-serif text-3xl font-black leading-tight mb-3">
          {name}
        </h1>
        <span
          className={`inline-block text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full ${tierStyle}`}
        >
          {tierLabel}
        </span>
      </header>

      {/* Quick access grid */}
      <p className="text-xs font-semibold uppercase tracking-wider text-ink/40 mb-3">
        Accesos rápidos
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {QUICK_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.to}
              to={card.to}
              className="card p-4 flex items-center gap-3 group hover:border-accent-orange/30 transition-colors"
            >
              <div
                className={`w-11 h-11 rounded-xl grid place-items-center flex-shrink-0 ${card.iconBg}`}
              >
                <Icon className={`w-5 h-5 ${card.iconFg}`} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-ink truncate">{card.title}</p>
                <p className="text-xs text-ink/50 truncate">{card.subtitle}</p>
              </div>
              <ArrowRight
                className="w-4 h-4 text-ink/30 group-hover:text-accent-orange transition-colors flex-shrink-0"
                strokeWidth={2}
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
