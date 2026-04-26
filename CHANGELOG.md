# Changelog

Todos los cambios notables de **Bruma** se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

Sin cambios sin publicar.

## [1.0.0] - 2026-04-26

### Added

- Aplicacion Tauri 2 + React 18 con editor Markdown CodeMirror, preview sanitizada, busqueda, recientes y proteccion de cambios sin guardar.
- Interfaz bilingue `es`/`en` con deteccion del idioma del sistema y preferencia persistida.
- Tema claro/oscuro/sistema, modos editor/preview/dividido y configuracion versionada.
- Workflow `release.yml` para builds internos sin firmar en macOS y Windows.
- Fuente SVG del icono de Bruma y documentacion de release/firma en `docs/RELEASE.md`.

### Changed

- Version de app, paquete npm y crate Rust actualizada a `1.0.0`.
- CSP de Tauri endurecida para el bundle de escritorio.

### Security

- Preview Markdown renderizada con markdown-it y sanitizada con DOMPurify para bloquear scripts, handlers `on*` y URLs `javascript:`.

---

### Added

- Documentación de producto v2 (`docs/PRDv2.md`):
  - Nombre del producto: **Bruma**.
  - Stack técnico concretado (Tauri 2.x + React + TypeScript + CodeMirror 6 + markdown-it).
  - Especificación del dialecto Markdown soportado (CommonMark + GFM acotado).
  - Política expresa de privacidad: sin telemetría, local-first estricto.
  - Roadmap explícito de Linux (Ubuntu, Debian, Fedora) para v2.0.
  - Objetivos de rendimiento medibles (arranque < 1 s, RAM < 200 MB, binario < 30 MB).
  - Internacionalización inicial (es / en).
  - Matriz de soporte Markdown.
  - Estrategia de distribución, firma y notarización por plataforma.
  - Estrategia de pruebas a alto nivel.
- Documentación técnica inicial (`docs/ARCHITECTURE.md`):
  - Estructura de repositorio propuesta.
  - Modelo conceptual de documento y estado.
  - Frontera frontend ↔ backend (comandos Tauri y eventos).
  - Pipeline de render Markdown con sanitización.
  - Política de seguridad y CSP.
  - Pirámide de pruebas y CI/CD.
  - Decisiones abiertas pendientes para sprint 0.
- Backlog de implementación por sprints (`docs/TODO.md`).
- `README.md` inicial con descripción, stack, roadmap y guía prevista de desarrollo.
- Este archivo `CHANGELOG.md`.
- Archivo `LICENSE` con licencia **MIT**.
- Cierre de las decisiones de sprint 0:
  - Licencia: **MIT**.
  - Gestor de paquetes JS: **pnpm**.
  - Estilos: **Tailwind CSS**.
  - Resaltado de código en preview (MVP): **highlight.js**.
  - Panel de búsqueda: **panel propio en React** sobre comandos de CodeMirror 6.
  - Persistencia de configuración: **`tauri-plugin-store`** (oficial).
  - Versionado: **SemVer** estricto.
  - Convención de commits: **Conventional Commits** con validación por `commitlint`.
- Sección de convención de commits documentada en `docs/ARCHITECTURE.md` §21.
- Aclaración de compatibilidad macOS: soporte de Apple Silicon (arm64) + Intel (x86_64) via universal binary. Actualizado en `PRDv2.md` (RNF-04) y `ARCHITECTURE.md` (§16.1, §18).

### Changed

- Reescritura del PRD original con formato Markdown navegable y secciones revisadas (`docs/PRDv2.md` reemplaza funcionalmente a `docs/PRDv1.md`, que se conserva como referencia histórica).

---

<!--
Plantilla para próximas versiones:

## [X.Y.Z] - YYYY-MM-DD

### Added
- ...

### Changed
- ...

### Deprecated
- ...

### Removed
- ...

### Fixed
- ...

### Security
- ...
-->
