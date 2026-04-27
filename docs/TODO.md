# TODO — Bruma

- **Estado:** `v1.1-block-a` (rama feature con bloques A, B, C, D, E completados).
- **Último release:** `v1.0.1` (2026-04-26).
- **Convención:** `[ ]` pendiente · `[~]` en curso · `[x]` hecho.
- **Referencias:** `PRDv2.md`, `ARCHITECTURE.md`.

> Cada tarea P0 debe terminar con: criterios de aceptación cumplidos, tests donde aplique, validación manual en macOS y Windows.

---

## Sprint 0 — Decisiones y andamiaje (sin código de producto aún)

### Decisiones cerradas

- [x] Nombre del producto: **Bruma**.
- [x] Licencia: **MIT** (`LICENSE` creado; revisar copyright holder antes de publicar).
- [x] Estilos: **Tailwind CSS**.
- [x] Resaltado de código del preview en MVP: **highlight.js**.
- [x] Panel de búsqueda: **propio en React** (delega comandos a CM6).
- [x] Persistencia de configuración: **tauri-plugin-store**.
- [x] Gestor de paquetes JS: **pnpm**.
- [x] Versionado: **SemVer** estricto.
- [x] Convención de commits: **Conventional Commits** + `commitlint`.

### Pendientes (no bloqueantes para arrancar)

- [ ] Decidir librería de primitivas accesibles (Radix UI / Headless UI / propios) cuando aparezca el primer componente que lo requiera.

### Andamiaje

- [x] Reemplazar `Bruma contributors` en `LICENSE` por el titular real del copyright antes de publicar.
- [x] Inicializar repositorio Git (`git init`, primer commit con docs y `LICENSE`).
- [x] Configurar `.gitignore`, `.editorconfig`, `.prettierrc`, `.eslintrc.cjs`.
- [x] Configurar `rustfmt.toml` y `clippy` settings (`Cargo.toml` lints).
- [x] Crear estructura de carpetas según `ARCHITECTURE.md` §3.
- [x] Inicializar Tauri 2.x (`pnpm create tauri-app` con plantilla React + TS).
- [x] Añadir Tailwind CSS al frontend (`tailwindcss`, `postcss`, `autoprefixer`, `tailwind.config.ts`).
- [x] Añadir dependencias clave: `@codemirror/state`, `@codemirror/view`, `@codemirror/lang-markdown`, `@codemirror/search`, `markdown-it`, `dompurify`, `highlight.js`, `i18next`, `react-i18next`, `lucide-react`, `zustand` (si se decide usarlo).
- [x] Añadir `tauri-plugin-store` (Rust crate + JS bindings).
- [x] Configurar Vite y `tsconfig.json` estricto.
- [x] Configurar i18next con `es` y `en` (solo keys mínimas iniciales).
- [x] Configurar Vitest + React Testing Library.
- [x] Configurar Playwright (smoke test sobre dev server).
- [x] Configurar Husky + commitlint (hook `commit-msg` con `@commitlint/config-conventional`).
- [x] (Opcional) Configurar `lint-staged` para Prettier/ESLint en pre-commit.
- [x] Crear workflow `ci.yml` (lint + test + build matriz macOS/Windows).
- [x] Documentar comandos básicos en `README.md`.

### Validación Sprint 0

- [x] Verificar prerequisitos: Node.js, pnpm, Rust estable y Cargo.
- [x] Ejecutar `pnpm install`.
- [x] Ejecutar `pnpm lint`.
- [x] Ejecutar `pnpm format:check`.
- [x] Ejecutar `pnpm test`.
- [x] Ejecutar `pnpm build`.
- [x] Ejecutar `pnpm test:e2e`.
- [x] Ejecutar `cargo test` en `src-tauri` (validado posteriormente en Ubuntu 24.04 con dependencias nativas instaladas).
- [~] Ejecutar `pnpm tauri build`: bloqueado en Linux local por dependencia nativa ausente `glib-2.0.pc`.

