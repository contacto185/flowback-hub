import { useState } from 'react';
import { Pencil, Diamond } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAdminPlanes, type PlanRow } from '@/hooks/admin/useAdminPlanes';
import CardSkeleton from '@/components/CardSkeleton';
import EmptyState from '@/components/EmptyState';
import ErrorCard from '@/components/ErrorCard';
import AdminFormSheet from '@/components/admin/AdminFormSheet';
import FormField from '@/components/admin/FormField';
import FeaturesField from '@/components/admin/FeaturesField';

type Mode = { kind: 'closed' } | { kind: 'edit'; row: PlanRow };

const TIER_STYLES: Record<string, string> = {
  basica:  'bg-accent-blue/15  text-accent-blue',
  vip:     'bg-accent-purple/15 text-accent-purple',
  premium: 'bg-accent-orange/15 text-accent-orange',
};

export default function AdminPlanes() {
  const { data, loading, error, refetch } = useAdminPlanes();
  const [mode, setMode] = useState<Mode>({ kind: 'closed' });

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold uppercase tracking-wider text-ink/50">
          Planes {data && <span className="text-ink/30 font-normal">({data.length})</span>}
        </p>
        <span className="text-[10px] italic text-ink/40">edit-only · 3 planes fijos</span>
      </div>

      {loading && <CardSkeleton count={3} />}
      {!loading && error && <ErrorCard error={error} retry={refetch} />}
      {!loading && !error && data && data.length === 0 && (
        <EmptyState
          icon={Diamond}
          title="No hay planes en la base de datos"
          description="Insertá los 3 planes base (basica, vip, premium) directamente en Supabase"
        />
      )}
      {!loading && !error && data && data.length > 0 && (
        <ul className="space-y-2.5">
          {data.map((row) => (
            <li key={row.id}>
              <PlanRowCard row={row} onEdit={() => setMode({ kind: 'edit', row })} />
            </li>
          ))}
        </ul>
      )}

      <PlanSheet
        mode={mode}
        onClose={() => setMode({ kind: 'closed' })}
        onSaved={() => { setMode({ kind: 'closed' }); refetch(); }}
      />
    </>
  );
}

