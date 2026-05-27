import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  LogOut, Mail, Check, AlertCircle, Pencil, X,
  FileText, ExternalLink, Download, HardDrive, FolderOpen,
} from 'lucide-react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import type { OnApproveData, OnApproveActions } from '@paypal/paypal-js';
import { supabase, TIER_RANK } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { usePlans, type PlanItem } from '@/hooks/usePlans';
import { useDocumentos, type DocumentoItem } from '@/hooks/useDocumentos';
import CardSkeleton from '@/components/CardSkeleton';
import EmptyState from '@/components/EmptyState';
import ErrorCard from '@/components/ErrorCard';

const TIER_LABEL: Record<string, string> = {
  free: 'Gratis', basica: 'Básica', vip: 'VIP', premium: 'Premium',
};
const TIER_STYLES: Record<string, string> = {
  free:    'bg-green-500/15  text-green-700',
  basica:  'bg-accent-blue/15  text-accent-blue',
  vip:     'bg-accent-purple/15 text-accent-purple',
  premium: 'bg-accent-orange/15 text-accent-orange',
};

type SubTab = 'perfil' | 'planes' | 'acceso';
const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: 'perfil', label: 'Perfil' },
  { id: 'planes', label: 'Planes' },
  { id: 'acceso', label: 'Acceso' },
];

