import { useState, type ChangeEvent } from 'react';
import { ImageIcon, Trash2, Copy, Check, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAdminImagenes, type ImagenItem } from '@/hooks/admin/useAdminImagenes';
import CardSkeleton from '@/components/CardSkeleton';
import EmptyState from '@/components/EmptyState';
import ErrorCard from '@/components/ErrorCard';

export default function AdminImagenes() {
  const { data, loading, error, refetch } = useAdminImagenes();
  const [uploading, setUploading]   = useState(false);
  const [uploadErr, setUploadErr]   = useState<string | null>(null);

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadErr(null);
    setUploading(true);

    const safeName = file.name.replace(/[^\w.\-]+/g, '_');
    const path     = `admin/galeria/${Date.now()}-${safeName}`;
    const { error: upErr } = await supabase.storage
      .from('thumbnails')
      .upload(path, file, { upsert: true, contentType: file.type });

    setUploading(false);
    e.target.value = '';
    if (upErr) {
      setUploadErr(upErr.message);
      return;
    }
    refetch();
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold uppercase tracking-wider text-ink/50">
          Galería {data && <span className="text-ink/30 font-normal">({data.length})</span>}
        </p>
        <label className="btn-grad text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer">
          <Upload className="w-3.5 h-3.5" strokeWidth={2.5} />
          {uploading ? 'Subiendo…' : 'Subir'}
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {uploadErr && (
        <p className="text-xs text-red-500 mb-3 font-mono break-words">{uploadErr}</p>
      )}

      {loading && <CardSkeleton count={4} withImage />}
      {!loading && error && <ErrorCard error={error} retry={refetch} />}

      {!loading && !error && data && data.length === 0 && (
        <EmptyState
          icon={ImageIcon}
          title="No hay imágenes en la galería"
          description="Subí una con el botón arriba o desde los thumbnails de Videos/Cursos"
        />
      )}

      {!loading && !error && data && data.length > 0 && (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {data.map((it) => (
            <li key={it.path}>
              <ImagenCard item={it} onChanged={refetch} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function ImagenCard({ item, onChanged }: { item: ImagenItem; onChanged: () => void }) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(item.publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert('No se pudo copiar al clipboard');
    }
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar la imagen "${item.name}"? No se puede deshacer.`)) return;
    setDeleting(true);
    const { error } = await supabase.storage.from('thumbnails').remove([item.path]);
    setDeleting(false);
    if (error) {
      alert('Error al eliminar: ' + error.message);
      return;
    }
    onChanged();
  }

  return (
    <article className="card overflow-hidden p-0">
      <div className="aspect-square bg-ink/[.04]">
        <img
          src={item.publicUrl}
          alt={item.name}
          loading="lazy"
          className="w-full h-full object-cover"
          onError={(ev) => {
            const img = ev.currentTarget;
            img.onerror = null;
            img.style.display = 'none';
          }}
        />
      </div>
      <div className="p-2">
        <p className="text-[10px] text-ink/40 truncate mb-1.5" title={item.path}>{item.name}</p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={copyUrl}
            className="flex-1 text-[10px] px-1.5 py-1 rounded-md bg-ink/[.06] hover:bg-ink/10 transition-colors flex items-center justify-center gap-1"
            aria-label="Copiar URL"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-green-600" strokeWidth={2.5} />
                <span className="text-green-700">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" strokeWidth={2} />
                Copiar
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-[10px] px-2 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 transition-colors disabled:opacity-50"
            aria-label="Eliminar"
          >
            <Trash2 className="w-3 h-3 text-red-500" strokeWidth={2} />
          </button>
        </div>
      </div>
    </article>
  );
}
