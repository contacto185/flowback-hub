import { NavLink, Outlet } from 'react-router-dom';

interface TabSpec {
  to:    string;
  emoji: string;
  label: string;
}

const ADMIN_TABS: TabSpec[] = [
  { to: 'videos',    emoji: '🎥', label: 'Videos'    },
  { to: 'eventos',   emoji: '📅', label: 'Eventos'   },
  { to: 'webinars',  emoji: '📡', label: 'Webinars'  },
  { to: 'cursos',    emoji: '🎓', label: 'Cursos'    },
  { to: 'docs',      emoji: '📄', label: 'Docs'      },
  { to: 'planes',    emoji: '💎', label: 'Planes'    },
  { to: 'bloques',   emoji: '🧩', label: 'Bloques'   },
  { to: 'imagenes',  emoji: '🖼️', label: 'Imágenes'  },
  { to: 'usuarios',  emoji: '👥', label: 'Usuarios'  },
];

export default function AdminLayout() {
  return (
    <section className="py-2">
      <header className="mb-4">
        <h1 className="font-serif text-2xl font-black leading-tight mb-1">
          Panel <span className="grad-text">admin</span>
        </h1>
        <p className="text-xs text-ink/40">Gestión de contenido · solo admins</p>
      </header>

      {/* Tab bar — horizontal scroll on narrow viewports */}
      <nav
        className="flex gap-1.5 overflow-x-auto -mx-4 px-4 pb-3 mb-4 border-b border-line"
        style={{ scrollbarWidth: 'thin' }}
        aria-label="Tabs de administración"
      >
        {ADMIN_TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-grad-brand text-white shadow-card'
                  : 'bg-ink/[.04] text-ink/60 hover:bg-ink/[.08]'
              }`
            }
          >
            <span aria-hidden>{tab.emoji}</span>
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </section>
  );
}
