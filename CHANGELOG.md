# Changelog

Todos los cambios notables de **Bruma** se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

## [1.7.2] - 2026-06-27

### Fixed

- **Linux: UI en blanco o recortada con WebKitGTK**. Los workarounds de WebKit (`WEBKIT_DISABLE_DMABUF_RENDERER`, `WEBKIT_DISABLE_COMPOSITING_MODE`, `__NV_DISABLE_EXPLICIT_SYNC`) ahora se aplican en `main.rs` antes de arrancar Tauri, y el `.desktop` de deb/rpm/AppImage los incluye en `Exec`. Además, en Linux Tauri se desactivan `backdrop-filter` y las capas decorativas con blur de `AppShell`, que WebKitGTK no compone bien y dejaban la ventana vacía aunque React sí montaba.

## [1.7.1] - 2026-06-27

### Fixed

- **Linux/Ubuntu 24.04: ventana en blanco (continuación)**. Deshabilitar solo el renderer DMABUF no bastaba en algunos equipos (especialmente con GPU NVIDIA), donde la ventana seguía mostrando el frontend en blanco. La app ahora también setea automáticamente `WEBKIT_DISABLE_COMPOSITING_MODE=1` al iniciar en Linux, respetando el valor si el usuario ya lo ha definido (`WEBKIT_DISABLE_COMPOSITING_MODE=0` lo sobreescribe).
- **Release CI: el `.deb` (y `.rpm`) no se generaban ni se publicaban**. El job de Linux solo construía `--bundles appimage` y solo recolectaba el `.AppImage`. Ahora se construyen `deb` y `rpm` en un paso propio (independiente del AppImage, que puede fallar en CI) y se publican como assets `bruma-vX.Y.Z-linux-x86_64.deb` y `bruma-vX.Y.Z-linux-x86_64.rpm`.

## [1.7.0] - 2026-06-25

### Added

