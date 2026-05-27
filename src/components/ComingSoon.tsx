import { type LucideIcon } from 'lucide-react';

interface Props {
  emoji?:       string;
  icon?:        LucideIcon;
  title:        string;
  description?: string;
}

/**
 * Stub para secciones todavía no migradas a react-v2. Mantiene el layout
 * consistente para que el BottomNav no genere 404s al navegar.
 */
export default function ComingSoon({ emoji, icon: Icon, title, description }: Props) {
  return (
    <section className="py-12 text-center">
      <div className="card max-w-sm mx-auto p-8">
        {Icon ? (
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl grid place-items-center bg-grad-brand/10">
            <Icon className="w-7 h-7 text-accent-orange" strokeWidth={2} />
          </div>
        ) : (
          <p className="text-5xl mb-3">{emoji ?? '🌿'}</p>
        )}
        <h1 className="font-serif text-xl font-bold mb-1">{title}</h1>
        <p className="text-xs text-ink/50 mb-4">
          {description ?? 'Esta sección se está migrando a la nueva versión.'}
        </p>
        <p className="text-[10px] uppercase tracking-wider text-ink/30">
          react-v2 · próximamente
        </p>
      </div>
    </section>
  );
}
