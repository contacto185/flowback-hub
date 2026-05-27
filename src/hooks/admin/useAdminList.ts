import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface OrderSpec {
  column:    string;
  ascending: boolean;
}

interface Options {
  table:  string;
  orders: OrderSpec[];
}

export interface AdminListState<T> {
  data:    T[] | null;
  loading: boolean;
  error:   Error | null;
  refetch: () => void;
}

/** Shared admin-list fetch hook. Returns ALL rows (incl. inactive), ordered
 *  per `orders`. Exposes `refetch()` so callers can re-run after a CUD op.
 *  Cancellation flag prevents setState after unmount or stale results. */
export function useAdminList<T>({ table, orders }: Options): AdminListState<T> {
  const [data, setData]       = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<Error | null>(null);
  const [tick, setTick]       = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        let query = supabase.from(table).select('*');
        for (const o of orders) {
          query = query.order(o.column, { ascending: o.ascending, nullsFirst: false });
        }
        const { data: rows, error: err } = await query;
        if (cancelled) return;
        if (err) throw err;
        setData((rows ?? []) as T[]);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error(`[useAdminList:${table}]`, err);
        setError(err as Error);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, table]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);
  return { data, loading, error, refetch };
}
