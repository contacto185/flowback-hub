import { useState } from 'react';
import { Plus, CalendarX } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAdminEventos, type AdminEventoRow } from '@/hooks/admin/useAdminEventos';
import CardSkeleton from '@/components/CardSkeleton';
import EmptyState from '@/components/EmptyState';
import ErrorCard from '@/components/ErrorCard';
import AdminListRow from '@/components/admin/AdminListRow';
import AdminFormSheet from '@/components/admin/AdminFormSheet';
import FormField from '@/components/admin/FormField';
import ThumbnailField from '@/components/admin/ThumbnailField';

type Mode = { kind: 'closed' } | { kind: 'create' } | { kind: 'edit'; row: AdminEventoRow };

export default function AdminEventos() {
  const { data, loading, error, refetch } = useAdminEventos();
  const [mode, setMode] = useState<Mode>({ kind: 'closed' });

  async function handleDelete(row: AdminEventoRow) {
    if (!confirm(`¿Eliminar el evento "${row.title}"? No se puede deshacer.`)) return;
    const { error: err } = await supabase.from('events').delete().eq('id', row.id);
    if (err) { alert('Error al eliminar: ' + err.message); return; }
    refetch();
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold uppercase tracking-wider text-ink/50">
          Eventos {data && <span className="text-ink/30 font-normal">({data.length})</span>}
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
          icon={CalendarX}
          title="No hay eventos creados aún"
          description="Agregá el primero con el botón + Agregar"
        />
      )}

      {!loading && !error && data && data.length > 0 && (
        <ul className="space-y-2.5">
          {data.map((row) => (
            <li key={row.id}>
              <AdminListRow
                title={row.title}
                subtitle={`${row.event_date}${row.event_time ? ' · ' + row.event_time.slice(0, 5) : ''} · ${row.type ?? '—'}`}
                active={row.is_active !== false}
                onEdit={() => setMode({ kind: 'edit', row })}
                onDelete={() => handleDelete(row)}
              />
            </li>
          ))}
        </ul>
      )}

      <EventoFormSheet
        mode={mode}
        onClose={() => setMode({ kind: 'closed' })}
        onSaved={() => { setMode({ kind: 'closed' }); refetch(); }}
      />
    </>
  );
}

interface FormState {
  title:         string;
  description:   string;
  event_date:    string;
  event_time:    string;
  duration:      string;
  type:          'online' | 'presencial';
  zoom_url:      string;
  location:      string;
  thumbnail_url: string;
  tier_required: string;
  is_active:     boolean;
}

const EMPTY: FormState = {
  title: '', description: '', event_date: '', event_time: '', duration: '',
  type: 'online', zoom_url: '', location: '', thumbnail_url: '',
  tier_required: 'free', is_active: true,
};

function EventoFormSheet({ mode, onClose, onSaved }: { mode: Mode; onClose: () => void; onSaved: () => void }) {
  const open    = mode.kind !== 'closed';
  const editing = mode.kind === 'edit';
  const initial: FormState = mode.kind === 'edit' ? {
    title:         mode.row.title ?? '',
    description:   mode.row.description ?? '',
    event_date:    mode.row.event_date ?? '',
    event_time:    mode.row.event_time ?? '',
    duration:      mode.row.duration ?? '',
    type:          (mode.row.type === 'presencial' ? 'presencial' : 'online'),
    zoom_url:      mode.row.zoom_url ?? '',
    location:      mode.row.location ?? '',
    thumbnail_url: mode.row.thumbnail_url ?? '',
    tier_required: mode.row.tier_required ?? 'free',
    is_active:     mode.row.is_active !== false,
  } : EMPTY;
  const formKey = mode.kind === 'edit' ? `edit-${mode.row.id}` : 'create';

  return (
    <AdminFormSheet open={open} title={editing ? 'Editar evento' : 'Agregar evento'} onClose={onClose}>
      <EventoForm
        key={formKey}
        initial={initial}
        editId={mode.kind === 'edit' ? mode.row.id : null}
        onSaved={onSaved}
        onCancel={onClose}
      />
    </AdminFormSheet>
  );
}

function EventoForm({
  initial, editId, onSaved, onCancel,
}: { initial: FormState; editId: string | null; onSaved: () => void; onCancel: () => void }) {
  const [s, setS]           = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, val: FormState[K]) {
    setS((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!s.title.trim())  { setErr('El título es obligatorio');  return; }
    if (!s.event_date)    { setErr('La fecha es obligatoria');   return; }

    const payload = {
      title:         s.title.trim(),
      description:   s.description.trim() || null,
      event_date:    s.event_date,
      event_time:    s.event_time || null,
      duration:      s.duration.trim() || null,
      type:          s.type,
      zoom_url:      s.zoom_url.trim() || null,
      location:      s.location.trim() || null,
      thumbnail_url: s.thumbnail_url.trim() || null,
      tier_required: s.tier_required,
      is_active:     s.is_active,
    };

    setSaving(true);
    const q = editId
      ? supabase.from('events').update(payload).eq('id', editId).select()
      : supabase.from('events').insert(payload).select();
    const { data, error } = await q;
    setSaving(false);
    if (error)                    { setErr(error.message); return; }
    if (!data || data.length === 0) { setErr('No se guardó (posible bloqueo por RLS en events)'); return; }
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

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Fecha" required>
          <input
            type="date"
            className="form-input"
            value={s.event_date}
            onChange={(e) => update('event_date', e.target.value)}
          />
        </FormField>
        <FormField label="Hora">
          <input
            type="time"
            className="form-input"
            value={s.event_time}
            onChange={(e) => update('event_time', e.target.value)}
          />
        </FormField>
      </div>

      <FormField label="Duración" hint="texto libre, ej: 2h">
        <input className="form-input" value={s.duration} onChange={(e) => update('duration', e.target.value)} placeholder="2h" />
      </FormField>

      <FormField label="Tipo">
        <select
          className="form-input"
          value={s.type}
          onChange={(e) => update('type', e.target.value as 'online' | 'presencial')}
        >
          <option value="online">online</option>
          <option value="presencial">presencial</option>
        </select>
      </FormField>

      {s.type === 'online' ? (
        <FormField label="URL Zoom">
          <input
            type="url"
            className="form-input"
            value={s.zoom_url}
            onChange={(e) => update('zoom_url', e.target.value)}
            placeholder="https://us02web.zoom.us/..."
          />
        </FormField>
      ) : (
        <FormField label="Lugar">
          <input
            className="form-input"
            value={s.location}
            onChange={(e) => update('location', e.target.value)}
            placeholder="Dirección, ciudad"
          />
        </FormField>
      )}

      <ThumbnailField
        value={s.thumbnail_url}
        onChange={(url) => update('thumbnail_url', url)}
        pathPrefix="admin/eventos"
      />

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

      {err && <p className="text-xs text-red-500 mb-3 font-mono break-words">{err}</p>}

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
          {saving ? 'Guardando…' : editId ? 'Guardar cambios' : 'Crear evento'}
        </button>
      </div>
    </form>
  );
}
