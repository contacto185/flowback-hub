import { useState } from 'react';
import { Plus, GraduationCap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAdminCursos } from '@/hooks/admin/useAdminCursos';
import type { CourseRow } from '@/lib/types';
import CardSkeleton from '@/components/CardSkeleton';
import EmptyState from '@/components/EmptyState';
import ErrorCard from '@/components/ErrorCard';
import AdminListRow from '@/components/admin/AdminListRow';
import AdminFormSheet from '@/components/admin/AdminFormSheet';
import FormField from '@/components/admin/FormField';
import ThumbnailField from '@/components/admin/ThumbnailField';

type Mode = { kind: 'closed' } | { kind: 'create' } | { kind: 'edit'; row: CourseRow };

export default function AdminCursos() {
  const { data, loading, error, refetch } = useAdminCursos();
  const [mode, setMode] = useState<Mode>({ kind: 'closed' });

  async function handleDelete(row: CourseRow) {
    if (!confirm(`¿Eliminar el curso "${row.title}"? No se puede deshacer.`)) return;
    const { error: err } = await supabase.from('courses').delete().eq('id', row.id);
    if (err) { alert('Error al eliminar: ' + err.message); return; }
    refetch();
  }

  function formatPrice(c: CourseRow): string {
    if (!c.price) return 'gratis';
    return `${Number(c.price).toLocaleString('es-CL')} ${c.currency ?? 'CLP'}`;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold uppercase tracking-wider text-ink/50">
          Cursos {data && <span className="text-ink/30 font-normal">({data.length})</span>}
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
          icon={GraduationCap}
          title="No hay cursos creados aún"
          description="Agregá el primero con el botón + Agregar"
        />
      )}

      {!loading && !error && data && data.length > 0 && (
        <ul className="space-y-2.5">
          {data.map((row) => (
            <li key={row.id}>
              <AdminListRow
                title={row.title}
                subtitle={`${formatPrice(row)} · ${row.tier_required ?? 'free'}`}
                active={row.is_active !== false}
                onEdit={() => setMode({ kind: 'edit', row })}
                onDelete={() => handleDelete(row)}
              />
            </li>
          ))}
        </ul>
      )}

      <CursoFormSheet
        mode={mode}
        onClose={() => setMode({ kind: 'closed' })}
        onSaved={() => { setMode({ kind: 'closed' }); refetch(); }}
      />
    </>
  );
}

interface FormState {
  title:          string;
  description:    string;
  thumbnail_url:  string;
  instructor:     string;
  duration_hours: string;
  tier_required:  string;
  price:          string;
  currency:       string;
  vimeo_url:      string;
  landing_url:    string;
  order_index:    string;
  is_active:      boolean;
}

const EMPTY: FormState = {
  title: '', description: '', thumbnail_url: '', instructor: '',
  duration_hours: '', tier_required: 'free', price: '', currency: 'CLP',
  vimeo_url: '', landing_url: '', order_index: '0', is_active: true,
};

function CursoFormSheet({ mode, onClose, onSaved }: { mode: Mode; onClose: () => void; onSaved: () => void }) {
  const open    = mode.kind !== 'closed';
  const editing = mode.kind === 'edit';
  const initial: FormState = mode.kind === 'edit' ? {
    title:          mode.row.title ?? '',
    description:    mode.row.description ?? '',
    thumbnail_url:  mode.row.thumbnail_url ?? '',
    instructor:     mode.row.instructor ?? '',
    duration_hours: mode.row.duration_hours == null ? '' : String(mode.row.duration_hours),
    tier_required:  mode.row.tier_required ?? 'free',
    price:          mode.row.price == null ? '' : String(mode.row.price),
    currency:       mode.row.currency ?? 'CLP',
    vimeo_url:      mode.row.vimeo_url ?? '',
    landing_url:    mode.row.landing_url ?? '',
    order_index:    String(mode.row.order_index ?? 0),
    is_active:      mode.row.is_active !== false,
  } : EMPTY;
  const formKey = mode.kind === 'edit' ? `edit-${mode.row.id}` : 'create';

  return (
    <AdminFormSheet open={open} title={editing ? 'Editar curso' : 'Agregar curso'} onClose={onClose}>
      <CursoForm
        key={formKey}
        initial={initial}
        editId={mode.kind === 'edit' ? mode.row.id : null}
        onSaved={onSaved}
        onCancel={onClose}
      />
    </AdminFormSheet>
  );
}

