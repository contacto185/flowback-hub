import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { VideoRow, FetchState } from '@/lib/types';

/** Public free videos shown on /clases. Filters by tier_required='free'
 *  and is_active=true. */
export function useClases(): FetchState<VideoRow[]> {
  const [state, setState] = useState<FetchState<VideoRow[]>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    (async () => {
      try {
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .eq('tier_required', 'free')
          .eq('is_active', true)
          .order('order_index', { nullsFirst: false })
          .order('created_at', { ascending: false });

        if (cancelled) return;
        if (error) throw error;
        setState({ data: (data ?? []) as VideoRow[], loading: false, error: null });
      } catch (err) {
        if (cancelled) return;
        console.error('[useClases]', err);
        setState({ data: null, loading: false, error: err as Error });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