---

## Sprint 1 — Cimientos de UI y modelo de documento

- [x] Layout de la app: header (placeholder), área principal, barra inferior.
- [x] Tema claro/oscuro/sistema con variables CSS.
- [x] Toggle de tema accesible por menú y atajo.
- [x] Menú nativo Tauri (esqueleto: Archivo, Editar, Ver, Idioma, Ayuda).
- [x] Cableado de eventos de menú nativo → frontend.
- [x] Modelo `Document` y store (`src/features/files/state.ts`).
- [x] Buffer "Sin título" al arrancar.
- [x] Indicador `isDirty` en barra inferior y título de ventana.
- [x] Tests unit: lógica `isDirty`, transiciones de estado.

### Validación Sprint 1

- [x] Ejecutar `pnpm lint`.
- [x] Ejecutar `pnpm format:check`.
- [x] Ejecutar `pnpm test`.
- [x] Ejecutar `pnpm build`.
- [x] Ejecutar `pnpm test:e2e`.
- [~] Ejecutar `cargo check` en `src-tauri`: bloqueado en Linux local por dependencia nativa ausente `glib-2.0.pc`.

**Cierre del sprint:** la app abre, muestra layout, tema funciona, hay un documento vacío editable (sin persistencia aún).

---

## Sprint 2 — Editor + apertura/guardado básicos

- [x] Integrar CodeMirror 6 con `@codemirror/lang-markdown`.
- [x] Wrapper React `<MarkdownEditor />` con `value` / `onChange` debounced.
- [x] Comandos Rust: `open_file_dialog`, `read_file`, `save_file`, `save_file_dialog`.
- [x] Lectura UTF-8 con detección de BOM y de EOL (LF/CRLF).
- [x] Escritura UTF-8 sin BOM preservando EOL detectado.
- [x] Atajos: `Cmd/Ctrl + O`, `Cmd/Ctrl + S`, `Cmd/Ctrl + Shift + S`, `Cmd/Ctrl + N`.
- [x] Drag & drop de archivos `.md` / `.markdown` sobre la ventana.
- [x] Mostrar nombre de archivo en barra inferior.
- [x] Manejo de errores I/O con toast no bloqueante.
- [ ] Tests unit del wrapper de markdown-it (placeholder).
- [~] Test E2E: abrir archivo de fixture y verificar contenido en editor. Smoke actual cubre edición CodeMirror en Chromium; apertura nativa queda pendiente para harness Tauri.

### Validación Sprint 2

- [x] Ejecutar `pnpm lint`.
- [x] Ejecutar `pnpm format:check`.
- [x] Ejecutar `pnpm test`.
- [x] Ejecutar `pnpm build`.
- [x] Ejecutar `pnpm test:e2e`.
- [~] Ejecutar `cargo check` en `src-tauri`: bloqueado en Linux local por dependencia nativa ausente `glib-2.0.pc`.

**Cierre del sprint:** se puede abrir, editar y guardar un `.md` end-to-end en macOS y Windows.

---

## Sprint 3 — Preview y modos de vista

- [x] Wrapper de markdown-it (`src/lib/markdown.ts`) con plugins GFM mínimos.
- [x] Sanitización con DOMPurify y allowlist documentada (`ARCHITECTURE.md` §6).
- [x] Componente `<Preview />` con `dangerouslySetInnerHTML` controlado.
- [x] Modos de vista: solo editor / solo preview / dividido. Persistencia.
- [x] Debounce de render (~150 ms).
- [x] Estilos del preview (tipografía, espacios, código, tablas, citas).
- [x] Tests unit: render Markdown determinista sobre fixtures.
- [x] Tests unit: sanitización bloquea `<script>`, handlers `on*`, `javascript:`.
- [x] Test E2E: editar y ver actualización del preview.

### Validación Sprint 3

