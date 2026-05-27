import { Pencil, Trash2 } from 'lucide-react';

interface Props {
  title:     string;
  subtitle?: string;
  active?:   boolean;
  onEdit:    () => void;
  onDelete:  () => void;
}

/** Generic row used in every admin list. Green/red dot = is_active.
 *  Edit + delete buttons on the right. */
export default function AdminListRow({ title, subtitle, active = true, onEdit, onDelete }: Props) {
  return (
    <div className="card p-3.5 flex items-center gap-3">
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? 'bg-green-500' : 'bg-red-400/70'}`}
        aria-label={active ? 'Activo' : 'Inactivo'}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink truncate">{title}</p>
        {subtitle && <p className="text-xs text-ink/40 truncate mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex gap-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={onEdit}
          className="px-2.5 py-1.5 rounded-lg bg-ink/[.06] hover:bg-ink/10 transition-colors"
          aria-label="Editar"
        >
          <Pencil className="w-3.5 h-3.5 text-ink/60" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors"
          aria-label="Eliminar"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-500" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
