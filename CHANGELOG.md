# Changelog

Todos los cambios notables de **Bruma** se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

## [1.4.4] - 2026-05-03

### Added

- Vista dividida: interruptor **Sincronizar scroll** en la barra de modo (`ViewModeBar`), visible solo en modo dividido, mismo patrón visual que el autoguardado de la toolbar.
- Preferencia persistida `splitScrollSync` en la configuración local (`CONFIG_VERSION` **9**).
- Hook `useSplitScrollSync`: sincronización bidireccional por ratio de scroll entre el `scrollDOM` de CodeMirror 6 y el `<article>` del preview (listeners pasivos y protección contra bucles).
- API del editor: `MarkdownEditorHandle.getScrollDOM()` para enlazar el elemento desplazable del editor.

### Fixed / Changed

- **Shell de la app:** `#root` queda acotado al viewport (`height: 100dvh`, `overflow: hidden`) y `AppShell` usa `h-dvh`, de modo que la cabecera (toolbar), pestañas y barra inferior ya no se desplazan con documentos largos; solo el área editor/preview/dividido hace scroll interno.

## [1.4.3] - 2026-05-03

### Added

- Comando nativo Tauri `print_current_window` para impresión directa desde la app desktop.
- Función `printCurrentWindow()` en frontend con fallback a `window.print()` para web.

### Fixed

- Scroll sync: ahora limpia `ratio` y `source` al desactivar la sincronización, evitando eventos residuales.
- PDF export: implementado canvas slicing por página en lugar de dibujar la imagen completa en cada página, mejorando precisión de paginación.
- PDF export: contenedor renderizado fuera de viewport con `left: -10000px` en lugar de hack de z-index.
- PDF export: estilos de fondo y color explícitos en el contenedor para evitar conflictos con CSS global.
- Editor y preview: añadido `overflow-hidden` para corregir comportamiento de scroll en layouts flex.
- Tests: añadido mock de localStorage en setup para arreglar tests que fallaban por `storage.getItem is not a function`.

### Changed

- CSP de Tauri: `frame-src` cambiado de `'none'` a `'self' about:'` para permitir el iframe interno de `html2canvas`.

## [1.4.2] - 2026-05-02

### Fixed

- Boton scroll-sync en vista split ahora desactiva realmente la sincronizacion editor↔preview. Se agregaron verificaciones defensivas en los handlers de scroll antes de emitir al store.
- Exportacion a PDF en Windows (portable) ya no falla en documentos medianos/grandes; se reemplaza el encoding manual `btoa(String.fromCharCode(...))` por `pdfDoc.saveAsBase64()` de pdf-lib, evitando desbordes de pila.
- Los fallos de exportacion ahora se registran en consola antes de mostrar el toast generico.

## [1.4.1] - 2026-05-02

### Added

- Exportacion PDF programatica usando `html2canvas` + `pdf-lib`: genera un PDF real paginado en A4 a partir de la vista previa del documento (EL220).
- Nuevo comando Tauri `save_binary_export_dialog` para guardar archivos binarios codificados en base64 mediante dialogo nativo del SO.
- Boton "Imprimir" en la barra de herramientas y accion `Archivo > Imprimir` en el menu nativo, separado del flujo de exportacion PDF.
- Modulo `src/lib/shortcuts.ts` con registro de comandos (`COMMAND_REGISTRY`), formateo de atajos para mostrar, normalizacion de bindings, deteccion de conflictos y coincidencia de eventos de teclado.

### Fixed

- Al cerrar el panel de busqueda, la seleccion del editor se colapsa a la posicion actual eliminando el resaltado de coincidencias sobrantes.
- Sincronizacion de scroll corregida para evitar saltos espurios: ya no se dispara si la fuente no es la vista previa o si no hay scroll activo.

### Changed

- Etiqueta de exportacion PDF cambiada de `PDF (imprimir)` a `PDF` (`es`/`en`).
- Clave `scrollSync.toggle` pasa a ser la etiqueta corta del control; la descripcion larga se mueve a `scrollSync.description`.

## [1.4.0] - 2026-05-01

### Added

- Inter font cargada via `@fontsource-variable/inter`, favicon SVG, meta `theme-color` y `description` en `index.html` (QW1).
- OG tags, Twitter card, canonical URL e imagen `og-image.svg` 1200×630 en la landing (QW2).
- Atributos `inert` y `aria-hidden` en el editor cuando Welcome esta visible (QW3).
- Regla global `@media (prefers-reduced-motion: reduce)` para respetar WCAG 2.3.3 (QW4).
- Transicion suave de colores en cambio de tema (`transition-colors 200ms` en body) (QW5/A7).
- CTA de descarga con deteccion de OS en la landing que apunta al asset correcto de la ultima release de GitHub (M6).
- Self-host de Inter en la landing, eliminando dependencia de Google Fonts (M7).
- Overlay decorativo se desvanece automaticamente en focus-mode via `data-focus` (M8).
- Tokens semanticos de z-index (`--z-base`, `--z-shell`, `--z-overlay`, `--z-modal`, `--z-toast`) en CSS y Tailwind (M10).
- Componente `Kbd` con atajos de teclado descubribles en las tarjetas de Welcome (B3).
- ErrorBoundary en root con pantalla degradada y boton de recarga (B5).
- Tests de regresion visual con Playwright snapshots (B6).
- Tema CodeMirror coherente con la marca (`brumaLightTheme` / `brumaDarkTheme`) usando variables shadcn (B7).
- Feedback visual de drag-over en TabBar con `ring-primary` (B8).
- Icono `RotateCcw` visible en boton de zoom cuando `fontScale !== 1` (B9).
- Fallback "desktop only" en `<md` para la app servida por web (B10).

