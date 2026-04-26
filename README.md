# Bruma

> Editor Markdown de escritorio: ligero, local y simple.

**Estado:** Pre-alfa · Sprint 0. Existe andamiaje técnico mínimo, sin editor funcional todavía.

---

## Qué es

Bruma es un editor Markdown de escritorio enfocado en hacer muy bien lo esencial: abrir, leer, editar, buscar, previsualizar y guardar archivos `.md`. Sin nube, sin telemetría, sin distracciones.

- **Local-first:** tus archivos no salen de tu equipo.
- **Ligero:** binario pequeño y arranque inmediato (objetivo `< 20 MB`, `< 1 s`).
- **Simple:** lo justo para escribir Markdown cómodamente.
- **Multiplataforma:** macOS y Windows en MVP; Linux (Ubuntu, Debian, Fedora) en roadmap v2.0.

## Funciones del MVP

- Abrir, crear, guardar y "guardar como" archivos `.md` / `.markdown`.
- Editor con resaltado de sintaxis Markdown (CodeMirror 6).
- Vista previa renderizada en tiempo real (CommonMark + GFM acotado).
- Modos de vista: solo editor / solo preview / dividido.
- Búsqueda dentro del documento con navegación entre coincidencias.
- Detección de cambios no guardados con confirmación al cerrar.
- Drag & drop de archivos sobre la ventana.
- Lista de archivos recientes.
- Tema claro / oscuro / del sistema.
- Interfaz en español e inglés.

Detalle completo en [`docs/PRDv2.md`](docs/PRDv2.md).

## Lo que **no** hace (por diseño)

- No sincroniza con la nube.
- No tiene telemetría ni analítica.
- No incluye colaboración en tiempo real.
- No tiene plugins ni sistema de extensiones.
- No es un IDE Markdown ni un sustituto de Obsidian / Notion.

## Stack técnico

- [Tauri 2.x](https://tauri.app/) (Rust + WebView del SO).
- [React 18](https://react.dev/) + TypeScript.
- [CodeMirror 6](https://codemirror.net/) para el editor.
- [markdown-it](https://github.com/markdown-it/markdown-it) para el render.
- [DOMPurify](https://github.com/cure53/DOMPurify) para sanitización del HTML.
- [Vite](https://vitejs.dev/) como bundler.
- [i18next](https://www.i18next.com/) para internacionalización.

Detalle en [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Documentación

- [`docs/PRDv2.md`](docs/PRDv2.md) — PRD vigente.
- [`docs/PRDv1.md`](docs/PRDv1.md) — PRD original (referencia histórica).
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — arquitectura técnica.
- [`docs/TODO.md`](docs/TODO.md) — backlog de implementación por fases.
- [`CHANGELOG.md`](CHANGELOG.md) — historial de cambios.

## Roadmap resumido

| Versión | Foco                                                                      |
| ------- | ------------------------------------------------------------------------- |
| v1.0    | MVP: edición, preview, búsqueda, recientes, temas, i18n. macOS + Windows. |
| v1.1    | Reemplazar, exportar HTML/PDF, scroll sincronizado, imágenes locales.     |
| v1.2    | Pestañas, preferencias avanzadas, modo enfoque, autoguardado.             |
| v2.0    | Soporte Linux (Ubuntu, Debian, Fedora) con paquetes nativos.              |

## Requisitos previstos para usuarios finales

- **macOS** 12 (Monterey) o superior.
- **Windows** 10 (build 19041+) o Windows 11.
- **Linux** (a partir de v2.0): Ubuntu LTS 22.04+, Debian estable, Fedora reciente.

## Desarrollo

Requisitos para contribuir:

- Node.js LTS (≥ 20).
- pnpm.
- Rust estable (vía [rustup](https://rustup.rs/)).
- Toolchain Tauri según plataforma:
  - macOS: Xcode Command Line Tools.
  - Windows: Microsoft C++ Build Tools + WebView2 Runtime.

Comandos:

```bash
pnpm install          # instala dependencias frontend
pnpm dev              # arranca Vite en modo desarrollo
pnpm tauri dev        # arranca la app Tauri en modo desarrollo
pnpm build            # compila el frontend
pnpm tauri build      # compila la app empaquetada
pnpm lint             # ESLint
pnpm format:check     # comprobación Prettier
pnpm test             # tests unit/component (Vitest)
pnpm test:e2e         # smoke E2E (Playwright)
```

## Contribución

Hasta que el repositorio esté abierto al público, las contribuciones se gestionan internamente. Cuando se abra:

- Issues y PRs vía GitHub.
- **Convención de commits:** [Conventional Commits 1.0](https://www.conventionalcommits.org/es/v1.0.0/) (`feat:`, `fix:`, `docs:`, etc.). Validación automática con `commitlint`.
- **Versionado:** [SemVer](https://semver.org/) estricto.
- **Estilo de código:** Prettier + ESLint para TS/JS, `rustfmt` + `clippy` para Rust.

## Privacidad

Bruma es **local-first** estricto. No envía datos a servidores externos. No tiene telemetría. Los enlaces externos solo se abren con acción explícita del usuario y desde el navegador del SO.

## Licencia

[MIT](LICENSE). Eres libre de usar, modificar y redistribuir conservando el aviso de copyright.

---

## English (short)

Bruma is a lightweight, local-first desktop Markdown editor focused on doing the basics well: open, read, edit, search, preview, save. Built with Tauri, React and CodeMirror 6. macOS and Windows for MVP; Linux (Ubuntu, Debian, Fedora) on the v2.0 roadmap. No cloud, no telemetry, no plugins.

See `docs/PRDv2.md` and `docs/ARCHITECTURE.md` for details.
