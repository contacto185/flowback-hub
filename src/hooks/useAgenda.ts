import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { canAccessTier } from '@/lib/supabase';
import type { VideoRow, FetchState } from '@/lib/types';

export interface AgendaItem extends VideoRow {
  /** True if the user's tier covers this video's tier_required */
  unlocked:      boolean;
  /** Progress percent 0–100 from public.video_progress, or 0 if none */
  progressPct:   number;
}

/** Videos for the member-area Agenda page: tier_required != 'free' AND
 *  is_active=true. Items above the user's tier are returned with
 *  unlocked=false so the UI can show them locked instead of hiding them. */
export function useAgenda(): FetchState<AgendaItem[]> {
  const { currentUser, userProfile } = useAuth();
  const [state, setState] = useState<FetchState<AgendaItem[]>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    (async () => {
      try {
        const videosRes = await supabase
          .from('videos')
          .select('*')
          .neq('tier_required', 'free')
          .eq('is_active', true)
          .order('order_index', { nullsFirst: false })
          .order('created_at', { ascending: false });

        if (cancelled) return;
        if (videosRes.error) throw videosRes.error;
        const videos = (videosRes.data ?? []) as VideoRow[];

        // Progress map — only meaningful if logged in
        const progressMap: Record<string, number> = {};
        if (currentUser && videos.length > 0) {
          const ids = videos.map((v) => v.id);
          const progRes = await supabase
            .from('video_progress')
            .select('video_id, progress_percent')
            .eq('user_id', currentUser.id)
            .in('video_id', ids);
          if (cancelled) return;
          (progRes.data ?? []).forEach((p: { video_id: string; progress_percent: number | null }) => {
            progressMap[p.video_id] = p.progress_percent ?? 0;
          });
        }

        const userTier = userProfile?.tier ?? 'free';
        const items: AgendaItem[] = videos.map((v) => ({
          ...v,
          unlocked:    canAccessTier(userTier, v.tier_required ?? 'free'),
          progressPct: progressMap[v.id] ?? 0,
        }));

        setState({ data: items, loading: false, error: null });
      } catch (err) {
        if (cancelled) return;
        console.error('[useAgenda]', err);
        setState({ data: null, loading: false, error: err as Error });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, userProfile?.tier]);

  return state;
}
