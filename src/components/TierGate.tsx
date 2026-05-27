import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';

interface Props {
  requiredTier: 'basica' | 'vip' | 'premium';
  sectionName:  string;
}

const TIER_LABELS = {
  basica:  'Básica',
  vip:     'VIP',
  premium: 'Premium',
} as const;

/** Rendered when a logged-in user lacks the tier required to view a section.
 *  Different from ProtectedRoute (which gates on logged-in / admin) — this
 *  is for tier-based content gates within an already-protected route. */
export default function TierGate({ requiredTier, sectionName }: Props) {
  return (
    <div className="card p-8 text-center mt-4">
      <div className="w-14 h-14 rounded-2xl grid place-items-center mx-auto mb-4 bg-grad-brand/15">
        <Crown className="w-7 h-7 text-accent-orange" strokeWidth={2} />
      </div>
      <p className="font-semibold text-ink mb-1">
        Membresía {TIER_LABELS[requiredTier]} requerida
      </p>
      <p className="text-xs text-ink/40 mb-4 leading-relaxed">
        Necesitás al menos la membresía {TIER_LABELS[requiredTier]} para ver {sectionName}.
      </p>
      <Link
        to="/mi-cuenta"
        className="inline-block btn-grad text-xs px-5 py-2.5 rounded-xl"
      >
        Ver mi plan →
      </Link>
    </div>
  );
}
