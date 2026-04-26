# TODO — Bruma

- **Estado:** Backlog inicial post-PRDv2.
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
- [~] Ejecutar `cargo test` en `src-tauri`: bloqueado en Linux local por dependencia nativa ausente `glib-2.0.pc`.
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

- [ ] Wrapper de markdown-it (`src/lib/markdown.ts`) con plugins GFM mínimos.
- [ ] Sanitización con DOMPurify y allowlist documentada (`ARCHITECTURE.md` §6).
- [ ] Componente `<Preview />` con `dangerouslySetInnerHTML` controlado.
- [ ] Modos de vista: solo editor / solo preview / dividido. Persistencia.
- [ ] Debounce de render (~150 ms).
- [ ] Estilos del preview (tipografía, espacios, código, tablas, citas).
- [ ] Tests unit: render Markdown determinista sobre fixtures.
- [ ] Tests unit: sanitización bloquea `<script>`, handlers `on*`, `javascript:`.
- [ ] Test E2E: editar y ver actualización del preview.

**Cierre del sprint:** preview en tiempo real funcional y seguro, con tres modos de vista.

---

## Sprint 4 — Búsqueda

- [ ] Diseño del panel de búsqueda (no modal, sobre el editor).
- [ ] Implementación: contador de coincidencias, navegación siguiente/anterior.
- [ ] Resaltado de coincidencias y de la activa.
- [ ] Toggle case-sensitive.
- [ ] Cierre con `Esc`, foco vuelve al editor.
- [ ] Atajo `Cmd/Ctrl + F`.
- [ ] Tests unit / component del estado de búsqueda.
- [ ] Test E2E: abrir archivo, buscar término, navegar entre resultados.

**Cierre del sprint:** búsqueda P0 completa.

---

## Sprint 5 — Estado de documento y robustez

- [ ] Confirmación al cerrar con cambios (Guardar / Descartar / Cancelar).
- [ ] Confirmación al abrir / cambiar archivo con cambios.
- [ ] Lista de recientes persistida (máx. 10) y submenú "Recientes".
- [ ] Eliminación / marca de recientes inválidos.
- [ ] Persistencia de configuración (tema, idioma, vista) en archivo de config del SO.
- [ ] Migración de config (campo `version`).
- [ ] Manejo de errores: archivo borrado entre apertura y guardado.
- [ ] Tests unit: lectura/escritura de config, migraciones.

**Cierre del sprint:** la app no pierde datos en escenarios normales y recuerda preferencias.

---

## Sprint 6 — i18n, accesibilidad y pulido

- [ ] Auditoría de strings: todos los textos visibles a través de `t()`.
- [ ] Catálogos `es.json` y `en.json` completos.
- [ ] Toggle de idioma en menú "Idioma".
- [ ] Detección inicial de idioma del SO.
- [ ] Auditoría de accesibilidad: navegación por teclado, roles ARIA, contraste AA.
- [ ] Iconos con `aria-label` o `<title>`.
- [ ] Foco visible y orden lógico de tabulación.
- [ ] Pruebas con lector de pantalla (VoiceOver en macOS, Narrator en Windows) — al menos flujo principal.

**Cierre del sprint:** app bilingüe y accesible en flujos críticos.

---

## Sprint 7 — Empaquetado y release v1.0

- [ ] Iconos finales (macOS `.icns`, Windows `.ico`).
- [ ] Metadata de la app (nombre, identificador, versión, descripción) en `tauri.conf.json`.
- [ ] CSP estricta verificada.
- [ ] Builds de release sin firmar para QA interno (macOS + Windows).
- [ ] Plan de firma macOS: cuenta Apple Developer, Developer ID, notarización.
- [ ] Plan de firma Windows: certificado Authenticode (deseable).
- [ ] Workflow `release.yml` con tag `v1.0.0`.
- [ ] Notas de release en `CHANGELOG.md`.
- [ ] Verificación de criterios de aceptación del MVP (`PRDv2.md` §14).
- [ ] Pruebas manuales sobre 20+ archivos `.md` reales.
- [ ] Pruebas en macOS 12+ (Apple Silicon e Intel) y Windows 10/11.

**Cierre del sprint:** release v1.0.0 disponible.

---

## Backlog — V1.1 (productividad)

- [ ] Reemplazar texto (panel extendido de búsqueda).
- [ ] Índice de encabezados navegable.
- [ ] Exportar a HTML (con estilos opcionales).
- [ ] Exportar a PDF (vía impresión a PDF del SO o renderer dedicado).
- [ ] Scroll sincronizado entre editor y preview.
- [ ] Apertura de enlaces externos con confirmación.
- [ ] Soporte de imágenes locales por ruta relativa.
- [ ] Conteo de palabras y caracteres en barra inferior.
- [ ] Zoom de tipografía (atajo `Cmd/Ctrl +/-`).

---

## Backlog — V1.2 (pulido)

- [ ] Pestañas múltiples.
- [ ] Modo enfoque.
- [ ] Preferencias avanzadas (fuente, tema personalizado, atajos).
- [ ] Atajos configurables.
- [ ] Autoguardado opcional.
- [ ] Recuperación de sesión.
- [ ] Frontmatter YAML básico (mostrar/ocultar, parseo).
- [ ] Plantillas de documentos.

---

## Backlog — V2.0 (Linux)

- [ ] CI con job Linux desde V1.x para detectar regresiones.
- [ ] Verificación de fuentes y assets multiplataforma con fallbacks.
- [ ] Empaquetado AppImage.
- [ ] Empaquetado `.deb` (Debian / Ubuntu).
- [ ] Empaquetado `.rpm` (Fedora).
- [ ] Investigación Flatpak.
- [ ] Pruebas manuales en Ubuntu LTS, Debian estable y Fedora reciente.
- [ ] Documentación específica de instalación por distro.

---

## Tareas transversales / continuas

- [ ] Mantener `CHANGELOG.md` actualizado en cada PR significativo.
- [ ] Mantener `ARCHITECTURE.md` cuando cambien decisiones técnicas.
- [ ] Revisión periódica de dependencias (Renovate / Dependabot).
- [ ] Auditoría de seguridad de dependencias (`npm audit`, `cargo audit`).
- [ ] Revisión de bundle size en cada release.

---

## Notas

- Cualquier tarea que afecte al alcance del MVP debe pasar por revisión de PRD.
- Las tareas de Linux **no** consumen capacidad antes de v1.0.
- Las dependencias deben fijarse a versiones mayor + minor; las menores se actualizan con PR dedicada.