- [x] Ejecutar `pnpm lint`.
- [x] Ejecutar `pnpm format:check`.
- [x] Ejecutar `pnpm test`.
- [x] Ejecutar `pnpm build`.
- [x] Ejecutar `pnpm test:e2e`.
- [~] Ejecutar `cargo check` en `src-tauri`: bloqueado en Linux local por dependencias nativas ausentes `glib-2.0.pc`, `gobject-2.0.pc`, `gio-2.0.pc` y `gdk-3.0.pc`.

**Cierre del sprint:** preview en tiempo real funcional y seguro, con tres modos de vista.

---

## Sprint 4 — Búsqueda

- [x] Diseño del panel de búsqueda (no modal, sobre el editor).
- [x] Implementación: contador de coincidencias, navegación siguiente/anterior.
- [x] Resaltado de coincidencias y de la activa.
- [x] Toggle case-sensitive.
- [x] Cierre con `Esc`, foco vuelve al editor.
- [x] Atajo `Cmd/Ctrl + F`.
- [x] Tests unit / component del estado de búsqueda.
- [x] Test E2E: abrir archivo, buscar término, navegar entre resultados.

### Validación Sprint 4

- [x] Ejecutar `pnpm lint`.
- [x] Ejecutar `pnpm format:check`.
- [x] Ejecutar `pnpm test`.
- [x] Ejecutar `pnpm build`.
- [x] Ejecutar `pnpm test:e2e`.
- [~] Ejecutar `cargo check` en `src-tauri`: bloqueado en Linux local por dependencias nativas ausentes `glib-2.0.pc`, `gobject-2.0.pc`, `gio-2.0.pc` y `gdk-3.0.pc`.

**Cierre del sprint:** búsqueda P0 completa.

---

## Sprint 5 — Estado de documento y robustez

- [x] Confirmación al cerrar con cambios (Guardar / Descartar / Cancelar).
- [x] Confirmación al abrir / cambiar archivo con cambios.
- [x] Lista de recientes persistida (máx. 10) y submenú "Recientes".
- [x] Eliminación / marca de recientes inválidos.
- [x] Persistencia de configuración (tema, idioma, vista) en archivo de config del SO.
- [x] Migración de config (campo `version`).
- [x] Manejo de errores: archivo borrado entre apertura y guardado.
- [x] Tests unit: lectura/escritura de config, migraciones.

### Validación Sprint 5

- [x] Ejecutar `pnpm lint`.
- [x] Ejecutar `pnpm format:check`.
- [x] Ejecutar `pnpm test`.
- [x] Ejecutar `pnpm build`.
- [x] Ejecutar `pnpm test:e2e`.
- [~] Ejecutar `cargo check` en `src-tauri`: bloqueado en Linux local por dependencias nativas ausentes `glib-2.0.pc`, `gobject-2.0.pc`, `gio-2.0.pc` y `gdk-3.0.pc`.

**Cierre del sprint:** la app no pierde datos en escenarios normales y recuerda preferencias.

---

## Sprint 6 — i18n, accesibilidad y pulido

- [x] Auditoría de strings: todos los textos visibles a través de `t()`.
- [x] Catálogos `es.json` y `en.json` completos.
- [x] Toggle de idioma en menú "Idioma".
- [x] Toggle de idioma en toolbar con preferencia persistida (`system` / `es` / `en`).
- [x] Detección inicial de idioma del SO.
- [x] Auditoría de accesibilidad: navegación por teclado, roles ARIA, contraste AA.
- [x] Iconos con `aria-label` o `<title>`.
- [x] Foco visible y orden lógico de tabulación.
- [x] Tests unit/E2E para cambio de idioma y roles accesibles principales.
- [~] Pruebas con lector de pantalla (VoiceOver en macOS, Narrator en Windows) — pendiente en maquinas reales.

### Validación Sprint 6

- [x] Ejecutar `pnpm lint`.
- [x] Ejecutar `pnpm format:check`.
- [x] Ejecutar `pnpm test`.
- [x] Ejecutar `pnpm build`.
- [x] Ejecutar `pnpm test:e2e`.

