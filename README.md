# Flowback Hub — react-v2

Branch experimental con el rewrite de la app a React + Vite + TypeScript + Tailwind.

La rama `main` mantiene la app vanilla single-file (`index.html` ~5000 líneas).
Esta rama (`react-v2`) la migra incrementalmente a componentes.

## Stack

- **Vite 5** — dev server + build
- **React 18** + **TypeScript** (strict)
- **Tailwind CSS** con tema crema (`#faf6f1`) + acentos naranja/azul
- **react-router-dom 6** — navegación cliente
- **@supabase/supabase-js 2** — auth + DB + storage

## Setup local

```bash
git checkout react-v2
npm install
cp .env.example .env.local
# editar .env.local con las credenciales reales
npm run dev
```

Abre <http://localhost:5173>.

## Scripts

| comando | uso |
|---|---|
| `npm run dev` | dev server con HMR |
| `npm run build` | typecheck + build a `dist/` |
| `npm run preview` | servidor estático del build |
| `npm run lint` | typecheck sin emitir (`tsc -b --noEmit`) |

## Estructura

```
src/
├── components/      ← presentational + container components
├── hooks/           ← useAuth, useEventos, etc.
├── lib/             ← supabase client, constants, helpers
├── pages/           ← una por route
├── App.tsx          ← shell + <Routes>
├── main.tsx         ← createRoot + BrowserRouter
├── index.css        ← @tailwind directives + componentes globales
└── vite-env.d.ts    ← tipos de import.meta.env
```

Alias `@/*` → `src/*` (configurado en `vite.config.ts` y `tsconfig.json`).

## Variables de entorno

Ver `.env.example`. Las que empiezan con `VITE_` quedan disponibles en
`import.meta.env.VITE_*` (y se incrustan en el bundle — no usar para secrets
de server-side; esos van en las Edge Functions vía `supabase secrets set`).

## Convivencia con `main`

| rama | entry point | runtime |
|---|---|---|
| `main` | `index.html` con todo inline | Vanilla JS desde CDN, sin build |
| `react-v2` | `index.html` shell de Vite → `src/main.tsx` | Build de Vite |

Las **migraciones SQL** (`migrations/`) y la **Edge Function** (`supabase/functions/confirm-payment/`) son las mismas en ambas ramas — la DB es compartida.
