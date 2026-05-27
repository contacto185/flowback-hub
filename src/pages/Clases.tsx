import { VideoOff } from 'lucide-react';
import { useClases } from '@/hooks/useClases';
import CardSkeleton from '@/components/CardSkeleton';
import EmptyState from '@/components/EmptyState';
import ErrorCard from '@/components/ErrorCard';
import VideoCard from '@/components/VideoCard';

export default function Clases() {
  const { data, loading, error } = useClases();

  return (
    <section className="py-2">
      <header className="mb-5">
        <h1 className="font-serif text-2xl font-black leading-tight mb-1">
          Clases <span className="grad-text">gratuitas</span>
        </h1>
        <p className="text-xs text-ink/40">Comienza tu transformación hoy, sin costo</p>
      </header>

      {loading && <CardSkeleton count={3} withImage />}
      {!loading && error && <ErrorCard error={error} />}

      {!loading && !error && data && data.length === 0 && (
        <EmptyState
          icon={VideoOff}
          title="Sin clases por ahora"
          description="Próximamente nuevas clases gratuitas"
        />
      )}

      {!loading && !error && data && data.length > 0 && (
        <ul className="space-y-4">
          {data.map((v) => (
            <li key={v.id}>
              <VideoCard video={v} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