### Changed

- Variables `--color-*` duplicadas eliminadas; consumidores migrados a tokens shadcn HSL (A1).
- Toolbar con scroll horizontal en pantallas estrechas y wrap natural a partir de `xl` (A4).
- Badge tagline: `text-emerald-50` sobre `bg-emerald-400/15` en dark para contraste ≥AA (A8).
- `IconButton` y `ToolbarGroup` movidos a `src/components/ui/icon-button.tsx` (M1).
- `PreferencesDialog` migrada a primitivas shadcn (`Checkbox`, `Select`, `Slider`) (M2).
- `ShortcutsDialog` migrada a `Dialog` de shadcn con focus trap y restore focus (M3).
- Keys `preview.label` y `toc.label` añadidas a `es/en` y usadas en `aria-label` (M4).
- `<p>` anidados eliminados dentro de `<DialogDescription>` en About (M11).
- Menu "Recent" vacio usa `<DropdownMenuItem disabled>` en lugar de `<div>` no focusable (M12).
- View-mode bar usa Radix `Tabs`/`TabsList`/`TabsTrigger` (M13).
- Imports de Lucide cambiados a forma canonica `import { X } from 'lucide-react'` (B1).
- Toolbar y AppShell extraidos de `App.tsx` a subcomponentes: `ToolbarFile`, `ToolbarWrite`, `ToolbarView`, `ToolbarZoom`, `ToolbarExport`, `AppShell`, `ViewModeBar`, `useTauriMenuBridge` (A5).
- Selectores Zustand agrupados con `useShallow` para evitar re-renders innecesarios (A6).

### Fixed

- Editor y preview en modo no-split no llenaban la altura disponible; contenedor cambiado de block a `flex flex-col` con `flex-1` en los hijos.
- `FRONTEND_IMPROVEMENTS.md` punto 9 marcado como resuelto — StatusBar ya tiene iconos (B4).

## [1.3.0] - 2026-05-01

### Added

- Reporte de bundle bajo demanda con `rollup-plugin-visualizer` y `npm run build:analyze`, generado en `dist/stats.html`.
- Script `npm run sync:version` para sincronizar la version desde `package.json` hacia Tauri, Cargo y `Cargo.lock`.
- Script `npm run check:version` para fallar si la metadata generada queda desincronizada.

### Changed

- Version de app actualizada a `1.3.0`; `package.json` queda como fuente unica de version editable.
- `build`, `dev` y `tauri` ejecutan sincronizacion de version antes de arrancar para evitar drift entre frontend, Tauri y Rust.
- Optimizacion de bundle: dialogs, busqueda, tabla de contenidos, preview, export HTML y editor se cargan bajo demanda.
- Separacion de chunks para `markdown`, `codemirror`, `lezer` y runtime del editor; el chunk inicial queda por debajo del limite de advertencia de Vite.
- Importaciones de iconos Lucide cambiadas a modulos directos para reducir modulos transformados y ruido en el reporte.

### Docs

- README, release checklist y backlog actualizados con el flujo de versionado automatico y los nuevos tamanos de bundle.

### Fixed

- Eliminadas referencias operativas antiguas a tags `v1.0.1` en la documentacion de release.

## [1.2.0] - 2026-04-30

### Changed

- Etiqueta de autoguardado acortada (`es`/`en`) y texto del toolbar enlazado al interruptor con `label`/`htmlFor` para accesibilidad.

### Fixed

- Contraste del `Switch` en tema claro: pista visible con fondos `input`/`primary` en estados off/on.
- Fixed Prettier formatting issues in 7 files to resolve CI format check failures.
- Fixed Rust test `reads_image_as_data_url_for_valid_file` by properly creating directory structure.
- Fixed Windows test failure in `accepts_new_markdown_paths_inside_home_on_write` by avoiding exact path comparison on Windows (canonicalize() can return NT paths).

### Added

- Release multiplataforma en GitHub Releases (macOS x64/Apple Silicon, Windows x64, Linux AppImage).
- Windows `portable-full` para x64 y arm64, incluyendo Fixed WebView2 Runtime.
- Suite E2E nativa (Tauri WebDriver / `tauri-driver`) con bridge de testing y tests en `tests-tauri/`.

### Changed

- Workflow `Release` endurecido ante descargas intermitentes de NSIS y empaquetado AppImage.
- `vitest` usa `happy-dom` para evitar problemas transitorios ESM/CJS en dependencias del entorno DOM.

## [1.0.1] - 2026-04-26

### Added

- `Archivo > Abrir recientes` pasa a ser un submenu nativo real sincronizado desde la lista de recientes del frontend.
- El popup de recientes del header ahora muestra nombre de archivo, path completo truncado y tooltip con la ruta completa.

### Changed

- Version de app, paquete npm y crate Rust actualizada a `1.0.1`.

### Fixed

- Se estabilizaron los listeners del menu nativo para evitar acciones duplicadas como abrir y guardar como.
- Se restauro el item nativo de salida en macOS para que `Cmd+Q` vuelva a cerrar la app correctamente.

### Security

- Los comandos Tauri de filesystem ahora canonicalizan paths y restringen lectura/escritura Markdown al home del usuario.
- Se añadieron tests Rust para rechazo de path traversal y validacion de paths permitidos.

### Docs

- Documentacion actualizada para reflejar artifacts versionados, validacion Rust en Linux y el hardening de seguridad.
- README, release notes y TODO actualizados para reflejar `v1.0.1` y el comportamiento del menu de recientes.

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
