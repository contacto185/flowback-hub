import { useState } from 'react';
import { Plus, VideoOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAdminVideos } from '@/hooks/admin/useAdminVideos';
import type { VideoRow } from '@/lib/types';
import CardSkeleton from '@/components/CardSkeleton';
import EmptyState from '@/components/EmptyState';
import ErrorCard from '@/components/ErrorCard';
import AdminListRow from '@/components/admin/AdminListRow';
import AdminFormSheet from '@/components/admin/AdminFormSheet';
import FormField from '@/components/admin/FormField';
import ThumbnailField from '@/components/admin/ThumbnailField';

type Mode = { kind: 'closed' } | { kind: 'create' } | { kind: 'edit'; row: VideoRow };

export default function AdminVideos() {
  const { data, loading, error, refetch } = useAdminVideos();
  const [mode, setMode] = useState<Mode>({ kind: 'closed' });

  async function handleDelete(row: VideoRow) {
    if (!confirm(`¿Eliminar el video "${row.title}"? No se puede deshacer.`)) return;
    const { error: err } = await supabase.from('videos').delete().eq('id', row.id);
    if (err) {
      alert('Error al eliminar: ' + err.message);
      return;
    }
    refetch();
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold uppercase tracking-wider text-ink/50">
          Videos {data && <span className="text-ink/30 font-normal">({data.length})</span>}
        </p>
        <button
          type="button"
          onClick={() => setMode({ kind: 'create' })}
          className="btn-grad text-xs px-3 py-2 rounded-xl flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          Agregar
        </button>
      </div>

      {loading && <CardSkeleton count={3} />}
      {!loading && error && <ErrorCard error={error} retry={refetch} />}

      {!loading && !error && data && data.length === 0 && (
        <EmptyState
          icon={VideoOff}
          title="No hay videos creados aún"
          description="Agregá el primero con el botón + Agregar"
        />
      )}

      {!loading && !error && data && data.length > 0 && (
        <ul className="space-y-2.5">
          {data.map((row) => (
            <li key={row.id}>
              <AdminListRow
                title={row.title}
                subtitle={`${row.tier_required ?? 'free'} · ${row.duration ?? '—'}`}
                active={row.is_active !== false}
                onEdit={() => setMode({ kind: 'edit', row })}
                onDelete={() => handleDelete(row)}
              />
            </li>
          ))}
        </ul>
      )}

      <VideoFormSheet
        mode={mode}
        onClose={() => setMode({ kind: 'closed' })}
        onSaved={() => {
          setMode({ kind: 'closed' });
          refetch();
        }}
      />
    </>
  );
}

interface FormProps {
  mode:    Mode;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  title:         string;
  description:   string;
  vimeo_url:     string;
  duration:      string;
  thumbnail_url: string;
  tier_required: string;
  order_index:   string;     // text input, parsed on save
  is_active:     boolean;
}

const EMPTY: FormState = {
  title: '', description: '', vimeo_url: '', duration: '',
  thumbnail_url: '', tier_required: 'free', order_index: '0', is_active: true,
};

function VideoFormSheet({ mode, onClose, onSaved }: FormProps) {
  const open    = mode.kind !== 'closed';
  const editing = mode.kind === 'edit';
  const initial: FormState = mode.kind === 'edit' ? {
    title:         mode.row.title ?? '',
    description:   mode.row.description ?? '',
    vimeo_url:     mode.row.vimeo_url ?? '',
    duration:      mode.row.duration ?? '',
    thumbnail_url: mode.row.thumbnail_url ?? '',
    tier_required: mode.row.tier_required ?? 'free',
    order_index:   String(mode.row.order_index ?? 0),
    is_active:     mode.row.is_active !== false,
  } : EMPTY;

  // Reset form when mode changes — use key prop on the form
  const formKey = mode.kind === 'edit' ? `edit-${mode.row.id}` : 'create';
  return (
    <AdminFormSheet
      open={open}
      title={editing ? 'Editar video' : 'Agregar video'}
      onClose={onClose}
    >
      <VideoForm
        key={formKey}
        initial={initial}
        editId={mode.kind === 'edit' ? mode.row.id : null}
        onSaved={onSaved}
        onCancel={onClose}
      />
    </AdminFormSheet>
  );
}

