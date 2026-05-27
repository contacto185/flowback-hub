import { useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAdminDocs } from '@/hooks/admin/useAdminDocs';
import type { DocumentRow } from '@/lib/types';
import CardSkeleton from '@/components/CardSkeleton';
import EmptyState from '@/components/EmptyState';
import ErrorCard from '@/components/ErrorCard';
import AdminListRow from '@/components/admin/AdminListRow';
import AdminFormSheet from '@/components/admin/AdminFormSheet';
import FormField from '@/components/admin/FormField';
import FileField from '@/components/admin/FileField';

type Mode = { kind: 'closed' } | { kind: 'create' } | { kind: 'edit'; row: DocumentRow };

export default function AdminDocs() {
  const { data, loading, error, refetch } = useAdminDocs();
  const [mode, setMode] = useState<Mode>({ kind: 'closed' });

  async function handleDelete(row: DocumentRow) {
    if (!confirm(`¿Eliminar el documento "${row.title}"? No se puede deshacer.`)) return;
    const { error: err } = await supabase.from('documents').delete().eq('id', row.id);
    if (err) { alert('Error al eliminar: ' + err.message); return; }
    refetch();
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold uppercase tracking-wider text-ink/50">
          Documentos {data && <span className="text-ink/30 font-normal">({data.length})</span>}
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
          icon={FileText}
          title="No hay documentos creados aún"
          description="Agregá el primero con el botón + Agregar"
        />
      )}
      {!loading && !error && data && data.length > 0 && (
        <ul className="space-y-2.5">
          {data.map((row) => (
            <li key={row.id}>
              <AdminListRow
                title={row.title}
                subtitle={`${row.tier_required ?? 'free'} · ${row.drive_url ? 'con archivo' : 'sin URL'}`}
                active={row.is_active !== false}
                onEdit={() => setMode({ kind: 'edit', row })}
                onDelete={() => handleDelete(row)}
              />
            </li>
          ))}
        </ul>
      )}

      <DocSheet
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
  drive_url:     string;
  tier_required: string;
  is_active:     boolean;
}

const EMPTY: FormState = {
  title: '', description: '', drive_url: '', tier_required: 'free', is_active: true,
};

function DocSheet({ mode, onClose, onSaved }: { mode: Mode; onClose: () => void; onSaved: () => void }) {
  const open    = mode.kind !== 'closed';
  const editing = mode.kind === 'edit';
  const initial: FormState = mode.kind === 'edit' ? {
    title:         mode.row.title ?? '',
    description:   mode.row.description ?? '',
    drive_url:     mode.row.drive_url ?? '',
    tier_required: mode.row.tier_required ?? 'free',
    is_active:     mode.row.is_active !== false,
  } : EMPTY;
  const formKey = mode.kind === 'edit' ? `edit-${mode.row.id}` : 'create';

  return (
    <AdminFormSheet open={open} title={editing ? 'Editar documento' : 'Agregar documento'} onClose={onClose}>
      <DocForm
        key={formKey}
        initial={initial}
        editId={mode.kind === 'edit' ? mode.row.id : null}
        onSaved={onSaved}
        onCancel={onClose}
      />
    </AdminFormSheet>
  );
}

function DocForm({
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
    if (!s.title.trim())     { setErr('El título es obligatorio'); return; }
    if (!s.drive_url.trim()) { setErr('Subí un archivo o pegá una URL'); return; }

    const payload = {
      title:         s.title.trim(),
      description:   s.description.trim() || null,
      drive_url:     s.drive_url.trim(),
      tier_required: s.tier_required,
      is_active:     s.is_active,
    };

    setSaving(true);
    const q = editId
      ? supabase.from('documents').update(payload).eq('id', editId).select()
      : supabase.from('documents').insert(payload).select();
    const { data, error } = await q;
    setSaving(false);
    if (error)                      { setErr(error.message); return; }
    if (!data || data.length === 0) { setErr('No se guardó (posible bloqueo por RLS en documents)'); return; }
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

      <FileField
        label="Archivo / URL"
        value={s.drive_url}
        onChange={(url) => update('drive_url', url)}
        bucket="documents"
        pathPrefix="admin/docs"
        hint="PDF, DOC, ZIP… o pegá una URL de Google Drive"
      />

      <FormField label="Tier requerido" hint="quién puede descargar este documento">
        <select className="form-input" value={s.tier_required} onChange={(e) => update('tier_required', e.target.value)}>
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
          {saving ? 'Guardando…' : editId ? 'Guardar cambios' : 'Crear documento'}
        </button>
      </div>
    </form>
  );
}
