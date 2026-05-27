interface Props {
  count?:     number;
  /** Show a 16:9 image placeholder at the top of each card */
  withImage?: boolean;
}

/** Loading placeholder used by every fetch-based page. animate-pulse gives
 *  a subtle shimmer; aria-busy lets screen readers know we're loading. */
export default function CardSkeleton({ count = 3, withImage = false }: Props) {
  return (
    <ul className="space-y-3" aria-busy="true" aria-label="Cargando">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="card overflow-hidden p-0">
          {withImage && <div className="aspect-[16/9] bg-ink/[.04] animate-pulse" />}
          <div className="p-4">
            <div className="h-4 w-2/3 bg-ink/[.08] rounded animate-pulse mb-2" />
            <div className="h-3 w-full bg-ink/[.05] rounded animate-pulse mb-1" />
            <div className="h-3 w-1/2 bg-ink/[.05] rounded animate-pulse" />
          </div>
        </li>
      ))}
    </ul>
  );
}
