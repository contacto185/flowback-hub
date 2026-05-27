import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { canAccessTier } from '@/lib/supabase';
import type { VideoRow, WebinarRow, FetchState } from '@/lib/types';

export type GrabadaItem =
  | { kind: 'webinar'; row: WebinarRow }
  | { kind: 'video';   row: VideoRow; unlocked: boolean; progressPct: number };

/** Grabadas page combines:
 *   - webinars where type='grabada' and is_active=true (only VIP+ users
 *     reach this page via TierGate, so RLS / business rules align)
 *   - videos where tier_required in ('premium', 'vip') and is_active=true
 *
 *  Returned in 2 chunks (webinars then videos) — page renders them in
 *  separate sections. */
export function useGrabadas(): FetchState<GrabadaItem[]> {
  const { currentUser, userProfile } = useAuth();
  const [state, setState] = useState<FetchState<GrabadaItem[]>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    (async () => {
      try {
        const [wRes, vRes] = await Promise.all([
          supabase
            .from('webinars')
            .select('*')
            .eq('type', 'grabada')
            .eq('is_active', true)
            .order('date', { ascending: false }),
          supabase
            .from('videos')
            .select('*')
            .in('tier_required', ['premium', 'vip'])
            .eq('is_active', true)
            .order('order_index', { nullsFirst: false })
            .order('created_at', { ascending: false }),
        ]);

        if (cancelled) return;
        if (wRes.error) throw wRes.error;
        if (vRes.error) throw vRes.error;

        const webinars = (wRes.data ?? []) as WebinarRow[];
        const videos   = (vRes.data ?? []) as VideoRow[];

        // Fetch progress for the visible videos
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
        const items: GrabadaItem[] = [
          ...webinars.map((w) => ({ kind: 'webinar' as const, row: w })),
          ...videos.map((v) => ({
            kind: 'video' as const,
            row:  v,
            unlocked:    canAccessTier(userTier, v.tier_required ?? 'free'),
            progressPct: progressMap[v.id] ?? 0,
          })),
        ];

        setState({ data: items, loading: false, error: null });
      } catch (err) {
        if (cancelled) return;
        console.error('[useGrabadas]', err);
        setState({ data: null, loading: false, error: err as Error });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, userProfile?.tier]);

  return state;
}
