import { Link } from 'react-router-dom';
import { FileText, ExternalLink, FolderOpen, Download, HardDrive } from 'lucide-react';
import { useDocumentos, type DocumentoItem } from '@/hooks/useDocumentos';
import CardSkeleton from '@/components/CardSkeleton';
import EmptyState from '@/components/EmptyState';
import ErrorCard from '@/components/ErrorCard';

const TIER_LABEL: Record<string, string> = {
  basica: 'Básica', vip: 'VIP', premium: 'Premium',
};
const TIER_STYLES: Record<string, string> = {
  basica:  'bg-accent-blue/15  text-accent-blue',
  vip:     'bg-accent-purple/15 text-accent-purple',
  premium: 'bg-accent-orange/15 text-accent-orange',
};

export default function Documentos() {
  const { accessible, lockedCount, loading, error } = useDocumentos();

  return (
    <section className="py-2">
      <header className="mb-5">
        <h1 className="font-serif text-2xl font-black leading-tight mb-1">
          Tus <span className="grad-text">documentos</span>
        </h1>
        <p className="text-xs text-ink/40">Guías, recetas y materiales descargables</p>
      </header>

      {loading && <CardSkeleton count={3} />}
      {!loading && error && <ErrorCard error={error} />}

      {!loading && !error && accessible.length === 0 && (
        <>
          <EmptyState
            icon={FolderOpen}
            title="No hay documentos disponibles aún"
            description={
              lockedCount > 0
                ? `Hay ${lockedCount} documento${lockedCount === 1 ? '' : 's'} en planes superiores`
                : 'Próximamente más material descargable'
            }
          />
          {lockedCount > 0 && (
            <Link
              to="/mi-cuenta"
              className="block w-full text-center btn-grad py-2.5 rounded-xl text-sm mt-3"
            >
              Ver planes →
            </Link>
          )}
        </>
      )}

      {!loading && !error && accessible.length > 0 && (
        <ul className="space-y-3">
          {accessible.map((d) => (
            <li key={d.id}>
              <DocCard doc={d} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function pickIcon(url: string | null) {
  if (!url) return FileText;
  if (/\.pdf(\?|$)/i.test(url))           return FileText;
  if (/drive\.google\.com/i.test(url))    return HardDrive;
  return FileText;
}

function pickCtaLabel(url: string | null): string {
  if (!url) return 'Abrir documento';
  if (/\.(pdf|docx?|xlsx?|pptx?|zip)(\?|$)/i.test(url)) return 'Descargar';
  return 'Abrir documento';
}

function DocCard({ doc: d }: { doc: DocumentoItem }) {
  const Icon  = pickIcon(d.drive_url);
  const label = pickCtaLabel(d.drive_url);
  const tier  = (d.tier_required ?? 'free').toLowerCase();
  const showTier = tier && tier !== 'free';

  return (
    <article className="card p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl grid place-items-center flex-shrink-0 bg-accent-blue/15">
          <Icon className="w-5 h-5 text-accent-blue" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base font-serif text-ink mb-1">{d.title}</h3>
          {d.description && (
            <p className="text-xs text-ink/50 leading-relaxed line-clamp-2">{d.description}</p>
          )}
        </div>
        {showTier && (
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${TIER_STYLES[tier] ?? TIER_STYLES.basica}`}
          >
            {TIER_LABEL[tier] ?? tier}
          </span>
        )}
      </div>

      {d.drive_url ? (
        <a
          href={d.drive_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-grad w-full py-2.5 rounded-xl text-sm text-center block flex items-center justify-center gap-2"
        >
          {label === 'Descargar' ? (
            <Download className="w-4 h-4" strokeWidth={2} />
          ) : (
            <ExternalLink className="w-4 h-4" strokeWidth={2} />
          )}
          {label}
        </a>
      ) : (
        <button
          disabled
          className="w-full py-2.5 rounded-xl text-sm font-medium text-ink/40 cursor-default"
          style={{ background: 'rgba(42,32,26,.05)', border: '1px solid rgba(42,32,26,.1)' }}
        >
          URL no disponible
        </button>
      )}
    </article>
  );
}
