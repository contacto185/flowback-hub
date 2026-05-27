import { useState } from 'react';
import { Plus, Puzzle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAdminBloques, type LandingBlockRow } from '@/hooks/admin/useAdminBloques';
import CardSkeleton from '@/components/CardSkeleton';
import EmptyState from '@/components/EmptyState';
import ErrorCard from '@/components/ErrorCard';
import AdminListRow from '@/components/admin/AdminListRow';
import AdminFormSheet from '@/components/admin/AdminFormSheet';
import FormField from '@/components/admin/FormField';

type Section = 'benefits' | 'resources';
const SECTION_LABELS: Record<Section, string> = {
  benefits:  '🌱 Lo que obtendrás · Clases',
  resources: '🎁 Recursos destacados · Clases',
};
type Mode =
  | { kind: 'closed' }
  | { kind: 'create'; section: Section }
  | { kind: 'edit'; row: LandingBlockRow };

export default function AdminBloques() {
  const { data, loading, error, refetch } = useAdminBloques();
  const [mode, setMode] = useState<Mode>({ kind: 'closed' });

  async function handleDelete(row: LandingBlockRow) {
    if (!confirm(`¿Eliminar el bloque "${row.title}"? No se puede deshacer.`)) return;
    const { error: err } = await supabase.from('landing_blocks').delete().eq('id', row.id);
    if (err) { alert('Error al eliminar: ' + err.message); return; }
    refetch();
  }

  // Group by section
  const grouped: Record<Section, LandingBlockRow[]> = { benefits: [], resources: [] };
  (data ?? []).forEach((b) => {
    if (b.section === 'benefits' || b.section === 'resources') {
      grouped[b.section].push(b);
    }
  });

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold uppercase tracking-wider text-ink/50">
          Bloques de Landing {data && <span className="text-ink/30 font-normal">({data.length})</span>}
        </p>
      </div>

      {loading && <CardSkeleton count={3} />}
      {!loading && error && <ErrorCard error={error} retry={refetch} />}

      {!loading && !error && data && data.length === 0 && (
        <EmptyState
          icon={Puzzle}
          title="No hay bloques aún"
          description="Agregá uno con los botones por sección"
        />
      )}

      {!loading && !error && data && (
        <>
          {(Object.keys(SECTION_LABELS) as Section[]).map((section) => (
            <div key={section} className="mb-6">
              <div className="flex items-center justify-between mb-2 mt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-ink/40">
                  {SECTION_LABELS[section]}
                </p>
                <button
                  type="button"
                  onClick={() => setMode({ kind: 'create', section })}
                  className="btn-grad text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" strokeWidth={2.5} />
                  Agregar
                </button>
              </div>
              {grouped[section].length === 0 ? (
                <div className="card p-3 text-center">
                  <p className="text-xs text-ink/40">Sin bloques en esta sección</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {grouped[section].map((row) => (
                    <li key={row.id}>
                      <AdminListRow
                        title={`${row.emoji ?? row.icon ?? '•'}  ${row.title}`}
                        subtitle={[row.subtitle, row.url ? 'link' : null].filter(Boolean).join(' · ') || '—'}
                        active={row.is_active !== false}
                        onEdit={() => setMode({ kind: 'edit', row })}
                        onDelete={() => handleDelete(row)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </>
      )}

      <BloqueSheet
        mode={mode}
        onClose={() => setMode({ kind: 'closed' })}
        onSaved={() => { setMode({ kind: 'closed' }); refetch(); }}
      />
    </>
  );
}

interface FormState {
  section:      Section;
  emoji:        string;
  icon:         string;
  accent_color: string;
  title:        string;
  subtitle:     string;
  url:          string;
  order_index:  string;
  is_active:    boolean;
}

const EMPTY = (section: Section): FormState => ({
  section, emoji: '', icon: '', accent_color: '#F57C00',
  title: '', subtitle: '', url: '', order_index: '0', is_active: true,
});

function BloqueSheet({ mode, onClose, onSaved }: { mode: Mode; onClose: () => void; onSaved: () => void }) {
  const open    = mode.kind !== 'closed';
  const editing = mode.kind === 'edit';
  const initial: FormState = mode.kind === 'edit' ? {
    section:      (mode.row.section === 'resources' ? 'resources' : 'benefits') as Section,
    emoji:        mode.row.emoji ?? '',
    icon:         mode.row.icon ?? '',
    accent_color: mode.row.accent_color ?? '#F57C00',
    title:        mode.row.title ?? '',
    subtitle:     mode.row.subtitle ?? '',
    url:          mode.row.url ?? '',
    order_index:  String(mode.row.order_index ?? 0),
    is_active:    mode.row.is_active !== false,
  } : EMPTY(mode.kind === 'create' ? mode.section : 'benefits');
  const formKey = mode.kind === 'edit'
    ? `edit-${mode.row.id}`
    : mode.kind === 'create' ? `create-${mode.section}` : 'closed';
  const title = editing
    ? `Editar bloque · ${SECTION_LABELS[initial.section]}`
    : `Agregar bloque · ${SECTION_LABELS[initial.section]}`;

  return (
    <AdminFormSheet open={open} title={title} onClose={onClose}>
      <BloqueForm
        key={formKey}
        initial={initial}
        editId={mode.kind === 'edit' ? mode.row.id : null}
        onSaved={onSaved}
        onCancel={onClose}
      />
    </AdminFormSheet>
  );
}

function BloqueForm({
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

    const payload = {
      section:      s.section,
      emoji:        s.emoji.trim() || null,
      icon:         s.icon.trim() || null,
      accent_color: s.accent_color.trim() || null,
      title:        s.title.trim(),
      subtitle:     s.subtitle.trim() || null,
      url:          s.url.trim() || null,
      order_index:  Number.parseInt(s.order_index, 10) || 0,
      is_active:    s.is_active,
    };

    setSaving(true);
    const q = editId
      ? supabase.from('landing_blocks').update(payload).eq('id', editId).select()
      : supabase.from('landing_blocks').insert(payload).select();
    const { data, error } = await q;
    setSaving(false);
    if (error)                      { setErr(error.message); return; }
    if (!data || data.length === 0) { setErr('No se guardó (posible bloqueo por RLS en landing_blocks)'); return; }
    onSaved();
  }

  return (
    <form onSubmit={handleSave}>
      <FormField label="Sección">
        <select
          className="form-input"
          value={s.section}
          onChange={(e) => update('section', e.target.value as Section)}
        >
          <option value="benefits">benefits — "Lo que obtendrás"</option>
          <option value="resources">resources — "Recursos destacados"</option>
        </select>
      </FormField>

      <FormField label="Título" required>
        <input className="form-input" value={s.title} onChange={(e) => update('title', e.target.value)} autoFocus />
      </FormField>

      <FormField label="Subtítulo">
        <input className="form-input" value={s.subtitle} onChange={(e) => update('subtitle', e.target.value)} />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Emoji" hint="alternativa al icono">
          <input
            className="form-input"
            value={s.emoji}
            onChange={(e) => update('emoji', e.target.value)}
            placeholder="🏃"
            maxLength={4}
          />
        </FormField>
        <FormField label="Icono Lucide" hint="ej: play-circle">
          <input
            className="form-input"
            value={s.icon}
            onChange={(e) => update('icon', e.target.value)}
            placeholder="play-circle"
          />
        </FormField>
      </div>

      <FormField label="Color de acento (hex)" hint="usado en el fondo y borde del icono">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(s.accent_color) ? s.accent_color : '#F57C00'}
            onChange={(e) => update('accent_color', e.target.value)}
            className="w-12 h-10 rounded-lg border border-line cursor-pointer p-1 bg-white"
            aria-label="Selector de color"
          />
          <input
            type="text"
            className="form-input flex-1"
            value={s.accent_color}
            onChange={(e) => update('accent_color', e.target.value)}
            placeholder="#F57C00"
          />
        </div>
      </FormField>

      <FormField label="URL (opcional)" hint="convierte el bloque en un link externo">
        <input
          type="url"
          className="form-input"
          value={s.url}
          onChange={(e) => update('url', e.target.value)}
          placeholder="https://..."
        />
      </FormField>

      <FormField label="Orden">
        <input type="number" className="form-input" value={s.order_index} onChange={(e) => update('order_index', e.target.value)} />
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
          {saving ? 'Guardando…' : editId ? 'Guardar cambios' : 'Crear bloque'}
        </button>
      </div>
    </form>
  );
}
