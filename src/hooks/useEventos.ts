import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface EventoItem {
  id:            string;
  title:         string;
  description:   string | null;
  event_date:    string;      // YYYY-MM-DD (normalized — both events and webinars land here)
  event_time:    string | null;
  duration:      string | null;
  type:          string | null;     // 'online' | 'presencial' | 'grabada'
  location:      string | null;
  zoom_url:      string | null;
  thumbnail_url: string | null;
  tier_required: string | null;
  /** 'event' if from public.events, 'webinar' if from public.webinars */
  source:        'event' | 'webinar';
}

interface State {
  data:    EventoItem[] | null;
  loading: boolean;
  error:   Error | null;
}

/**
 * Fetches future events (from `events`) + future webinars (from `webinars`),
 * merges them into a single chronologically-sorted list. Both tables share
 * is_active=true filter and a >= today gate on their respective date column.
 */
export function useEventos(): State {
  const [state, setState] = useState<State>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    (async () => {
      try {
        const today = new Date().toISOString().split('T')[0];

        const [eRes, wRes] = await Promise.all([
          supabase
            .from('events')
            .select('id, title, description, event_date, event_time, duration, type, location, zoom_url, thumbnail_url, tier_required, is_active')
            .eq('is_active', true)
            .gte('event_date', today)
            .order('event_date')
            .order('event_time'),
          supabase
            .from('webinars')
            .select('id, title, description, date, time, duration, type, zoom_url, tier_required, is_active')
            .eq('is_active', true)
            .gte('date', today)
            .order('date')
            .order('time'),
        ]);

        if (cancelled) return;
        if (eRes.error) throw eRes.error;
        if (wRes.error) throw wRes.error;

        const events: EventoItem[] = (eRes.data ?? []).map((e) => ({
          id:            e.id,
          title:         e.title,
          description:   e.description,
          event_date:    e.event_date,
          event_time:    e.event_time,
          duration:      e.duration,
          type:          e.type,
          location:      e.location,
          zoom_url:      e.zoom_url,
          thumbnail_url: e.thumbnail_url,
          tier_required: e.tier_required,
          source:        'event',
        }));

        const webinars: EventoItem[] = (wRes.data ?? []).map((w) => ({
          id:            w.id,
          title:         w.title,
          description:   w.description,
          event_date:    w.date,
          event_time:    w.time,
          duration:      w.duration,
          type:          w.type ?? 'online',
          location:      null,
          zoom_url:      w.zoom_url,
          thumbnail_url: null,
          tier_required: w.tier_required,
          source:        'webinar',
        }));

        const combined = [...events, ...webinars].sort((a, b) => {
          const ka = a.event_date + (a.event_time ?? '');
          const kb = b.event_date + (b.event_time ?? '');
          return ka.localeCompare(kb);
        });

        setState({ data: combined, loading: false, error: null });
      } catch (err) {
        if (cancelled) return;
        console.error('[useEventos]', err);
        setState({ data: null, loading: false, error: err as Error });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
