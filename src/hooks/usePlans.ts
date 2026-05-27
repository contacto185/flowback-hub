import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { FetchState } from '@/lib/types';

export interface PlanItem {
  id:              string;
  name:            string;
  tier:            string;           // 'basica' | 'vip' | 'premium'
  price_clp:       number | null;
  price_usd:       number | null;
  period:          string | null;
  period_months:   number | null;
  savings_percent: number | null;
  badge:           string | null;
  features:        string[] | null;
  order_index:     number | null;
}

/** Public plans listing — only active rows, ordered for display. */
export function usePlans(): FetchState<PlanItem[]> {
  const [state, setState] = useState<FetchState<PlanItem[]>>({
    data: null, loading: true, error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    (async () => {
      try {
        const { data, error } = await supabase
          .from('plans')
          .select('id, name, tier, price_clp, price_usd, period, period_months, savings_percent, badge, features, order_index')
          .eq('is_active', true)
          .order('order_index', { ascending: true });
        if (cancelled) return;
        if (error) throw error;
        setState({ data: (data ?? []) as PlanItem[], loading: false, error: null });
      } catch (err) {
        if (cancelled) return;
        console.error('[usePlans]', err);
        setState({ data: null, loading: false, error: err as Error });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return state;
}
