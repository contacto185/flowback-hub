import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface Props {
  open:        boolean;
  title:       string;
  onClose:     () => void;
  children:    ReactNode;
}

/** Bottom-sheet on mobile, centered card on tall viewports.
 *  Closes on ESC, on backdrop click, and on the X button. Locks body
 *  scroll while open so the underlying admin list doesn't move. */
export default function AdminFormSheet({ open, title, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-[4px] cursor-default"
      />

      {/* Sheet */}
      <div
        className="relative z-10 w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-3xl
                   border-t sm:border border-line shadow-card-hover
                   max-h-[92vh] overflow-y-auto animate-[slideUp_.3s_ease-out]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 1rem)' }}
      >
        {/* Drag handle (visual only, mobile) */}
        <div className="w-10 h-1 rounded-full bg-ink/15 mx-auto mt-3 sm:hidden" />

        <div className="flex items-center justify-between px-5 pt-4 pb-3 sticky top-0 bg-white border-b border-line z-10">
          <h2 className="font-serif text-lg font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full grid place-items-center bg-ink/[.06] hover:bg-ink/10 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4 text-ink/60" strokeWidth={2} />
          </button>
        </div>

        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
