import { useAdminList } from './useAdminList';

export interface ProfileRow {
  user_id:    string;
  full_name:  string | null;
  email:      string | null;
  tier:       string | null;
  avatar_url: string | null;
  created_at: string;
}

export function useAdminUsuarios() {
  return useAdminList<ProfileRow>({
    table:  'profiles',
    orders: [{ column: 'created_at', ascending: false }],
  });
}
