import { Calendar, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { canAccessTier } from '@/lib/supabase';
import { useGrabadas } from '@/hooks/useGrabadas';
import CardSkeleton from '@/components/CardSkeleton';
import EmptyState from '@/components/EmptyState';
import ErrorCard from '@/components/ErrorCard';
import TierGate from '@/components/TierGate';
import VideoCard from '@/components/VideoCard';
import { formatEventDate } from '@/lib/format';
import type { WebinarRow } from '@/lib/types';

export default function Grabadas() {
  const { userProfile, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <section className="py-2">
        <Header />
        <CardSkeleton count={3} />
      </section>
    );
  }
  if (!canAccessTier(userProfile?.tier, 'vip')) {
    return (
      <section className="py-2">
        <Header />
        <TierGate requiredTier="vip" sectionName="las Sesiones Grabadas" />
      </section>
    );
  }

  return <GrabadasContent />;
}

function Header() {
  return (
    <header className="mb-5">
      <h1 className="font-serif text-2xl font-black leading-tight mb-1">
        Sesiones <span className="grad-text">grabadas</span>
      </h1>
      <p className="text-xs text-ink/40">Contenido exclusivo VIP y Premium</p>
    </header>
  );
}

function GrabadasContent() {
  const { data, loading, error } = useGrabadas();

  return (
    <section className="py-2">
      <Header />

      {loading && <CardSkeleton count={4} withImage />}
      {!loading && error && <ErrorCard error={error} />}

      {!loading && !error && data && data.length === 0 && (
        <EmptyState
          emoji="📹"
          title="No hay sesiones grabadas aún"
          description="Próximamente contenido exclusivo"
        />
      )}

      {!loading && !error && data && data.length > 0 && (
        <ul className="space-y-4">
          {data.map((item) =>
            item.kind === 'webinar' ? (
              <li key={`w-${item.row.id}`}>
                <WebinarCard webinar={item.row} />
              </li>
            ) : (
              <li key={`v-${item.row.id}`}>
                <VideoCard
                  video={item.row}
                  unlocked={item.unlocked}
                  progressPct={item.progressPct}
                />
              </li>
            ),
          )}
        </ul>
      )}
    </section>
  );
}

function WebinarCard({ webinar: w }: { webinar: WebinarRow }) {
  return (
    <article className="card p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent-orange/15 text-accent-orange border border-accent-orange/30">
          Grabación
        </span>
        {w.duration && <span className="text-xs text-ink/40">{w.duration}</span>}
      </div>
      <h3 className="font-bold font-serif text-base mb-1">{w.title}</h3>
      {w.description && (
        <p className="text-xs text-ink/50 mb-3 leading-relaxed line-clamp-2">{w.description}</p>
      )}
      <div className="flex items-center gap-1.5 mb-3">
        <Calendar className="w-3.5 h-3.5 text-accent-blue" strokeWidth={2} />
        <span className="text-xs text-accent-blue">{formatEventDate(w.date, w.time)}</span>
      </div>
      {w.zoom_url ? (
        <a
          href={w.zoom_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-grad w-full py-2.5 rounded-xl text-sm text-center block flex items-center justify-center gap-2"
        >
          <ExternalLink className="w-4 h-4" strokeWidth={2} />
          Ver grabación
        </a>
      ) : (
        <button
          disabled
          className="w-full py-2.5 rounded-xl text-sm font-medium text-ink/40 cursor-default"
          style={{ background: 'rgba(42,32,26,.05)', border: '1px solid rgba(42,32,26,.1)' }}
        >
          Próximamente
        </button>
      )}
    </article>
  );
}
