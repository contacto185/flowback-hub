import { AlertTriangle } from 'lucide-react';

interface Props {
  error:  Error | null;
  /** Optional retry handler — if provided, shows a "Reintentar" button */
  retry?: () => void;
  title?: string;
}

export default function ErrorCard({ error, retry, title = 'Error al cargar' }: Props) {
  return (
    <div
      className="card p-6 text-center mt-4"
      style={{ borderColor: 'rgba(245,124,0,.3)' }}
    >
      <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-accent-orange" strokeWidth={2} />
      <p className="font-semibold text-ink mb-1">{title}</p>
      {error?.message && (
        <p className="text-xs text-ink/50 font-mono break-all mb-3">{error.message}</p>
      )}
      {retry && (
        <button onClick={retry} className="btn-grad text-xs px-4 py-2 rounded-xl">
          Reintentar
        </button>
      )}
    </div>
  );
}
