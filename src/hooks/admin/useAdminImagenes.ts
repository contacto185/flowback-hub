import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface ImagenItem {
  path:      string;       // 'admin/videos/123-foo.jpg'
  name:      string;       // 'foo.jpg'
  publicUrl: string;
  createdAt: string | null;
}

interface State {
  data:    ImagenItem[] | null;
  loading: boolean;
  error:   Error | null;
  refetch: () => void;
}

/** Lists every image in the `thumbnails` bucket across the well-known
 *  prefixes (root + admin/* subfolders + lessons/). Storage API doesn't
 *  do recursive list, so we list each prefix separately and merge. */
export function useAdminImagenes(): State {
  const [data, setData]       = useState<ImagenItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<Error | null>(null);
  const [tick, setTick]       = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const prefixes = [
          '',
          'admin/hero',
          'admin/nutricion',
          'admin/videos',
          'admin/cursos',
          'admin/eventos',
          'admin/courses',     // legacy v1 prefix
          'lessons',
        ];
        const collected: ImagenItem[] = [];
        for (const prefix of prefixes) {
          const { data: files, error: err } = await supabase.storage
            .from('thumbnails')
            .list(prefix, { limit: 500, sortBy: { column: 'created_at', order: 'desc' } });
          if (err) {
            // Don't fail the whole load — just log and continue
            console.warn(`[imagenes] list error in '${prefix}':`, err.message);
            continue;
          }
          for (const f of files ?? []) {
            // Folders show up with id === null in storage list — skip them
            if (!f.id || !f.name) continue;
            const path = prefix ? `${prefix}/${f.name}` : f.name;
            const { data: pub } = supabase.storage.from('thumbnails').getPublicUrl(path);
            collected.push({
              path,
              name:      f.name,
              publicUrl: pub?.publicUrl ?? '',
              createdAt: (f as { created_at?: string }).created_at ?? null,
            });
          }
        }
        if (cancelled) return;

        // Dedupe (root list can overlap) + newest first
        const seen = new Set<string>();
        const unique = collected.filter((it) => {
          if (seen.has(it.path)) return false;
          seen.add(it.path);
          return true;
        });
        unique.sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));

        setData(unique);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error('[useAdminImagenes]', err);
        setError(err as Error);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);
  return { data, loading, error, refetch };
}
