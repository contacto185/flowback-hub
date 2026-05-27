/* Shared row types — mirror the Supabase tables that user-facing pages read. */

export interface VideoRow {
  id:            string;
  title:         string;
  description:   string | null;
  vimeo_url:     string | null;
  thumbnail_url: string | null;
  duration:      string | null;
  tier_required: string | null;
  order_index:   number | null;
  is_active:     boolean | null;
  created_at:    string;
}

export interface CourseRow {
  id:             string;
  title:          string;
  description:    string | null;
  thumbnail_url:  string | null;
  instructor:     string | null;
  duration_hours: number | null;
  tier_required:  string | null;
  price:          number | null;
  currency:       string | null;
  vimeo_url:      string | null;
  landing_url:    string | null;
  order_index:    number | null;
  is_active:      boolean | null;
  created_at:     string;
}

export interface DocumentRow {
  id:            string;
  title:         string;
  description:   string | null;
  drive_url:     string | null;
  tier_required: string | null;
  is_active:     boolean | null;
  created_at:    string;
}

export interface WebinarRow {
  id:            string;
  title:         string;
  description:   string | null;
  date:          string;
  time:          string | null;
  duration:      string | null;
  type:          'online' | 'grabada' | string | null;
  zoom_url:      string | null;
  tier_required: string | null;
  is_active:     boolean | null;
  order_index:   number | null;
}

/** Generic shape every page-level fetch hook returns */
export interface FetchState<T> {
  data:    T | null;
  loading: boolean;
  error:   Error | null;
}
