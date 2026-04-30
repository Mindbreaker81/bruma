# Bruma — sitio de presentación

Página estática mínima para Vercel. En cada deploy, `build.mjs` lee el `README.md` y `CHANGELOG.md` de la raíz del monorepo y genera HTML en `dist/`.

**Importante:** el build necesita esos archivos en la raíz del repo. La configuración de Vercel está en [`vercel.json`](../vercel.json) en la **raíz del monorepo** (no uses solo la carpeta `landing/` como único contexto en Vercel).

## Desarrollo local

```bash
cd landing
npm install
npm run build
```

Abre `dist/index.html` en un servidor estático (por ejemplo `npx serve dist`).

## Vercel (dashboard Git)

1. Importar el repo **sin** fijar subcarpeta como raíz del proyecto, o con **Root Directory** vacío / `.` (raíz del repo).
2. Vercel leerá `vercel.json` en la raíz: instala dependencias en `landing/`, ejecuta el build ahí y publica `landing/dist`.

## Vercel CLI

Desde la **raíz del repositorio** (donde está `vercel.json`):

```bash
vercel          # preview
vercel --prod   # producción
```

Tras `vercel link`, la carpeta `.vercel/` es local y está ignorada por git.
