import { Clock, MapPin, Video, CalendarX } from 'lucide-react';
import { useEventos, type EventoItem } from '@/hooks/useEventos';
import { formatEventDate, parseDateBadge } from '@/lib/format';
import CardSkeleton from '@/components/CardSkeleton';
import EmptyState from '@/components/EmptyState';
import ErrorCard from '@/components/ErrorCard';

export default function Eventos() {
  const { data, loading, error } = useEventos();

  return (
    <section className="py-2">
      <header className="mb-5">
        <h1 className="font-serif text-2xl font-black leading-tight mb-1">
          Próximos <span className="grad-text">eventos</span>
        </h1>
        <p className="text-xs text-ink/40">Únete a nuestras experiencias transformadoras</p>
      </header>

      {loading && <CardSkeleton count={3} withImage />}
      {!loading && error && <ErrorCard error={error} />}

      {!loading && !error && data && data.length === 0 && (
        <EmptyState
          icon={CalendarX}
          title="No hay eventos próximos"
          description="Vuelve pronto para ver nuevas fechas"
        />
      )}

      {!loading && !error && data && data.length > 0 && (
        <ul className="space-y-3">
          {data.map((e) => (
            <li key={`${e.source}-${e.id}`}>
              <EventoCard evento={e} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function EventoCard({ evento: e }: { evento: EventoItem }) {
  const isOnline   = e.source === 'webinar' || e.type === 'online';
  const badgeLabel = isOnline ? 'Online' : 'Presencial';
  const badgeClass = isOnline
    ? 'bg-accent-orange/15 text-accent-orange border-accent-orange/30'
    : 'bg-accent-blue/15   text-accent-blue   border-accent-blue/30';
  const locLabel   = isOnline ? 'Zoom' : (e.location ?? '');
  const dateLabel  = formatEventDate(e.event_date, e.event_time);
  const dateBadge  = parseDateBadge(e.event_date, e.event_time);
  const isMember   = !!(e.tier_required && e.tier_required !== 'free');
  const hasThumb   = !!e.thumbnail_url;

  return (
    <article className="card overflow-hidden p-0">
      <div className="relative aspect-[16/9] bg-grad-brand/10">
        {hasThumb && (
          <img
            src={e.thumbnail_url!}
            alt={e.title}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={(ev) => {
              const img = ev.currentTarget;
              img.onerror = null;
              img.style.display = 'none';
            }}
          />
        )}
        <span
          className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full border ${badgeClass}`}
        >
          {badgeLabel}
        </span>
        {isMember && (
          <span className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full bg-grad-brand text-white shadow">
            Miembros
          </span>
        )}
        {dateBadge && (
          <div
            className="absolute bottom-3 left-3 rounded-xl px-3 py-1.5 text-center backdrop-blur-sm"
            style={{ background: 'rgba(245,124,0,.95)' }}
          >
            <p className="text-xl font-black text-white leading-none">{dateBadge.day}</p>
            <p className="text-[10px] font-bold text-white/90 uppercase tracking-wide mt-0.5">
              {dateBadge.month}
            </p>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-serif font-bold text-base mb-1.5 text-ink">{e.title}</h3>
        {e.description && (
          <p className="text-xs text-ink/50 mb-3 leading-relaxed line-clamp-2">{e.description}</p>
        )}

        <div className="flex items-center gap-2 mb-3 text-xs flex-wrap text-ink/60">
          <Clock className="w-3.5 h-3.5 flex-shrink-0 text-accent-warm" strokeWidth={2} />
          <span className="text-accent-warm">{dateLabel}</span>
          {locLabel && (
            <>
              <span className="text-ink/20">·</span>
              {isOnline
                ? <Video  className="w-3.5 h-3.5 flex-shrink-0 text-ink/40" strokeWidth={2} />
                : <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-ink/40" strokeWidth={2} />}
              <span className="text-ink/50">{locLabel}</span>
            </>
          )}
          {e.duration && (
            <>
              <span className="text-ink/20">·</span>
              <span className="text-ink/50">{e.duration}</span>
            </>
          )}
        </div>

        {e.zoom_url ? (
          <a
            href={e.zoom_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-grad w-full py-2.5 rounded-xl text-sm text-center block"
          >
            Unirme
          </a>
        ) : (
          <button
            className="w-full py-2.5 rounded-xl text-sm font-medium text-ink/50 cursor-default"
            style={{ background: 'rgba(42,32,26,.05)', border: '1px solid rgba(42,32,26,.1)' }}
            disabled
          >
            Próximamente
          </button>
        )}
      </div>
    </article>
  );
}