function PlanRowCard({ row, onEdit }: { row: PlanRow; onEdit: () => void }) {
  const tier  = (row.tier ?? '').toLowerCase();
  const style = TIER_STYLES[tier] ?? 'bg-ink/[.06] text-ink/60';
  const price = row.price_clp != null ? `$${Number(row.price_clp).toLocaleString('es-CL')} CLP` : '—';
  return (
    <div className="card p-3.5 flex items-center gap-3">
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${row.is_active !== false ? 'bg-green-500' : 'bg-red-400/70'}`}
        aria-label={row.is_active !== false ? 'Activo' : 'Inactivo'}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink truncate">
          {row.name} <span className={`text-[10px] font-bold uppercase ml-1 px-1.5 py-0.5 rounded-full ${style}`}>{tier}</span>
        </p>
        <p className="text-xs text-ink/40 truncate mt-0.5">
          {price}{row.period && ` / ${row.period}`}
          {row.badge && ` · ${row.badge}`}
        </p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="px-2.5 py-1.5 rounded-lg bg-ink/[.06] hover:bg-ink/10 transition-colors flex-shrink-0"
        aria-label="Editar"
      >
        <Pencil className="w-3.5 h-3.5 text-ink/60" strokeWidth={2} />
      </button>
    </div>
  );
}

interface FormState {
  name:            string;
  price_clp:       string;
  price_usd:       string;
  period:          string;
  period_months:   string;
  savings_percent: string;
  badge:           string;
  features:        string[];
  is_active:       boolean;
}

function PlanSheet({ mode, onClose, onSaved }: { mode: Mode; onClose: () => void; onSaved: () => void }) {
  const open = mode.kind === 'edit';
  if (!open) {
    return (
      <AdminFormSheet open={false} title="Editar plan" onClose={onClose}>
        <div />
      </AdminFormSheet>
    );
  }

  const r = mode.row;
  const initial: FormState = {
    name:            r.name ?? '',
    price_clp:       r.price_clp == null ? '' : String(r.price_clp),
    price_usd:       r.price_usd == null ? '' : String(r.price_usd),
    period:          r.period ?? '',
    period_months:   r.period_months == null ? '' : String(r.period_months),
    savings_percent: r.savings_percent == null ? '' : String(r.savings_percent),
    badge:           r.badge ?? '',
    features:        Array.isArray(r.features) ? r.features : [],
    is_active:       r.is_active !== false,
  };

  return (
    <AdminFormSheet open={open} title={`Editar plan: ${r.name} · ${r.tier}`} onClose={onClose}>
      <PlanForm
        key={`edit-${r.id}`}
        initial={initial}
        editId={r.id}
        onSaved={onSaved}
        onCancel={onClose}
      />
    </AdminFormSheet>
  );
}

function PlanForm({
  initial, editId, onSaved, onCancel,
}: { initial: FormState; editId: string; onSaved: () => void; onCancel: () => void }) {
  const [s, setS]           = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, val: FormState[K]) {
    setS((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!s.name.trim()) { setErr('El nombre es obligatorio'); return; }

    const priceClp = s.price_clp.trim() === '' ? null : Number.parseInt(s.price_clp, 10);
    const priceUsd = s.price_usd.trim() === '' ? null : Number.parseFloat(s.price_usd);
    const months   = s.period_months.trim() === '' ? null : Number.parseInt(s.period_months, 10);
    const savings  = s.savings_percent.trim() === '' ? null : Number.parseInt(s.savings_percent, 10);

    const payload = {
      name:            s.name.trim(),
      price_clp:       priceClp,
      price_usd:       priceUsd,
      period:          s.period.trim() || null,
      period_months:   months,
      savings_percent: savings,
      badge:           s.badge.trim() || null,
      // Trim each feature and drop empties before save
      features:        s.features.map((f) => f.trim()).filter(Boolean),
      is_active:       s.is_active,
    };

    setSaving(true);
    const { data, error } = await supabase
      .from('plans').update(payload).eq('id', editId).select();
    setSaving(false);
    if (error)                      { setErr(error.message); return; }
    if (!data || data.length === 0) { setErr('No se guardó (posible bloqueo por RLS en plans)'); return; }
    onSaved();
  }

  return (
    <form onSubmit={handleSave}>
      <FormField label="Nombre" required>
        <input className="form-input" value={s.name} onChange={(e) => update('name', e.target.value)} autoFocus />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Precio CLP">
          <input
            type="number"
            className="form-input"
            value={s.price_clp}
            onChange={(e) => update('price_clp', e.target.value)}
            placeholder="35000"
          />
        </FormField>
        <FormField label="Precio USD">
          <input
            type="number"
            step="0.01"
            className="form-input"
            value={s.price_usd}
            onChange={(e) => update('price_usd', e.target.value)}
            placeholder="35.00"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Periodo" hint="mes / trimestre / semestre">
          <input className="form-input" value={s.period} onChange={(e) => update('period', e.target.value)} />
        </FormField>
        <FormField label="Meses del periodo">
          <input
            type="number"
            className="form-input"
            value={s.period_months}
            onChange={(e) => update('period_months', e.target.value)}
            placeholder="1, 3, 6…"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Ahorro %" hint="se muestra como 'Ahorra N%'">
          <input
            type="number"
            className="form-input"
            value={s.savings_percent}
            onChange={(e) => update('savings_percent', e.target.value)}
            placeholder="0"
          />
        </FormField>
        <FormField label="Badge" hint='ej. "Popular", "Mejor valor"'>
          <input className="form-input" value={s.badge} onChange={(e) => update('badge', e.target.value)} />
        </FormField>
      </div>

      <FeaturesField value={s.features} onChange={(v) => update('features', v)} />

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
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
