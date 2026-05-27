import { useAdminList } from './useAdminList';
import type { VideoRow } from '@/lib/types';

export function useAdminVideos() {
  return useAdminList<VideoRow>({
    table:  'videos',
    orders: [
      { column: 'order_index', ascending: true },
      { column: 'created_at',  ascending: false },
    ],
  });
}
