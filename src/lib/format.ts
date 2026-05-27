/** Format a YYYY-MM-DD + HH:MM:SS into a human label like "vie 30 may 2026 · 19:00" */
export function formatEventDate(dateStr: string | null | undefined, timeStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.toLocaleDateString('es-ES', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
    return timeStr ? `${day} · ${timeStr.slice(0, 5)}` : day;
  } catch {
    return dateStr;
  }
}

/** Day number + uppercase short month for the prominent date badge in event cards */
export function parseDateBadge(dateStr: string, timeStr: string | null | undefined): { day: number; month: string } | null {
  try {
    const dt = new Date(dateStr + 'T' + (timeStr || '00:00'));
    if (isNaN(dt.getTime())) return null;
    return {
      day:   dt.getDate(),
      month: dt.toLocaleString('es', { month: 'short' }).toUpperCase().replace('.', ''),
    };
  } catch {
    return null;
  }
}