export default function MiCuenta() {
  const [tab, setTab] = useState<SubTab>('perfil');

  return (
    <section className="py-2">
      <h1 className="font-serif text-2xl font-black mb-5">Mi cuenta</h1>

      {/* Segmented control */}
      <div className="flex gap-1 p-1 bg-ink/[.04] rounded-xl mb-5">
        {SUB_TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-white text-ink shadow-card'
                  : 'text-ink/50 hover:text-ink/80'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'perfil' && <PerfilTab />}
      {tab === 'planes' && <PlanesTab />}
      {tab === 'acceso' && <AccesoTab />}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PERFIL — nombre editable, email read-only, tier badge, signOut
═══════════════════════════════════════════════════════════════════════ */

function PerfilTab() {
  const { currentUser, userProfile, signOut, isAdmin, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName]       = useState(userProfile?.full_name ?? '');
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState<string | null>(null);

  const email = userProfile?.email || currentUser?.email || '—';
  const tier  = (userProfile?.tier || 'free').toLowerCase();
  const initial = (userProfile?.full_name || email || 'U').charAt(0).toUpperCase();

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    const trimmed = name.trim();
    if (!trimmed) { setErr('El nombre no puede estar vacío'); return; }
    if (!currentUser) return;

    setSaving(true);
    const { error } = await supabase
      .from('profiles').update({ full_name: trimmed }).eq('user_id', currentUser.id);
    setSaving(false);
    if (error) { setErr(error.message); return; }
    await refreshProfile();
    setEditing(false);
  }

  return (
    <>
      <div className="card p-5 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-14 h-14 rounded-full bg-grad-brand text-white grid place-items-center font-bold text-lg flex-shrink-0"
            aria-hidden
          >
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <form onSubmit={handleSave} className="flex items-center gap-2">
                <input
                  className="form-input flex-1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  disabled={saving}
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="w-9 h-9 rounded-lg bg-grad-brand text-white grid place-items-center disabled:opacity-60"
                  aria-label="Guardar"
                >
                  <Check className="w-4 h-4" strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={() => { setEditing(false); setName(userProfile?.full_name ?? ''); setErr(null); }}
                  disabled={saving}
                  className="w-9 h-9 rounded-lg bg-ink/[.06] grid place-items-center"
                  aria-label="Cancelar"
                >
                  <X className="w-4 h-4 text-ink/60" strokeWidth={2} />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <p className="font-bold text-ink truncate">
                  {userProfile?.full_name || email.split('@')[0]}
                </p>
                <button
                  type="button"
                  onClick={() => { setName(userProfile?.full_name ?? ''); setEditing(true); }}
                  className="w-6 h-6 rounded-lg grid place-items-center bg-ink/[.06] hover:bg-ink/10 transition-colors flex-shrink-0"
                  aria-label="Editar nombre"
                >
                  <Pencil className="w-3 h-3 text-ink/50" strokeWidth={2} />
                </button>
              </div>
            )}
            <p className="text-xs text-ink/50 truncate flex items-center gap-1.5 mt-1">
              <Mail className="w-3 h-3 flex-shrink-0" strokeWidth={2} />
              {email}
            </p>
            <div className="flex gap-1.5 mt-1.5">
              <span
                className={`text-xs font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full ${TIER_STYLES[tier] || TIER_STYLES.free}`}
              >
                {TIER_LABEL[tier] || tier}
              </span>
              {isAdmin && (
                <span className="text-xs font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full bg-accent-orange text-white">
                  admin
                </span>
              )}
            </div>
          </div>
        </div>

        {err && (
          <p className="text-xs text-red-500 mt-2 font-mono break-words">{err}</p>
        )}
      </div>

      <button
        type="button"
        onClick={signOut}
        className="w-full card p-4 flex items-center gap-3 hover:border-red-300/50 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl grid place-items-center flex-shrink-0 bg-red-500/10">
          <LogOut className="w-5 h-5 text-red-500" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm text-ink">Cerrar sesión</p>
          <p className="text-xs text-ink/50">Vas a volver a la pantalla de login</p>
        </div>
      </button>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PLANES — listado con botones PayPal que invocan confirm-payment
═══════════════════════════════════════════════════════════════════════ */

function PlanesTab() {
  const { userProfile } = useAuth();
  const { data: plans, loading, error } = usePlans();
  const currentTier = (userProfile?.tier || 'free').toLowerCase();
  const currentRank = TIER_RANK[currentTier] ?? 0;

  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
  const paypalReady    = !!paypalClientId;

  if (loading) return <CardSkeleton count={3} />;
  if (error)   return <ErrorCard error={error} />;
  if (!plans?.length) {
    return (
      <EmptyState
        emoji="💎"
        title="No hay planes disponibles"
        description="Esperá a que se carguen o consultá con soporte"
      />
    );
  }

  // Sort: current first, then upgrades. Filter out downgrades.
  const visible = plans
    .filter((p) => (TIER_RANK[p.tier] ?? 0) >= currentRank)
    .sort((a, b) => (TIER_RANK[a.tier] ?? 0) - (TIER_RANK[b.tier] ?? 0));

  const planesCards = (
    <ul className="space-y-3">
      {visible.map((p) => (
        <li key={p.id}>
          <PlanCard
            plan={p}
            isCurrent={p.tier === currentTier}
            paypalReady={paypalReady}
          />
        </li>
      ))}
      {visible.every((p) => p.tier === currentTier) && (
        <li>
          <div className="card p-5 text-center">
            <p className="text-2xl mb-2">💎</p>
            <p className="font-bold text-ink mb-1">Estás en el plan máximo</p>
            <p className="text-xs text-ink/50">Tenés acceso completo a Flowback Hub</p>
          </div>
        </li>
      )}
    </ul>
  );

  if (!paypalReady) {
    return (
      <>
        <div className="card p-4 mb-4 border-accent-orange/30" style={{ borderColor: 'rgba(245,124,0,.3)' }}>
          <p className="text-xs text-ink/70">
            <strong>PayPal no configurado.</strong> Falta <code className="text-accent-orange">VITE_PAYPAL_CLIENT_ID</code> en
            <code className="text-accent-orange">.env.local</code>. Los planes se muestran pero los botones de pago están deshabilitados.
          </p>
        </div>
        {planesCards}
      </>
    );
  }

  return (
    <PayPalScriptProvider
      options={{ clientId: paypalClientId, currency: 'USD', intent: 'capture' }}
    >
      {planesCards}
    </PayPalScriptProvider>
  );
}

function PlanCard({
  plan, isCurrent, paypalReady,
}: { plan: PlanItem; isCurrent: boolean; paypalReady: boolean }) {
  const { currentUser, refreshProfile } = useAuth();
  const [paid, setPaid]     = useState(false);
  const [paying, setPaying] = useState(false);
  const [err, setErr]       = useState<string | null>(null);

  const tier      = plan.tier.toLowerCase();
  const priceClp  = plan.price_clp != null
    ? `$${Number(plan.price_clp).toLocaleString('es-CL')} CLP`
    : '—';
  const priceUsd  = plan.price_usd != null ? `${plan.price_usd}` : null;
  const features  = plan.features ?? [];
  const features3 = features.slice(0, 6);  // cap visible features

  async function handleApprove(data: OnApproveData, actions: OnApproveActions) {
    if (!currentUser) { setErr('Sesión expirada. Recargá e iniciá sesión de nuevo.'); return; }
    if (!actions.order) { setErr('PayPal: error de orden'); return; }

    setPaying(true);
    setErr(null);
    try {
      await actions.order.capture();
    } catch (captureErr) {
      setPaying(false);
      setErr('Error al capturar el pago: ' + String(captureErr));
      return;
    }

    // Server-side verification: confirm-payment Edge Function
    const { data: resp, error: fnErr } = await supabase.functions.invoke('confirm-payment', {
      body: { orderID: data.orderID, userID: currentUser.id, planID: plan.tier },
    });
    setPaying(false);

    if (fnErr) {
      setErr('Pago recibido pero confirmación falló: ' + fnErr.message);
      return;
    }
    const r = resp as { success?: boolean; error?: string; tier?: string; alreadyProcessed?: boolean } | null;
    if (!r?.success) {
      setErr(r?.error ?? 'No pudimos confirmar el pago. Contactá a soporte si el cargo aparece.');
      return;
    }

    setPaid(true);
    await refreshProfile();
  }

  return (
    <div className={`card p-5 ${isCurrent ? 'border-green-500/30 bg-green-500/[.03]' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p
            className={`text-xs font-bold tracking-widest uppercase mb-1 ${
              tier === 'premium' ? 'text-accent-orange' :
              tier === 'vip'     ? 'text-accent-purple' :
                                   'text-accent-blue'
            }`}
          >
            {plan.name}
          </p>
          <p className="text-xs text-ink/50 mb-1">
            {plan.period ? `Plan ${plan.period}` : 'Plan'}{plan.period_months ? ` · ${plan.period_months} ${plan.period_months === 1 ? 'mes' : 'meses'}` : ''}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-ink">{priceClp}</span>
            {priceUsd && <span className="text-xs text-ink/40">· {priceUsd} USD</span>}
          </div>
          {plan.savings_percent != null && plan.savings_percent > 0 && (
            <p className="text-xs font-semibold mt-1 text-accent-orange">
              Ahorra {plan.savings_percent}%
            </p>
          )}
        </div>
        {plan.badge && (
          <span
            className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${TIER_STYLES[tier] ?? TIER_STYLES.basica}`}
          >
            {plan.badge}
          </span>
        )}
      </div>

      {features3.length > 0 && (
        <ul className="space-y-1.5 mb-4 mt-3">
          {features3.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-ink/70">
              <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}

      {paid ? (
        <div className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-green-700 bg-green-500/15 border border-green-500/30">
          <Check className="w-4 h-4" strokeWidth={2.5} />
          ¡Bienvenido a la Tribu!
        </div>
      ) : isCurrent ? (
        <div className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-green-700 bg-green-500/12 border border-green-500/30">
          <Check className="w-4 h-4" strokeWidth={2.5} />
          Tu plan actual
        </div>
      ) : !paypalReady ? (
        <button
          disabled
          className="w-full py-3 rounded-xl font-medium text-sm bg-ink/[.05] text-ink/40 cursor-not-allowed"
        >
          PayPal no configurado
        </button>
      ) : (
        <>
          {paying && (
            <p className="text-center text-xs text-ink/50 mb-2 animate-pulse">
              Confirmando pago…
            </p>
          )}
          <PayPalButtons
            style={{ layout: 'vertical', shape: 'pill', label: 'paypal', color: 'gold' }}
            disabled={paying}
            forceReRender={[plan.id, plan.price_usd]}
            createOrder={(_data, actions) =>
              actions.order.create({
                intent: 'CAPTURE',
                purchase_units: [{
                  description: `Plan ${plan.name} · Flowback Hub`,
                  amount: { currency_code: 'USD', value: String(plan.price_usd ?? 0) },
                }],
              })
            }
            onApprove={handleApprove}
            onError={(payErr) => { setErr('PayPal error: ' + String(payErr)); setPaying(false); }}
            onCancel={() => { setPaying(false); }}
          />
          {err && (
            <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <p className="text-xs text-red-700 break-words">{err}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ACCESO — documentos descargables según tier
═══════════════════════════════════════════════════════════════════════ */

function AccesoTab() {
  const { accessible, lockedCount, loading, error } = useDocumentos();

  return (
    <>
      <p className="text-xs text-ink/50 mb-3">
        Documentos descargables disponibles para tu plan actual.
      </p>

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
              to="/documentos"
              className="block w-full text-center btn-grad py-2.5 rounded-xl text-sm mt-3"
            >
              Ver sección Documentos →
            </Link>
          )}
        </>
      )}

      {!loading && !error && accessible.length > 0 && (
        <ul className="space-y-2.5">
          {accessible.map((d) => (
            <li key={d.id}>
              <AccesoDocRow doc={d} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function pickDocIcon(url: string | null) {
  if (!url) return FileText;
  if (/drive\.google\.com/i.test(url)) return HardDrive;
  return FileText;
}

function AccesoDocRow({ doc: d }: { doc: DocumentoItem }) {
  const Icon = pickDocIcon(d.drive_url);
  const isDownload = !!d.drive_url && /\.(pdf|docx?|xlsx?|pptx?|zip)(\?|$)/i.test(d.drive_url);

  return (
    <article className="card p-3.5 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl grid place-items-center flex-shrink-0 bg-accent-blue/15">
        <Icon className="w-5 h-5 text-accent-blue" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-ink truncate">{d.title}</p>
        {d.description && (
          <p className="text-xs text-ink/40 truncate mt-0.5">{d.description}</p>
        )}
      </div>
      {d.drive_url ? (
        <a
          href={d.drive_url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 rounded-lg bg-grad-brand text-white text-xs font-semibold flex items-center gap-1.5 flex-shrink-0"
          aria-label={isDownload ? 'Descargar' : 'Abrir'}
        >
          {isDownload
            ? <Download className="w-3.5 h-3.5" strokeWidth={2} />
            : <ExternalLink className="w-3.5 h-3.5" strokeWidth={2} />}
        </a>
      ) : (
        <span className="text-xs text-ink/30">sin URL</span>
      )}
    </article>
  );
}
