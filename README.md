# Bruma

Editor Markdown de escritorio, local-first, enfocado en lo esencial.

## Estado actual

- Version de app: `1.0.0`
- Plataformas objetivo MVP: macOS y Windows
- Estado de entrega: build y tests CI en macOS/Windows en verde; pendiente QA manual de aceptacion final

## Que incluye v1.0.0

- Nuevo, abrir, guardar y guardar como (`.md` / `.markdown`)
- Editor Markdown (CodeMirror 6)
- Preview en tiempo real (markdown-it + sanitizacion con DOMPurify)
- Modos de vista: editor, preview, dividido
- Busqueda con contador, siguiente/anterior y case-sensitive
- Proteccion ante cambios sin guardar (confirmacion en acciones de riesgo)
- Drag and drop de archivos Markdown
- Recientes persistidos (max 10)
- Tema claro/oscuro/sistema
- Interfaz bilingue `es` / `en` con deteccion de idioma del sistema
- Menu nativo de app (Archivo, Editar, Ver, Idioma, Ayuda)

## Seguridad y privacidad

- Local-first estricto: sin nube y sin telemetria
- Sanitizacion de HTML del preview (bloquea scripts y payloads peligrosos)
- CSP de Tauri endurecida para build de escritorio

## Descargar builds desde GitHub Actions

El workflow CI sube bundles sin firmar por plataforma.

1. Ir a `Actions` en GitHub.
2. Abrir un run exitoso de `CI` (job `Tauri`).
3. Descargar artifacts con formato:
   - `bruma-v<version>-macos-latest-unsigned`
   - `bruma-v<version>-windows-latest-unsigned`

El nombre del artifact se genera automaticamente desde `package.json`.

## Desarrollo local

Requisitos:

- Node.js >= 20
- pnpm
- Rust estable (`rustup`)
- Toolchain Tauri por plataforma:
  - macOS: Xcode Command Line Tools
  - Windows: Microsoft C++ Build Tools + WebView2 Runtime

Comandos:

```bash
pnpm install
pnpm dev
pnpm tauri dev
pnpm lint
pnpm format:check
pnpm test
pnpm test:e2e
pnpm build
pnpm tauri build
```

Nota para entorno Linux de desarrollo: `cargo check/test` y `pnpm tauri build` pueden fallar si faltan librerias GTK/WebKit (`glib-2.0`, `gobject-2.0`, `gio-2.0`, `gdk-3.0`).

## Release interno

El workflow de release se dispara con el tag `v1.0.0`.

```bash
git tag v1.0.0
git push origin v1.0.0
```

El detalle operativo de firma y QA esta en `docs/RELEASE.md`.

## Calidad y CI

- Frontend: lint + format + unit tests + build
- E2E: smoke Playwright
- Tauri matrix: macOS + Windows
- Artifacts versionados automaticos en CI y Release

## Roadmap

- `v1.1`: reemplazar, exportar HTML/PDF, scroll sincronizado, imagenes locales
- `v1.2`: pestanas, preferencias avanzadas, modo enfoque, autoguardado
- `v2.0`: soporte Linux oficial (Ubuntu/Debian/Fedora)

## Documentacion

- `docs/PRDv2.md`: PRD vigente
- `docs/ARCHITECTURE.md`: arquitectura tecnica
- `docs/TODO.md`: estado por sprints
- `docs/RELEASE.md`: checklist de release/firma/QA
- `CHANGELOG.md`: historial de cambios

## Licencia

[MIT](LICENSE)
