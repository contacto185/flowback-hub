import { X, Plus } from 'lucide-react';
import FormField from './FormField';

interface Props {
  label?:   string;
  value:    string[];
  onChange: (next: string[]) => void;
  hint?:    string;
}

/** Editor for an array of short strings (e.g. plan features list).
 *  One input per item, "+" button at the bottom to add, "×" button
 *  on each row to remove. Empty rows are kept in state — the caller
 *  is responsible for trimming/filtering before save. */
export default function FeaturesField({
  label    = 'Features',
  value,
  onChange,
  hint     = 'Una característica por línea — ej. "Clases Zoom AM y PM"',
}: Props) {
  function setAt(i: number, next: string) {
    const copy = [...value];
    copy[i] = next;
    onChange(copy);
  }

  function removeAt(i: number) {
    onChange(value.filter((_, j) => j !== i));
  }

  function add() {
    onChange([...value, '']);
  }

  return (
    <FormField label={label} hint={hint}>
      {value.length === 0 ? (
        <p className="text-xs text-ink/40 italic mb-2">Sin features. Agregá una con el botón +.</p>
      ) : (
        <ul className="space-y-2 mb-2">
          {value.map((f, i) => (
            <li key={i} className="flex gap-2">
              <input
                value={f}
                onChange={(e) => setAt(i, e.target.value)}
                placeholder={`Feature ${i + 1}`}
                className="form-input flex-1"
              />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="w-9 h-9 grid place-items-center rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors flex-shrink-0"
                aria-label={`Quitar feature ${i + 1}`}
              >
                <X className="w-4 h-4 text-red-500" strokeWidth={2} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-line bg-ink/[.02] hover:bg-ink/[.05] transition-colors text-xs text-ink/70"
      >
        <Plus className="w-3.5 h-3.5" strokeWidth={2} />
        Agregar feature
      </button>
    </FormField>
  );
}
