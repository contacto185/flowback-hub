import { useAdminList } from './useAdminList';

export interface AdminEventoRow {
  id:            string;
  title:         string;
  description:   string | null;
  event_date:    string;
  event_time:    string | null;
  duration:      string | null;
  type:          'online' | 'presencial' | string | null;
  zoom_url:      string | null;
  location:      string | null;
  thumbnail_url: string | null;
  tier_required: string | null;
  is_active:     boolean | null;
}

export function useAdminEventos() {
  return useAdminList<AdminEventoRow>({
    table:  'events',
    orders: [{ column: 'event_date', ascending: false }],
  });
}
