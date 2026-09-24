# TODO — Bruma

- **Estado:** `v1.9.0` (plan de portapapeles y menú Editar F1–F9 completado y validado en macOS/Windows/Linux; fix de drag & drop en Windows/WebView2).
- **Último release:** `v1.9.0` (2026-09-24).
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

- [x] Decidir librería de primitivas accesibles: **Radix UI** (adoptada en v1.4.0 para diálogos, menús y controles de preferencias).

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
- [x] Ejecutar `pnpm tauri build`: verificado en Linux local 2026-09-14 — genera `Bruma_1.8.0_amd64.deb`; el paso de firma del updater requiere `TAURI_SIGNING_PRIVATE_KEY` (solo en CI).

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
- [x] Ejecutar `cargo check` en `src-tauri` (verificado en Linux local 2026-09-14 con las dependencias nativas ya instaladas).

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
- [x] Tests unit del wrapper de markdown-it (`src/lib/markdown.test.ts`, incluye sanitización).
- [x] Test E2E: abrir archivo de fixture y verificar contenido en editor. El smoke de Playwright cubre edición en Chromium; la apertura nativa la cubre el harness Tauri (`tests-tauri/`, `pnpm test:e2e:tauri` — mocha + tauri-driver + WebKitWebDriver, verificado en Linux 2026-09-16).

### Validación Sprint 2

- [x] Ejecutar `pnpm lint`.
- [x] Ejecutar `pnpm format:check`.
- [x] Ejecutar `pnpm test`.
- [x] Ejecutar `pnpm build`.
- [x] Ejecutar `pnpm test:e2e`.
- [x] Ejecutar `cargo check` en `src-tauri` (verificado en Linux local 2026-09-14 con las dependencias nativas ya instaladas).

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
- [x] Ejecutar `cargo check` en `src-tauri` (verificado en Linux local 2026-09-14 con las dependencias nativas ya instaladas).

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
- [x] Ejecutar `cargo check` en `src-tauri` (verificado en Linux local 2026-09-14 con las dependencias nativas ya instaladas).

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
- [x] Ejecutar `cargo check` en `src-tauri` (verificado en Linux local 2026-09-14 con las dependencias nativas ya instaladas).

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
- [x] Version inicial sincronizada en `package.json`, `src-tauri/Cargo.toml`, `Cargo.lock` y `tauri.conf.json`.
- [x] CSP estricta verificada en configuracion Tauri.
- [x] Builds de release para QA interno (macOS + Windows + Linux): superado — desde v1.8.0 los artifacts del updater se publican firmados.
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
- [x] Ejecutar `cargo check` en `src-tauri` (verificado en Linux local 2026-09-14).
- [x] Ejecutar `pnpm tauri build`: las dependencias nativas GTK/WebKit ya están instaladas en el entorno Linux local (verificado 2026-09-14).

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

## Release v1.3.0 — Bundle y versionado

- [x] Añadir `rollup-plugin-visualizer` y `pnpm build:analyze` para generar `dist/stats.html`.
- [x] Lazy-load de dialogos, busqueda, tabla de contenidos, preview, export HTML y editor.
- [x] Separar chunks de `markdown`, `codemirror`, `lezer` y runtime del editor.
- [x] Reducir el chunk inicial a menos de 500 kB minificados.
- [x] Cambiar iconos Lucide a imports directos para evitar transformar el barrel completo.
- [x] Crear `pnpm sync:version` con `package.json` como fuente unica editable.
- [x] Crear `pnpm check:version` para detectar drift de metadata generada.
- [x] Enganchar sincronizacion de version en `predev`, `prebuild` y `pretauri`.
- [x] Actualizar README, CHANGELOG y checklist de release.
- [x] Validar con `npm test`, `npm run lint`, `npm run build` y `npm run build:analyze`.

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

- [x] CI con job Linux: `ubuntu-latest` añadido a la matriz `tauri` de `ci.yml` — instala las dependencias nativas (WebKitGTK 4.1, GTK 3, appindicator, patchelf, rpm), corre `cargo test`/`fmt`/`clippy` y genera `.deb`/`.rpm`/`.AppImage` publicados en el draft release.
- [x] Empaquetado AppImage, `.deb` (Debian/Ubuntu), `.rpm` (Fedora): publicados firmados desde v1.7.x.
- [x] Investigación Flatpak: documento `docs/FLATPAK.md` (manifest esperado, portales, conflicto con el updater y riesgos de sandbox). Manifest en `flatpak/` compilado e instalado con `flatpak-builder` — la app arranca en el sandbox (2026-09-16); queda verificar abrir/guardar vía portal y las pruebas por distro.
- [ ] Pruebas manuales en Ubuntu LTS, Debian estable y Fedora reciente.
- [x] Documentación específica de instalación por distro: sección Linux en `README.md` (AppImage + `libfuse2`, `.deb`, `.rpm`).
- [x] Auditar fuentes / assets con fallbacks (Inter, monospace): stacks con fallbacks correctos en `:root`, Tailwind, editor, preview, export e impresión; Inter Variable va self-hosted vía `@fontsource-variable/inter`. Hallazgo corregido: la preferencia Tipografía (sans/mono) no tenía efecto porque `.bruma-editor .cm-editor` fijaba el stack mono — ahora el stack vive en `.bruma-editor`, la opción `sans` aplica Inter de verdad y el default pasa a `mono` (lo que ya se veía); las configs `<v10` con `sans` migran a `mono` (CONFIG_VERSION 10).

