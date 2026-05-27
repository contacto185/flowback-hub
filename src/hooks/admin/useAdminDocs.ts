import { useAdminList } from './useAdminList';
import type { DocumentRow } from '@/lib/types';

export function useAdminDocs() {
  return useAdminList<DocumentRow>({
    table:  'documents',
    orders: [{ column: 'created_at', ascending: false }],
  });
}
