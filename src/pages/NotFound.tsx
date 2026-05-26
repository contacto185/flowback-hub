import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="py-16 text-center">
      <p className="text-6xl mb-3">🌿</p>
      <h1 className="font-serif text-2xl font-bold mb-2">Página no encontrada</h1>
      <p className="text-ink/50 mb-6">
        La sección que buscás no existe (o todavía no se migró desde v1).
      </p>
      <Link to="/" className="btn-grad">Volver al inicio</Link>
    </section>
  );
}
