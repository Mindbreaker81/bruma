# Bruma — sitio de presentación

Página estática mínima para Vercel. En cada deploy, `build.mjs` lee el `README.md` y `CHANGELOG.md` de la raíz del monorepo y genera HTML en `dist/`.

## Desarrollo local

```bash
cd landing
npm install
npm run build
```

Abre `dist/index.html` en un servidor estático (o `npx serve dist`).

## Vercel

- **Root Directory:** `landing`
- **Framework:** Other
- **Build:** `npm run build`
- **Output:** `dist`

Con la integración GitHub, cada push a `main` reconstruye el sitio con el README y CHANGELOG del commit desplegado.
