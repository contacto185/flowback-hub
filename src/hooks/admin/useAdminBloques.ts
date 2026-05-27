import { useAdminList } from './useAdminList';

export interface LandingBlockRow {
  id:           string;
  section:      string;            // 'benefits' | 'resources'
  emoji:        string | null;
  icon:         string | null;     // lucide icon name
  accent_color: string | null;     // hex
  title:        string;
  subtitle:     string | null;
  url:          string | null;
  order_index:  number | null;
  is_active:    boolean | null;
  created_at:   string;
}

export function useAdminBloques() {
  return useAdminList<LandingBlockRow>({
    table:  'landing_blocks',
    orders: [
      { column: 'section',     ascending: true  },
      { column: 'order_index', ascending: true  },
    ],
  });
}
