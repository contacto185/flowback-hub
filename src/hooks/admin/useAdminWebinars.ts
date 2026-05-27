import { useAdminList } from './useAdminList';
import type { WebinarRow } from '@/lib/types';

export function useAdminWebinars() {
  return useAdminList<WebinarRow>({
    table:  'webinars',
    orders: [
      { column: 'order_index', ascending: true },
      { column: 'date',        ascending: false },
    ],
  });
}
