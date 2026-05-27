import { type LucideIcon } from 'lucide-react';

interface Props {
  /** Either an icon or an emoji — emoji takes precedence if both are passed */
  icon?:        LucideIcon;
  emoji?:       string;
  title:        string;
  description?: string;
}

/** Used when a fetch succeeds but returns zero rows. Friendlier than just
 *  blank screen, more focused than ComingSoon (which is for unmigrated routes). */
export default function EmptyState({ icon: Icon, emoji, title, description }: Props) {
  return (
    <div className="card p-8 text-center mt-4">
      {emoji ? (
        <p className="text-5xl mb-3" aria-hidden>{emoji}</p>
      ) : Icon ? (
        <Icon className="w-12 h-12 mx-auto mb-3 text-ink/20" strokeWidth={1.5} />
      ) : null}
      <p className="font-semibold text-ink/70 mb-1">{title}</p>
      {description && <p className="text-xs text-ink/40">{description}</p>}
    </div>
  );
}
