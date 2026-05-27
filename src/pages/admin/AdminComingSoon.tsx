interface Props {
  tabLabel: string;
}

/** Used for admin tabs that aren't ported to react-v2 yet. Tells the user
 *  to fall back to the v1 single-file app for those operations. */
export default function AdminComingSoon({ tabLabel }: Props) {
  return (
    <div className="card p-6 text-center">
      <p className="text-4xl mb-3">🚧</p>
      <p className="font-semibold text-ink mb-1">{tabLabel}</p>
      <p className="text-xs text-ink/50 mb-4 leading-relaxed">
        Este tab del admin todavía no se migró a react-v2. Mientras tanto,
        podés usar la versión vanilla (branch <code className="text-accent-orange">main</code>)
        que tiene esta sección completa.
      </p>
      <p className="text-[10px] uppercase tracking-wider text-ink/30">
        react-v2 · próximamente
      </p>
    </div>
  );
}
