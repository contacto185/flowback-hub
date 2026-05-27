import { type ReactNode } from 'react';

interface Props {
  label:     string;
  required?: boolean;
  hint?:     string;
  children:  ReactNode;
}

/** Generic admin form field wrapper: label + (optional *) + child input + hint */
export default function FormField({ label, required, hint, children }: Props) {
  return (
    <div className="mb-3">
      <label className="text-xs text-ink/50 mb-1.5 block">
        {label}{required && <span className="text-accent-orange ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-ink/40 mt-1">{hint}</p>}
    </div>
  );
}
