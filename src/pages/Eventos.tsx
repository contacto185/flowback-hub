import { Clock, MapPin, Video, CalendarX, AlertTriangle } from 'lucide-react';
import { useEventos, type EventoItem } from '@/hooks/useEventos';
import { formatEventDate, parseDateBadge } from '@/lib/format';

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

      {loading && <EventosSkeleton />}

      {!loading && error && (
        <div
          className="card p-6 text-center mt-4"
          style={{ borderColor: 'rgba(245,124,0,.3)' }}
        >
          <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-accent-orange" strokeWidth={2} />
          <p className="font-semibold text-ink mb-1">Error al cargar los eventos</p>
          <p className="text-xs text-ink/50 font-mono break-all">{error.message}</p>
        </div>
      )}

      {!loading && !error && data && data.length === 0 && (
        <div className="card p-8 text-center mt-4">
          <CalendarX className="w-12 h-12 mx-auto mb-3 text-ink/20" strokeWidth={1.5} />
          <p className="font-semibold text-ink/70 mb-1">No hay eventos próximos</p>
          <p className="text-xs text-ink/40">Vuelve pronto para ver nuevas fechas</p>
        </div>
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

function EventosSkeleton() {
  return (
    <ul className="space-y-3" aria-busy="true" aria-label="Cargando eventos">
      {[0, 1, 2].map((i) => (
        <li key={i} className="card overflow-hidden p-0">
          <div className="aspect-[16/9] bg-ink/[.04] animate-pulse" />
          <div className="p-4">
            <div className="h-4 w-2/3 bg-ink/[.08] rounded animate-pulse mb-2" />
            <div className="h-3 w-full bg-ink/[.05] rounded animate-pulse mb-1" />
            <div className="h-3 w-1/2 bg-ink/[.05] rounded animate-pulse" />
          </div>
        </li>
      ))}
    </ul>
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
      {/* Thumbnail with overlays */}
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
                ? <Video   className="w-3.5 h-3.5 flex-shrink-0 text-ink/40" strokeWidth={2} />
                : <MapPin  className="w-3.5 h-3.5 flex-shrink-0 text-ink/40" strokeWidth={2} />}
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
