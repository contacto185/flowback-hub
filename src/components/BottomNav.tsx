import { NavLink } from 'react-router-dom';
import {
  House,
  Gift,
  CalendarDays,
  GraduationCap,
  Video,
  PlayCircle,
  UserCircle,
  Shield,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Tab {
  to:    string;
  icon:  LucideIcon;
  label: string;
}

const BASE_TABS: Tab[] = [
  { to: '/',          icon: House,         label: 'Inicio'    },
  { to: '/clases',    icon: Gift,          label: 'Clases'    },
  { to: '/eventos',   icon: CalendarDays,  label: 'Eventos'   },
  { to: '/cursos',    icon: GraduationCap, label: 'Cursos'    },
  { to: '/agenda',    icon: Video,         label: 'Agenda'    },
  { to: '/grabadas',  icon: PlayCircle,    label: 'Grabadas'  },
  { to: '/mi-cuenta', icon: UserCircle,    label: 'Mi cuenta' },
];

const ADMIN_TAB: Tab = { to: '/admin', icon: Shield, label: 'Admin' };

export default function BottomNav() {
  const { currentUser, isAdmin } = useAuth();
  if (!currentUser) return null;

  const tabs = isAdmin ? [...BASE_TABS, ADMIN_TAB] : BASE_TABS;

  return (
    <nav
      className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-screen-md
                 bg-cream/95 backdrop-blur-xl border border-accent-orange/20
                 rounded-3xl px-1 py-2 z-50 shadow-card-hover"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.5rem)' }}
    >
      <ul
        className="grid gap-0.5"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map((tab) => (
          <li key={tab.to} className="min-w-0">
            <NavLink
              to={tab.to}
              end={tab.to === '/'}
              className="flex flex-col items-center gap-1 py-1.5 rounded-2xl"
              aria-label={tab.label}
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`grid place-items-center transition-colors ${
                      isActive
                        ? 'bg-grad-brand text-white'
                        : 'bg-transparent text-ink/45'
                    } ${tabs.length >= 8 ? 'w-8 h-8 rounded-lg' : 'w-9 h-9 rounded-xl'}`}
                  >
                    <tab.icon
                      className={tabs.length >= 8 ? 'w-4 h-4' : 'w-5 h-5'}
                      strokeWidth={2}
                    />
                  </span>
                  <span
                    className={`font-medium leading-none truncate w-full text-center transition-colors ${
                      isActive ? 'text-accent-orange' : 'text-ink/50'
                    } ${tabs.length >= 8 ? 'text-[9px]' : 'text-[10px]'}`}
                  >
                    {tab.label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
