import { GraduationCap, Clock, Check } from 'lucide-react';
import { useCursos, type CursoItem } from '@/hooks/useCursos';
import CardSkeleton from '@/components/CardSkeleton';
import EmptyState from '@/components/EmptyState';
import ErrorCard from '@/components/ErrorCard';

const TIER_LABEL: Record<string, string> = {
  free:    'GRATIS',
  basica:  'BÁSICA',
  vip:     'VIP',
  premium: 'PREMIUM',
};
const TIER_STYLES: Record<string, string> = {
  free:    'bg-green-500/15  text-green-700',
  basica:  'bg-accent-blue/15  text-accent-blue',
  vip:     'bg-accent-purple/15 text-accent-purple',
  premium: 'bg-accent-orange/15 text-accent-orange',
};

function formatDuration(hours: number | null): string | null {
  if (!hours) return null;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h && m) return `${h}h ${m}min`;
  if (h)      return `${h}h`;
  return `${m}min`;
}

function formatPrice(price: number | null, currency: string | null): string {
  if (!price) return 'Gratis';
  return `$${Number(price).toLocaleString('es-CL')} ${currency ?? 'CLP'}`;
}

export default function Cursos() {
  const { data, loading, error } = useCursos();

  return (
    <section className="py-2">
      <header className="mb-5">
        <h1 className="font-serif text-2xl font-black leading-tight mb-1">
          Nuestros <span className="grad-text">cursos</span>
        </h1>
        <p className="text-xs text-ink/40">Programas de transformación profunda</p>
      </header>

      {loading && <CardSkeleton count={3} withImage />}
      {!loading && error && <ErrorCard error={error} />}

      {!loading && !error && data && data.length === 0 && (
        <EmptyState
          icon={GraduationCap}
          title="Sin cursos disponibles"
          description="Próximamente nuevos programas"
        />
      )}

      {!loading && !error && data && data.length > 0 && (
        <ul className="space-y-4">
          {data.map((c) => (
            <li key={c.id}>
              <CursoCard curso={c} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CursoCard({ curso: c }: { curso: CursoItem }) {
  const tier     = (c.tier_required ?? 'free').toLowerCase();
  const showTier = tier && tier !== 'free';
  const duration = formatDuration(c.duration_hours);
  const price    = formatPrice(c.price, c.currency);
  const thumb    = c.thumbnail_url;

  return (
    <article className="card overflow-hidden p-0">
      <div className="relative aspect-[16/9] bg-grad-brand/10">
        {thumb && (
          <img
            src={thumb}
            alt={c.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(ev) => {
              const img = ev.currentTarget;
              img.onerror = null;
              img.style.display = 'none';
            }}
          />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(11,14,20,.55) 0%, transparent 55%)' }} />
        {showTier && (
          <span
            className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full ${TIER_STYLES[tier] ?? TIER_STYLES.basica}`}
          >
            {TIER_LABEL[tier] ?? tier.toUpperCase()}
          </span>
        )}
        {c.purchased && (
          <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full bg-green-500/20 text-green-700 border border-green-500/40 flex items-center gap-1">
            <Check className="w-3 h-3" strokeWidth={3} /> Tuyo
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-base font-serif mb-1 text-ink">{c.title}</h3>
        {c.instructor && (
          <p className="text-xs text-ink/50 mb-2">
            Por <span className="text-ink/70">{c.instructor}</span>
          </p>
        )}
        {c.description && (
          <p className="text-xs text-ink/40 mb-3 leading-relaxed line-clamp-2">{c.description}</p>
        )}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-line">
          <span className="text-lg font-black text-accent-orange">{price}</span>
          {duration && (
            <span className="flex items-center gap-1 text-xs text-ink/40">
              <Clock className="w-3.5 h-3.5" strokeWidth={2} />
              {duration}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
