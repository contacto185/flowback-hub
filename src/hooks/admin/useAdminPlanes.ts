import { useAdminList } from './useAdminList';

export interface PlanRow {
  id:              string;
  name:            string;
  tier:            string;            // 'basica' | 'vip' | 'premium' (PK semántico)
  price_clp:       number | null;
  price_usd:       number | null;
  period:          string | null;     // 'mes' | 'trimestre' | 'semestre'
  period_months:   number | null;
  savings_percent: number | null;
  badge:           string | null;
  features:        string[] | null;   // jsonb array of strings
  is_active:       boolean | null;
  order_index:     number | null;
}

export function useAdminPlanes() {
  return useAdminList<PlanRow>({
    table:  'plans',
    orders: [{ column: 'order_index', ascending: true }],
  });
}