function CursoForm({
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
    if (!s.title.trim()) { setErr('El título es obligatorio'); return; }

    // Strict coerce: courses table is type-strict (NUMERIC for price/duration_hours)
    const priceNum    = s.price.trim() === '' ? null : Number.parseFloat(s.price);
    const durationNum = s.duration_hours.trim() === '' ? null : Number.parseFloat(s.duration_hours);
    if (s.price.trim() !== '' && (priceNum == null || Number.isNaN(priceNum))) {
      setErr('El precio debe ser un número'); return;
    }
    if (s.duration_hours.trim() !== '' && (durationNum == null || Number.isNaN(durationNum))) {
      setErr('La duración debe ser un número'); return;
    }

    const payload = {
      title:          s.title.trim(),
      description:    s.description.trim() || null,
      thumbnail_url:  s.thumbnail_url.trim() || null,
      instructor:     s.instructor.trim() || null,
      duration_hours: durationNum,
      tier_required:  s.tier_required,
      price:          priceNum,
      currency:       (s.currency.trim() || 'CLP').substring(0, 3).toUpperCase(),
      vimeo_url:      s.vimeo_url.trim() || null,
      landing_url:    s.landing_url.trim() || null,
      order_index:    Number.parseInt(s.order_index, 10) || 0,
      is_active:      s.is_active,
    };

    setSaving(true);
    const q = editId
      ? supabase.from('courses').update(payload).eq('id', editId).select()
      : supabase.from('courses').insert(payload).select();
    const { data, error } = await q;
    setSaving(false);
    if (error)                      { setErr(error.message); return; }
    if (!data || data.length === 0) { setErr('No se guardó (posible bloqueo por RLS en courses)'); return; }
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

      <ThumbnailField
        value={s.thumbnail_url}
        onChange={(url) => update('thumbnail_url', url)}
        pathPrefix="admin/cursos"
      />

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Instructor">
          <input className="form-input" value={s.instructor} onChange={(e) => update('instructor', e.target.value)} />
        </FormField>
        <FormField label="Duración (horas)">
          <input
            type="number"
            step="0.5"
            className="form-input"
            value={s.duration_hours}
            onChange={(e) => update('duration_hours', e.target.value)}
            placeholder="ej: 8"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Precio">
          <input
            type="number"
            step="0.01"
            className="form-input"
            value={s.price}
            onChange={(e) => update('price', e.target.value)}
            placeholder="ej: 35000"
          />
        </FormField>
        <FormField label="Moneda">
          <input
            className="form-input"
            value={s.currency}
            onChange={(e) => update('currency', e.target.value)}
            placeholder="CLP"
            maxLength={3}
          />
        </FormField>
      </div>

      <FormField label="Tier requerido">
        <select className="form-input" value={s.tier_required} onChange={(e) => update('tier_required', e.target.value)}>
          <option value="free">free</option>
          <option value="basica">basica</option>
          <option value="vip">vip</option>
          <option value="premium">premium</option>
        </select>
      </FormField>

      <FormField label="URL Vimeo preview">
        <input
          type="url"
          className="form-input"
          value={s.vimeo_url}
          onChange={(e) => update('vimeo_url', e.target.value)}
          placeholder="https://vimeo.com/..."
        />
      </FormField>

      <FormField label="URL Landing page">
        <input
          type="url"
          className="form-input"
          value={s.landing_url}
          onChange={(e) => update('landing_url', e.target.value)}
          placeholder="https://..."
        />
      </FormField>

      <FormField label="Orden" hint="menor = primero">
        <input
          type="number"
          className="form-input"
          value={s.order_index}
          onChange={(e) => update('order_index', e.target.value)}
        />
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
          {saving ? 'Guardando…' : editId ? 'Guardar cambios' : 'Crear curso'}
        </button>
      </div>
    </form>
  );
}
