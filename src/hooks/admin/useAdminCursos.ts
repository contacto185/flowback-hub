import { useAdminList } from './useAdminList';
import type { CourseRow } from '@/lib/types';

export function useAdminCursos() {
  return useAdminList<CourseRow>({
    table:  'courses',
    orders: [
      { column: 'order_index', ascending: true },
      { column: 'created_at',  ascending: false },
    ],
  });
}
