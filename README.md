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

| variable                 | uso                                                                  | requerida |
|--------------------------|----------------------------------------------------------------------|-----------|
| `VITE_SUPABASE_URL`      | URL del proyecto Supabase (ej. `https://wvxcqavtjtgvxdvtuvvd.supabase.co`) | sí        |
| `VITE_SUPABASE_ANON_KEY` | Anon JWT del proyecto Supabase (`Settings → API`)                    | sí        |
| `VITE_PAYPAL_CLIENT_ID`  | Client-id del SDK PayPal — `Live` para prod, `Sandbox` para tests    | opcional · si falta los botones de pago se deshabilitan |

## Deploy en Vercel

El repo trae `vercel.json` configurado para Vite + SPA. Al importar el
repo en Vercel, todo lo demás se autodetecta — solo hay que cargar las
env vars y elegir la rama.

**Pasos:**

1. En Vercel: `New Project` → importar `contacto185/flowback-hub`.
2. **Production branch** → `react-v2` (Project Settings → Git).
3. **Environment Variables** (Project Settings → Environment Variables):
   Cargar las 3 de la tabla de arriba. Habilitar el toggle de las 3
   environments (Production, Preview, Development).
4. `Deploy` → primera build corre `npm install && npm run build`.

**`vercel.json` ya configurado:**

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

La rewrite manda cualquier ruta no encontrada como archivo estático a
`/index.html` → React Router se hace cargo del routing client-side
(necesario para que `/eventos`, `/admin/videos`, etc. funcionen al
refrescar el browser).

Vercel sirve los archivos reales (`/assets/index-abc.js`, `/manifest.json`,
etc.) ANTES de aplicar las rewrites — la regla solo dispara para paths
que no matchean un archivo del build.

## Convivencia con `main`

| rama | entry point | runtime |
|---|---|---|
| `main` | `index.html` con todo inline | Vanilla JS desde CDN, sin build |
| `react-v2` | `index.html` shell de Vite → `src/main.tsx` | Build de Vite |

Las **migraciones SQL** (`migrations/`) y la **Edge Function** (`supabase/functions/confirm-payment/`) son las mismas en ambas ramas — la DB es compartida.
