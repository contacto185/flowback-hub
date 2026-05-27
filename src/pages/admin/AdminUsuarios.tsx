import { useState } from 'react';
import { Users, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAdminUsuarios, type ProfileRow } from '@/hooks/admin/useAdminUsuarios';
import CardSkeleton from '@/components/CardSkeleton';
import EmptyState from '@/components/EmptyState';
import ErrorCard from '@/components/ErrorCard';

const TIERS = ['free', 'basica', 'vip', 'premium'] as const;

const TIER_STYLES: Record<string, string> = {
  free:    'bg-green-500/15  text-green-700',
  basica:  'bg-accent-blue/15  text-accent-blue',
  vip:     'bg-accent-purple/15 text-accent-purple',
  premium: 'bg-accent-orange/15 text-accent-orange',
};

export default function AdminUsuarios() {
  const { data, loading, error, refetch } = useAdminUsuarios();
  const withoutEmail = data ? data.filter((p) => !p.email).length : 0;

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold uppercase tracking-wider text-ink/50">
          Usuarios {data && <span className="text-ink/30 font-normal">({data.length})</span>}
        </p>
        {withoutEmail > 0 && (
          <span className="text-[10px] italic text-accent-orange">
            {withoutEmail} sin email · correr migración profiles.email
          </span>
        )}
      </div>

      {loading && <CardSkeleton count={4} />}
      {!loading && error && <ErrorCard error={error} retry={refetch} />}

      {!loading && !error && data && data.length === 0 && (
        <EmptyState
          icon={Users}
          title="No hay usuarios registrados aún"
          description="Cuando alguien se registre va a aparecer acá"
        />
      )}

      {!loading && !error && data && data.length > 0 && (
        <ul className="space-y-2.5">
          {data.map((p) => (
            <li key={p.user_id}>
              <UserRow profile={p} onChanged={refetch} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function UserRow({ profile: p, onChanged }: { profile: ProfileRow; onChanged: () => void }) {
  const [busy, setBusy]   = useState(false);
  const [err, setErr]     = useState<string | null>(null);

  const name = p.full_name || p.email?.split('@')[0] || 'Usuario';
  const initial = name.charAt(0).toUpperCase();
  const tier = (p.tier || 'free').toLowerCase();

  async function changeTier(newTier: string) {
    if (newTier === tier) return;
    setBusy(true);
    setErr(null);
    const { error } = await supabase
      .from('profiles').update({ tier: newTier }).eq('user_id', p.user_id);
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    onChanged();
  }

  return (
    <div className="card p-3.5">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full bg-grad-brand text-white grid place-items-center font-bold text-sm flex-shrink-0"
          aria-hidden
        >
          {initial}
        </div>

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink truncate">{name}</p>
          <p className="text-xs text-ink/40 truncate mt-0.5 flex items-center gap-1.5">
            {p.email ? (
              <>
                <Mail className="w-3 h-3 flex-shrink-0" strokeWidth={2} />
                {p.email}
              </>
            ) : (
              <span className="font-mono">ID: {p.user_id.slice(0, 8)}…</span>
            )}
          </p>
        </div>

        {/* Tier dropdown */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <select
            value={tier}
            onChange={(e) => changeTier(e.target.value)}
            disabled={busy}
            className={`text-xs font-bold uppercase tracking-wide py-1.5 px-2 rounded-lg border-0 cursor-pointer ${TIER_STYLES[tier] ?? TIER_STYLES.free}`}
          >
            {TIERS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {err && <p className="text-xs text-red-500 mt-2 font-mono break-words">{err}</p>}
    </div>
  );
}