**Cierre del sprint:** app bilingüe y accesible en flujos críticos.

---

## Sprint 7 — Empaquetado y release v1.0

- [x] Iconos finales (macOS `.icns`, Windows `.ico`).
- [x] Metadata de la app (nombre, identificador, versión, descripción) en `tauri.conf.json`.
- [x] Version v1.0.0 sincronizada en `package.json`, `src-tauri/Cargo.toml`, `Cargo.lock` y `tauri.conf.json`.
- [x] CSP estricta verificada en configuracion Tauri.
- [~] Builds de release sin firmar para QA interno (macOS + Windows): workflow listo; artefactos pendientes al crear/pushear tag `v1.0.0`.
- [x] Plan de firma macOS: cuenta Apple Developer, Developer ID, notarización.
- [x] Plan de firma Windows: certificado Authenticode (deseable).
- [x] Workflow `release.yml` con tag `v1.0.0`.
- [x] Artifacts CI/Release versionados automaticamente desde `package.json`.
- [x] Notas de release en `CHANGELOG.md`.
- [~] Verificación de criterios de aceptación del MVP (`PRDv2.md` §14): cobertura automatizada lista; tiempos/binario y QA manual pendientes en macOS/Windows.
- [ ] Pruebas manuales sobre 20+ archivos `.md` reales.
- [ ] Pruebas en macOS 12+ (Apple Silicon e Intel) y Windows 10/11.

### Validación Sprint 7

- [x] Ejecutar `pnpm lint`.
- [x] Ejecutar `pnpm format:check`.
- [x] Ejecutar `pnpm test`.
- [x] Ejecutar `pnpm build`.
- [x] Ejecutar `pnpm test:e2e`.
- [x] Ejecutar `cargo fmt --check` en `src-tauri`.
- [x] Ejecutar `cargo test` en `src-tauri` (validado en Ubuntu 24.04 con `libglib2.0-dev`, `libgtk-3-dev`, `libsoup-3.0-dev` y `libwebkit2gtk-4.1-dev`).
- [~] Ejecutar `cargo check` en `src-tauri`: sigue dependiendo de un entorno Linux con librerias nativas GTK/WebKit disponibles.
- [~] Ejecutar `pnpm tauri build`: frontend compila; bundle Tauri bloqueado en Linux local por dependencias nativas ausentes `glib-2.0.pc` y `gobject-2.0.pc`.

**Cierre del sprint:** release v1.0.0 disponible.

---

## Post-release v1.0.1 — Ajustes de menu nativo

- [x] Convertir `Archivo > Abrir recientes` en un submenu nativo real sincronizado desde `recentFiles`.
- [x] Emitir evento dedicado `menu://recent-open` para abrir recientes desde el menu nativo.
- [x] Mejorar popup de recientes en header con basename, path truncado y tooltip del path completo.
- [x] Restaurar item nativo `Quit` en macOS para que `Cmd+Q` cierre la app.
- [x] Sincronizar version `1.0.1` en frontend, paquete npm y crate Rust.
- [x] Validar con `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm test:e2e`, `cargo fmt --check` y `cargo test`.

---

## Hardening — Seguridad FS

- [x] Restringir `read_file` y `save_file` al home del usuario tras canonicalizacion.
- [x] Resolver symlinks y rechazar traversal fuera del alcance permitido.
- [x] Añadir tests Rust de lectura/escritura valida y rechazo de paths del sistema.
- [x] Documentar la decision en `docs/SECURITY.md`.
- [x] Verificar `cargo test` con dependencias nativas instaladas en Ubuntu 24.04.

---

## Backlog — V1.1 (productividad)

- [x] Bloque A: word count, font zoom, focus mode, outline sidebar (`60b87f7`).
- [x] Bloque B: scroll sync, link confirm, export HTML/PDF, imágenes locales (`ed10586`).
- [x] Bloque C: replace text, frontmatter YAML toggle (`3f1c938`).
- [x] Bloque D: autoguardado, recuperación de sesión, plantillas.
- [x] Bloque E: pestañas, preferencias avanzadas, atajos configurables.

