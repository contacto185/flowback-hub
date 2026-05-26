export default function Home() {
  return (
    <section className="py-8">
      <h1 className="font-serif text-3xl font-black mb-2">
        Flowback Hub <span className="grad-text">v2</span>
      </h1>
      <p className="text-ink/60 mb-6">
        React + Vite + TypeScript + Tailwind. Migración de la single-page-app
        vanilla a una arquitectura por componentes.
      </p>

      <div className="card p-5 mb-4">
        <p className="text-sm text-ink/70 mb-3">Próximos pasos del scaffolding:</p>
        <ul className="text-sm space-y-1.5 list-disc list-inside text-ink/80">
          <li>Migrar componentes de navegación (header + bottom-nav)</li>
          <li>Routes para cada sección: <code>/eventos</code>, <code>/cursos</code>, <code>/clases</code>, etc.</li>
          <li>Auth context con <code>useAuth()</code> hook</li>
          <li>Hooks de fetching (<code>useEventos</code>, <code>usePlans</code>) con loading states</li>
        </ul>
      </div>

      <button className="btn-grad">Primer botón en React</button>
    </section>
  );
}
