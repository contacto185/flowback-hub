import { useAuth } from '@/hooks/useAuth';
import { canAccessTier } from '@/lib/supabase';
import { useAgenda } from '@/hooks/useAgenda';
import CardSkeleton from '@/components/CardSkeleton';
import EmptyState from '@/components/EmptyState';
import ErrorCard from '@/components/ErrorCard';
import TierGate from '@/components/TierGate';
import VideoCard from '@/components/VideoCard';

export default function Agenda() {
  const { userProfile, isLoading: authLoading } = useAuth();

  // Tier gate. Wait until auth resolves so we don't flash the gate.
  if (authLoading) {
    return (
      <section className="py-2">
        <Header />
        <CardSkeleton count={3} withImage />
      </section>
    );
  }
  if (!canAccessTier(userProfile?.tier, 'basica')) {
    return (
      <section className="py-2">
        <Header />
        <TierGate requiredTier="basica" sectionName="la Agenda" />
      </section>
    );
  }

  return <AgendaContent />;
}

function Header() {
  return (
    <header className="mb-5">
      <h1 className="font-serif text-2xl font-black leading-tight mb-1">
        Tu <span className="grad-text">agenda</span>
      </h1>
      <p className="text-xs text-ink/40">Clases grabadas de tu membresía</p>
    </header>
  );
}

function AgendaContent() {
  const { data, loading, error } = useAgenda();

  return (
    <section className="py-2">
      <Header />

      {loading && <CardSkeleton count={4} withImage />}
      {!loading && error && <ErrorCard error={error} />}

      {!loading && !error && data && data.length === 0 && (
        <EmptyState
          emoji="🎬"
          title="No hay clases disponibles aún"
          description="Próximamente nuevo contenido para miembros"
        />
      )}

      {!loading && !error && data && data.length > 0 && (
        <ul className="space-y-4">
          {data.map((v) => (
            <li key={v.id}>
              <VideoCard video={v} unlocked={v.unlocked} progressPct={v.progressPct} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