### Bloque D — Sesión y robustez (v1.2)

#### D.1 Autoguardado opcional

- [x] Añadir `autosaveEnabled` y `autosaveDelayMs` a `AppConfig` (CONFIG_VERSION v5).
- [x] Hook `useEffect` debounced que dispara `handleSave()` cuando `(autosaveEnabled && isDirty && document.path)` cambia.
- [x] Toggle en toolbar y panel de preferencias.
- [x] Indicador visual en footer ("Guardando…" / "Guardado a las HH:MM").

#### D.2 Recuperación de sesión

- [x] Añadir `pendingSession` al config con path, content, eol, savedAt.
- [x] Persistir `pendingSession` con debounce en `useFileStore.updateContent`.
- [x] Diálogo `<RestoreSessionDialog />` con Recuperar / Descartar.

#### D.3 Plantillas de documentos

- [x] Built-ins: nota vacía, post de blog, reunión, README mínimo.
- [x] Plantillas custom en `~/.config/bruma/templates/*.md`.
- [x] Submenú en botón "Nuevo" con built-ins + custom.

### Bloque E — Multi-doc y preferencias (v1.2)

#### E.1 Pestañas múltiples

- [x] Refactor `useFileStore` con `tabs[]`, `activeTabId`.
- [x] Component `<TabBar />` con drag-to-reorder.
- [x] Atajos: `Cmd/Ctrl+T` nueva, `Cmd/Ctrl+W` cerrar, `Cmd/Ctrl+Tab` siguiente.

#### E.2 Preferencias avanzadas

- [x] Component `<PreferencesDialog />` accesible desde menú y `Cmd/Ctrl+,`.
- [x] Secciones: aspecto, editor, preview, atajos.
- [x] Schema config con `editorFontFamily`, `editorTabSize`, etc.

#### E.3 Atajos configurables

- [x] Registro central de comandos con bindings mutables.
- [x] Hook `useShortcut(commandId, handler)` global.
- [x] UI en preferencias con tabla de comandos y captura de bindings.

---

## Backlog — V2.0 (Linux)

- [ ] CI con job Linux desde V1.x para detectar regresiones (preventivo, sin entregar binarios).
- [ ] Empaquetado AppImage, `.deb` (Debian/Ubuntu), `.rpm` (Fedora).
- [ ] Investigación Flatpak.
- [ ] Pruebas manuales en Ubuntu LTS, Debian estable y Fedora reciente.
- [ ] Documentación específica de instalación por distro.
- [ ] Auditar fuentes / assets con fallbacks (Inter, monospace).

**Nota:** el bloqueo local actual (`glib-2.0.pc`, `gtk-3`, `webkit2gtk-4.1`) es ambiental, no de código.

---

## Tareas transversales / continuas

- [ ] Mantener `CHANGELOG.md` actualizado en cada PR significativo.
- [ ] Mantener `ARCHITECTURE.md` cuando cambien decisiones técnicas.
- [ ] Revisión periódica de dependencias (Renovate / Dependabot).
- [ ] Auditoría de seguridad de dependencias (`npm audit`, `cargo audit`).
- [ ] Revisión de bundle size en cada release.
- [ ] Verificar `cargo test` en CI macOS/Windows (tests de `image_mime_for_path`, `ensure_extension`, `read_image_as_data_url`, `accepts_new_markdown_paths_inside_home_on_write`).

---

## Sugerencia de orden para v1.2

Los bloques A-E de v1.1 están completados. Pendientes:
- Validación manual en macOS y Windows
- Considerar bump a v1.1.0 para release

---

## Notas

- Cualquier tarea que afecte al alcance del MVP debe pasar por revisión de PRD.
- Las tareas de Linux **no** consumen capacidad antes de v1.0.
- Las dependencias deben fijarse a versiones mayor + minor; las menores se actualizan con PR dedicada.