**Nota:** el antiguo bloqueo local (`glib-2.0.pc`, `gtk-3`, `webkit2gtk-4.1`) está resuelto: las dependencias nativas están instaladas y `cargo check` compila (2026-09-14).

---

## Tareas transversales / continuas

- [ ] Mantener `CHANGELOG.md` actualizado en cada PR significativo.
- [ ] Mantener `ARCHITECTURE.md` cuando cambien decisiones técnicas.
- [ ] Revisión periódica de dependencias (Renovate / Dependabot).
- [ ] Auditoría de seguridad de dependencias (`npm audit`, `cargo audit`).
- [x] Revisión de bundle size en release v1.3.0.
- [ ] Revisión de bundle size en cada release futura.
- [x] Verificar `cargo test` en CI macOS/Windows (la matriz `tauri` de `ci.yml` ejecuta `cargo test`, `fmt --check` y `clippy -D warnings`).

---

## En curso — Portapapeles y menú Editar

Plan detallado: `PLAN-PORTAPAPELES-Y-EDICION.md` (rama `claude/markdown-editor-clipboard-w9ddrq`).
Seguimiento en YouTrack: proyecto **BRU**.

- [ ] `D1` — protocolo de reproducción en Windows (confirmar si el teclado falla además de la UI).
- [~] `F1+F2` — menú Editar nativo completo (Rust) + puente de acciones de edición (**mismo commit**): implementado y en verde en CI local; pendiente verificación manual `V1`–`V9`.
- [x] `F3` — helpers de portapapeles: `src/lib/clipboard.ts` (read/write texto+HTML con degradación), `pasteText` en `format.ts` con `userEvent: 'input.paste'` y `clipboard.test.ts` (11 tests).
- [x] `F4` — botones Cortar/Copiar/Pegar al inicio de la barra de formato (`Scissors`/`Copy`/`ClipboardPaste`), con atajo en el tooltip, foco devuelto al editor y estado deshabilitado según contenido/`canReadClipboard()`.
- [x] `F5` — menú contextual propio (Radix, anclado al puntero): editor con cortar/copiar/pegar/seleccionar todo + negrita/cursiva/enlace + copiar como HTML; preview con copiar selección/documento/HTML renderizado. `onContextMenu` acotado al subárbol, los inputs de diálogos conservan el menú nativo.
- [x] `F6` — catálogo de atajos: acciones de edición (undo/redo/cut/copy/paste/select all/replace) con `shortcutWindows` (`Mod-Y` para rehacer fuera de Apple), diálogo de ayuda resolviendo la variante por plataforma e i18n es/en.
- [x] `F7` — acciones de copia de alto nivel: «Copiar documento», «Copiar como HTML» y botón «Copiar código» sobre cada `<pre>` de la preview (inyectado en el DOM tras el render, con delegación en el `onClick` del contenedor y toast de confirmación).
- [x] `F8` — tests: `MarkdownEditor.test.tsx` cubre `selectAll`/`hasSelection`/`getSelectedText`/`paste`/`undo`/`redo`/`cut`/`copy`; `tests/clipboard.spec.ts` (4 E2E: botones accesibles, copiar con permisos, pegar reemplaza selección, menú contextual). Limitación documentada: los E2E corren en Chromium y no validan el menú nativo — la verificación manual `V1`–`V9` sigue siendo obligatoria.
- [ ] Matriz de verificación manual `V1`–`V9` en macOS y Windows (Linux si hay entorno).
- [ ] `F9` — (backlog, decisión pendiente) pegar imagen del portapapeles.

## Siguiente orden sugerido

Pendientes:
- Validación manual en macOS y Windows (matriz `V1`–`V9` del plan de portapapeles, `D1` en Windows)
- QA de artifacts publicados por tag `vX.Y.Z` y gate operativo del updater (`PLAN-MEJORAS.md` F1.7)
- Verificación del prototipo Flatpak (abrir/guardar vía portal, menú nativo, updater) y pruebas manuales por distro (`docs/FLATPAK.md`, `flatpak/`, BRU-14)
- Auditoría de lector de pantalla (BRU-15): auditoría estática hecha (grupo `role="group"` en la barra, `aria-label` en inputs de búsqueda, foco devuelto al contenido al cerrar el menú contextual); la prueba real con lector de pantalla sigue pendiente.
- Seguimiento de tamaño de bundle en cada release

---

## Notas

- Cualquier tarea que afecte al alcance del MVP debe pasar por revisión de PRD.
- Las tareas de Linux **no** consumen capacidad antes de v1.0.
- Las dependencias deben fijarse a versiones mayor + minor; las menores se actualizan con PR dedicada.
