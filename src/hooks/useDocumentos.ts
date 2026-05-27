import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { canAccessTier } from '@/lib/supabase';
import type { DocumentRow, FetchState } from '@/lib/types';

export interface DocumentoItem extends DocumentRow {
  /** True if the current user's tier covers this doc's tier_required */
  accessible: boolean;
}

export interface DocumentosState extends FetchState<DocumentoItem[]> {
  /** Docs the user can actually open. Page renders these directly. */
  accessible:  DocumentoItem[];
  /** Total docs in higher tiers — used to show "Hay N docs en planes superiores" */
  lockedCount: number;
}

/** All active documents, filtered client-side by the user's tier.
 *  Returns accessible + lockedCount separately so the page can render
 *  a tier upsell when there's locked content. */
export function useDocumentos(): DocumentosState {
  const { userProfile } = useAuth();
  const [state, setState] = useState<DocumentosState>({
    data: null,
    loading: true,
    error: null,
    accessible: [],
    lockedCount: 0,
  });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    (async () => {
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (cancelled) return;
        if (error) throw error;

        const rows = (data ?? []) as DocumentRow[];
        const userTier = userProfile?.tier ?? 'free';
        const items: DocumentoItem[] = rows.map((d) => ({
          ...d,
          accessible: canAccessTier(userTier, d.tier_required ?? 'free'),
        }));
        const accessible  = items.filter((d) => d.accessible);
        const lockedCount = items.length - accessible.length;

        setState({
          data:        items,
          accessible,
          lockedCount,
          loading:     false,
          error:       null,
        });
      } catch (err) {
        if (cancelled) return;
        console.error('[useDocumentos]', err);
        setState({
          data:        null,
          accessible:  [],
          lockedCount: 0,
          loading:     false,
          error:       err as Error,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userProfile?.tier]);

  return state;
}
