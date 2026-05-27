import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { CourseRow, FetchState } from '@/lib/types';

export interface CursoItem extends CourseRow {
  /** True if the current user appears in course_purchases for this course */
  purchased: boolean;
}

/** List of active courses, sorted by order_index then created_at desc.
 *  If logged in, joins with course_purchases (client-side) to mark which
 *  ones the user already owns. */
export function useCursos(): FetchState<CursoItem[]> {
  const { currentUser } = useAuth();
  const [state, setState] = useState<FetchState<CursoItem[]>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    (async () => {
      try {
        const { data: courses, error } = await supabase
          .from('courses')
          .select('*')
          .eq('is_active', true)
          .order('order_index', { nullsFirst: false })
          .order('created_at', { ascending: false });

        if (cancelled) return;
        if (error) throw error;
        const rows = (courses ?? []) as CourseRow[];

        // Purchases — only meaningful when logged in
        let purchasedIds = new Set<string>();
        if (currentUser && rows.length > 0) {
          const { data: purchases } = await supabase
            .from('course_purchases')
            .select('course_id')
            .eq('user_id', currentUser.id);
          if (cancelled) return;
          purchasedIds = new Set(
            (purchases ?? []).map((p: { course_id: string }) => p.course_id),
          );
        }

        const items: CursoItem[] = rows.map((c) => ({
          ...c,
          purchased: purchasedIds.has(c.id),
        }));

        setState({ data: items, loading: false, error: null });
      } catch (err) {
        if (cancelled) return;
        console.error('[useCursos]', err);
        setState({ data: null, loading: false, error: err as Error });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id]);

  return state;
}