function VideoForm({
  initial, editId, onSaved, onCancel,
}: { initial: FormState; editId: string | null; onSaved: () => void; onCancel: () => void }) {
  const [s, setS]               = useState<FormState>(initial);
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, val: FormState[K]) {
    setS((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!s.title.trim()) { setErr('El título es obligatorio'); return; }

    const payload = {
      title:         s.title.trim(),
      description:   s.description.trim() || null,
      vimeo_url:     s.vimeo_url.trim() || null,
      duration:      s.duration.trim() || null,
      thumbnail_url: s.thumbnail_url.trim() || null,
      tier_required: s.tier_required,
      order_index:   parseInt(s.order_index, 10) || 0,
      is_active:     s.is_active,
    };

    setSaving(true);
    const q = editId
      ? supabase.from('videos').update(payload).eq('id', editId).select()
      : supabase.from('videos').insert(payload).select();
    const { data, error } = await q;
    setSaving(false);

    if (error) {
      setErr(error.message);
      return;
    }
    if (!data || data.length === 0) {
      setErr('No se guardó (posible bloqueo por RLS). Revisá las policies de videos.');
      return;
    }
    onSaved();
  }

  return (
    <form onSubmit={handleSave}>
      <FormField label="Título" required>
        <input className="form-input" value={s.title} onChange={(e) => update('title', e.target.value)} autoFocus />
      </FormField>

      <FormField label="Descripción">
        <textarea
          className="form-input resize-y min-h-[80px]"
          rows={3}
          value={s.description}
          onChange={(e) => update('description', e.target.value)}
        />
      </FormField>

      <FormField label="URL Vimeo" hint="ej: https://vimeo.com/123456789">
        <input
          type="url"
          className="form-input"
          value={s.vimeo_url}
          onChange={(e) => update('vimeo_url', e.target.value)}
          placeholder="https://vimeo.com/..."
        />
      </FormField>

      <FormField label="Duración" hint="texto libre, ej: 45 min">
        <input
          className="form-input"
          value={s.duration}
          onChange={(e) => update('duration', e.target.value)}
          placeholder="45 min"
        />
      </FormField>

      <ThumbnailField
        value={s.thumbnail_url}
        onChange={(url) => update('thumbnail_url', url)}
        pathPrefix="admin/videos"
      />

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Tier requerido">
          <select
            className="form-input"
            value={s.tier_required}
            onChange={(e) => update('tier_required', e.target.value)}
          >
            <option value="free">free</option>
            <option value="basica">basica</option>
            <option value="vip">vip</option>
            <option value="premium">premium</option>
          </select>
        </FormField>
        <FormField label="Orden" hint="menor = primero">
          <input
            type="number"
            className="form-input"
            value={s.order_index}
            onChange={(e) => update('order_index', e.target.value)}
          />
        </FormField>
      </div>

      <FormField label="Estado">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={s.is_active}
            onChange={(e) => update('is_active', e.target.checked)}
            className="w-4 h-4 accent-accent-orange"
          />
          <span className="text-sm text-ink/70">Activo (visible para los usuarios)</span>
        </label>
      </FormField>

      {err && (
        <p className="text-xs text-red-500 mb-3 font-mono break-words">{err}</p>
      )}

      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex-1 py-3 rounded-xl text-sm font-medium bg-ink/[.06] hover:bg-ink/10 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-[2] btn-grad py-3 rounded-xl text-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? 'Guardando…' : editId ? 'Guardar cambios' : 'Crear video'}
        </button>
      </div>
    </form>
  );
}