- **Resaltado de sintaxis en el editor**: títulos escalados con peso, énfasis (negrita/cursiva/tachado), código monoespaciado, enlaces con color de acento y marcadores atenuados (`#`, `*`, `` ` ``, `-`).
- **Números de línea (gutter)**: el ajuste "Mostrar números de línea" en Preferencias ahora funciona — muestra/oculta el gutter con `highlightActiveLineGutter` al cambiar.
- **Resaltado de línea activa** en el editor para mejor orientación visual.
- **Bundles Linux oficiales**: `deb`, `rpm` y `appimage` añadidos a `tauri.conf.json` `bundle.targets` junto a los existentes de macOS/Windows.
- **Sección Linux en README**: instrucciones de instalación para AppImage (incluida dependencia `libfuse2` en Ubuntu 24.04), `.deb` y `.rpm`, además de nota técnica sobre el bug DMABUF de WebKitGTK.
- Dependencias de desarrollo Linux (`libglib2.0-dev`, `libgtk-3-dev`, `libsoup-3.0-dev`, `libwebkit2gtk-4.1-dev`) documentadas en la sección de desarrollo local del README.

### Fixed

- **Linux/Ubuntu 24.04: ventana en blanco** por bug DMABUF de WebKitGTK 2.52+. La app ahora setea automáticamente `WEBKIT_DISABLE_DMABUF_RENDERER=1` al iniciar en Linux (siguiendo el mismo patrón que el fix de WebView2 en Windows), respetando el valor si el usuario ya lo ha definido.

## [1.6.1] - 2026-05-29

### Added

- Sistema híbrido de actualizaciones con comprobación automática al inicio y acción manual desde `Ayuda > Buscar actualizaciones`.
- Diálogo propio de actualización con versión actual/nueva, notas, progreso de descarga y acciones para instalar, recordar después o ignorar versión.
- Indicador visual en la toolbar de formato y prefijo en el menú nativo cuando hay una actualización disponible.
- Generación de `update.json` para GitHub Releases a partir de assets firmados por plataforma.

### Changed

- La configuración Tauri ahora genera artifacts de updater firmados y usa `tauri-plugin-updater` con endpoint estático en GitHub Releases.

## [1.6.0] - 2026-05-29

### Added

- **Diálogo "Atajos de teclado"** (solo lectura) con catálogo agrupado por Archivo, Edición, Vista, Formato y Zoom.
- Nuevo acceso al diálogo de atajos desde tres superficies: botón `Atajos` en la toolbar de formato, menú nativo `Ayuda > Atajos de teclado` y tecla `?` (cuando el foco no está en un campo editable).
- Tooltips de acciones en toolbar enriquecidos con atajos formateados para plataforma (macOS/Windows/Linux), incluyendo Archivo, Buscar, Vista y Zoom.
- Barra de estado con **posición de cursor** (`Ln`, `Col`) en modos editor/dividido.
- Botón **Repositorio** en el diálogo "Acerca de Bruma".
- Utilidades nuevas para mantener consistencia de atajos y cursor (`formatShortcut`, `shortcutsCatalog`, `cursorPosition`) con tests unitarios dedicados.

### Changed

- Las pills de **idioma** y **tema** en la barra de estado pasan a ser interactivas (ciclo directo desde la barra).
- Ajuste de layout en barra de estado para ventanas estrechas: el bloque de métricas usa overflow horizontal y evita recortes del nombre de archivo.
- Drag & drop en runtime Tauri ahora usa evento nativo `onDragDropEvent` y abre archivos por **ruta real** del sistema.

### Fixed

- **Windows:** los builds release de Bruma ya no abren una consola adicional al iniciar la app (`windows_subsystem = "windows"` en el binario).

## [1.5.0] - 2026-05-08

### Added

- **Toolbar de formato Markdown** sobre el editor: botones para negrita, cursiva, tachado, código, encabezados H1–H3, listas con viñetas / numeradas / de tareas, citas, enlaces, imágenes, bloques de código, tablas y reglas horizontales. Agrupados por familia con divisores. Visible solo cuando hay un documento abierto y no se está en focus mode ni preview puro.
- **Atajos de teclado de formato** en CodeMirror: `Mod-B` (negrita), `Mod-I` (cursiva), `Mod-E` (código en línea), `Mod-1/2/3` (encabezados), `Mod-K` (enlace).
- **Diálogo "Guía Markdown"** con secciones (Encabezados, Énfasis, Listas y citas, Bloques) que muestran ejemplos clicables; al pulsar uno se inserta su sintaxis en la posición del cursor.
- **Indicador de formato activo en la toolbar**: el botón correspondiente se resalta cuando el cursor está dentro del nodo (negrita, cursiva, encabezado, lista, cita, código, enlace, imagen, tabla, etc.). Implementado caminando el árbol de Lezer de `@codemirror/lang-markdown`.
- **Auto-continuación de listas** al pulsar Enter: continúa con `-`, `*`, `+`, listas numeradas (incrementando contador) y de tareas (con checkbox vacío). Pulsar Enter sobre un marcador vacío sale de la lista.
- **Pegar URL como enlace**: si pegas una URL sobre una selección no vacía, esta se envuelve como `[selección](url)` en lugar de reemplazarse (vía `pasteURLAsLink` de `@codemirror/lang-markdown`).
- **Sync de scroll editor↔preview por línea**: el preview se anota con `data-source-line` en cada bloque y la sincronización mapea línea ↔ elemento DOM, eliminando la deriva por ratio en documentos con bloques de altura desigual (imágenes, tablas, code blocks).
- API del editor: `MarkdownEditorHandle.applyFormat(action)`, `insertSnippet(text)`, `scrollToLineTop(line)`, `getTopVisibleLine()`.
- Dependencia directa: `@codemirror/language` (estaba en transitivos).

### Fixed

- El parser de markdown ahora carga GFM (`markdown({ base: markdownLanguage })`), por lo que el syntax highlighting y la detección de formato activo reconocen correctamente tachado y listas de tareas.
- `pnpm test` ya no es ruidoso por archivos `._*` que macOS crea en discos externos: vitest los excluye explícitamente.
- Asserts de tests que dependían de `<h1>X</h1>` exacto ahora aceptan atributos adicionales (`<h1 data-source-line="0">X</h1>`).

### Changed

- `useSplitScrollSync` reemplaza la sincronización por ratio con una basada en líneas fuente.
- El área editor/preview anida un `flex flex-col` dentro del `grid-rows-[auto_1fr]` exterior para acomodar la nueva toolbar de formato sin alterar el layout del Welcome state ni del modo dividido.

### Removed

- `DESIGN_REVIEW.md` y `FRONTEND_IMPROVEMENTS.md` de la raíz: notas de trabajo desactualizadas que duplicaban contenido del README/CHANGELOG.
- Plataforma `macos-13` (Intel) del matrix de `release.yml`: el pool hospedado de runners macOS Intel está siendo retirado y los jobs quedaban en `queued` indefinidamente. La build `macos-aarch64` se ejecuta en Intel vía Rosetta 2.

### Release & signing infrastructure

- **macOS Developer ID** firma + notarización automática en builds locales y de CI:
  - `tauri.conf.json` no fija `signingIdentity` — Tauri lee el env var `APPLE_SIGNING_IDENTITY` (presente en `.env.local` para local y como secret en CI), de modo que CI de PR sigue construyendo sin firmar.
  - `release.yml` importa el certificado `.p12` (vía `APPLE_CERTIFICATE` + `APPLE_CERTIFICATE_PASSWORD` secrets) en un keychain temporal del runner, materializa la API Key de App Store Connect (`APPLE_API_KEY_BASE64` → `.p8` en disco) y deja `APPLE_API_KEY_PATH` en `$GITHUB_ENV` para que el siguiente step la consuma.
  - El step de build pasa de "unsigned" a "signed & notarized": Tauri firma con `APPLE_SIGNING_IDENTITY`, sube a notarytool y staplea el ticket sobre `.app` y `.dmg`.
- `scripts/tauri.mjs`: wrapper de `pnpm tauri` que redirige `CARGO_TARGET_DIR` a `$TMPDIR/bruma-cargo-target` para builds locales (mantiene el árbol del repo limpio). En CI los workflows llaman a `pnpm exec tauri build` directamente para preservar las rutas por defecto.
- Documentación operativa actualizada en [docs/RELEASE.md](docs/RELEASE.md): credenciales, secrets requeridos, comprobaciones post-build (`spctl`, `notarytool`).

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
