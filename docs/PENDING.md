# Pendiente — Bruma

> Snapshot tras completar **v1.1 Bloques A · B · C** en la rama `feature/v1.1-block-a`.
>
> Convención: `[ ]` pendiente · `[~]` en curso · `[x]` hecho.
> Cada feature lista: archivos clave, criterios de aceptación, riesgos y tests sugeridos.

---

## Estado actual

| Versión | Estado |
| --- | --- |
| **v1.0.1** | en QA interno, tag pendiente. Ver `TODO.md` §Sprint 7. |
| **v1.1 Bloque A** | ✅ word count, font zoom, focus mode, outline sidebar (`60b87f7`). |
| **v1.1 Bloque B** | ✅ scroll sync, link confirm, export HTML/PDF, imágenes locales (`ed10586`). |
| **v1.1 Bloque C** | ✅ replace text, frontmatter YAML toggle (`3f1c938`). |
| **v1.1 Bloque D** | ⏳ autoguardado, recuperación de sesión, plantillas. |
| **v1.2 Bloque E** | ⏳ pestañas, prefs avanzadas, atajos configurables. |
| **v2.0 Linux** | ⏳ packaging multi-distro. |

`docs/TODO.md` sigue siendo la fuente canónica de los Sprints 0-7. Este documento sólo cubre lo que falta a partir del corte v1.1 / v1.2 / v2.0.

---

## Bloque D — Sesión y robustez (v1.2 según TODO original)

### D.1 Autoguardado opcional

**Objetivo:** guardar automáticamente al detectar `isDirty` después de N ms de inactividad, sin abrir diálogo. Solo cuando el documento tiene `path` (los buffers "Sin título" no tocan disco).

- [ ] Añadir `autosaveEnabled: boolean` y `autosaveDelayMs: number` (default `2000`) a `AppConfig` (bumpear `CONFIG_VERSION` a 5).
- [ ] Extender `useThemeStore` (o crear `useEditorPrefsStore`) con `autosaveEnabled`, `setAutosaveEnabled`, `autosaveDelayMs`, `setAutosaveDelayMs`.
- [ ] En `App.tsx`, hook `useEffect` que dispara `handleSave()` debounced cuando `(autosaveEnabled && isDirty && document.path)` cambia.
- [ ] Cancelar el timer en cleanup y al cambiar de archivo.
- [ ] Toggle en toolbar (icono `Save` con badge) y/o en panel de preferencias (Bloque E).
- [ ] Indicador visual breve en footer ("Guardando…" / "Guardado a las HH:MM").
- [ ] i18n keys: `autosave.toggle`, `autosave.savingNow`, `autosave.lastSavedAt`.

**Tests sugeridos**
- Pure: `shouldAutosave(state)` helper con casos: dirty + path + enabled → true; sin path → false; enabled false → false.
- Component (vitest + RTL + fake timers): cambio de contenido + advance(2000ms) llama a `handleSave`.

**Riesgos**
- Conflicto con auto-formatters externos que escriben al mismo archivo.
- Pérdida de datos si la escritura falla silenciosamente. Mostrar toast de error reusable (`errors.saveFailed`).

---

### D.2 Recuperación de sesión

**Objetivo:** al cerrar la app con cambios sin guardar, recuperar el contenido al volver a abrir.

- [ ] Añadir `pendingSession: { path: string | null, content: string, eol: 'lf'|'crlf', savedAt: number } | null` al config.
- [ ] En `useFileStore.updateContent`, persistir `pendingSession` con debounce (~500 ms).
- [ ] Al limpiar (save, abrir nuevo, etc.), borrar `pendingSession`.
- [ ] Al arrancar:
  - Si `pendingSession` existe y tiene `path`, intentar `readFile(path)`. Si difiere del contenido guardado, mostrar diálogo "Recuperar sesión / Descartar".
  - Si `pendingSession` no tiene `path` (buffer Sin título), restaurar buffer y marcarlo dirty.
- [ ] Diálogo `<RestoreSessionDialog />` con tres acciones: Recuperar / Descartar / Ver diferencias (opcional).
- [ ] i18n keys: `session.restoreTitle`, `session.restoreBody`, `session.recover`, `session.discard`.

**Tests sugeridos**
- Migración: config v4 sin `pendingSession` → v5 con `pendingSession: null`.
- Store: `updateContent` debounced escribe a `pendingSession`.
- Restore: simular config con `pendingSession` y verificar dialog se abre.

**Riesgos**
- Tamaño del config crece. Evaluar mover `pendingSession` a archivo separado en `appLocalDataDir` si excede ~500 KB.
- Condición de carrera con autoguardado: si autosave guardó pero el cleanup no limpió pendingSession, mostrar diálogo aunque ya esté en sync. Mitigación: comparar `savedAt` con `mtime` del archivo.

---

### D.3 Plantillas de documentos

**Objetivo:** "Nuevo desde plantilla" con un set predefinido y plantillas custom.

- [ ] `src/features/templates/templates.ts`:
  ```ts
  export type Template = { id: string; name: string; content: string; locale?: 'es'|'en' };
  export const BUILTIN_TEMPLATES: Template[];
  ```
  Built-ins: nota vacía, post de blog (frontmatter title/date), reunión (asistentes/agenda/acuerdos), README mínimo.
- [ ] Plantillas custom en config (`customTemplates: Template[]`) o como archivos en `~/.config/bruma/templates/*.md` (preferible).
- [ ] Comando Rust `list_templates()` y `read_template(id)` si vamos por archivos.
- [ ] Submenú en botón "Nuevo": dropdown con built-ins + custom + "Abrir carpeta de plantillas".
- [ ] Atajo opcional: `Cmd/Ctrl+Shift+N` abre selector.
- [ ] i18n: `templates.open`, `templates.empty`, `templates.openFolder`, nombres de built-ins.

**Tests sugeridos**
- Pure: `applyTemplate(template, { now })` rellena placeholders `{{date}}`, `{{title}}`.
- Loader: rechaza archivos sin extensión `.md` o que excedan 1 MB.

**Riesgos**
- Si vamos por archivos: hardening FS ya cubierto por `read_file`, pero la carpeta de plantillas debería estar dentro de `appConfigDir` (fuera del home requeriría relajar la allowlist).

---

## Bloque E — Multi-doc y preferencias (v1.2)

### E.1 Pestañas múltiples

**Objetivo:** abrir varios documentos a la vez con UI de tabs, navegación por teclado y cierre individual.

- [ ] Refactor `useFileStore`:
  ```ts
  type Tab = { id: string; document: Document; isDirty: boolean; lastSavedAt: number };
  type FileState = {
    tabs: Tab[];
    activeTabId: string | null;
    // Compatibility selectors:
    document: Document; // == tabs.find(t => t.id === activeTabId).document
    isDirty: boolean;
    displayName: string;
    // Actions:
    openTab(file: OpenedFile): void;
    closeTab(id: string): void;
    activateTab(id: string): void;
    moveTab(id: string, toIndex: number): void;
  };
  ```
- [ ] Editor: re-montar al cambiar `activeTabId` o usar `EditorState.create` por tab y swap.
- [ ] Component `<TabBar />` con drag-to-reorder, scroll horizontal, indicador dirty (`•`).
- [ ] Atajos: `Cmd/Ctrl+T` nueva, `Cmd/Ctrl+W` cerrar, `Cmd/Ctrl+Tab` siguiente, `Cmd/Ctrl+Shift+Tab` anterior.
- [ ] Confirmación de cambios sin guardar al cerrar tab (reusar `ConfirmDirtyDialog`).
- [ ] Persistir `tabs` y `activeTabId` en `pendingSession` (sinergias con D.2).
- [ ] Recientes: dedupe contra tabs ya abiertas.

**Tests sugeridos**
- Store: open/close/activate/move; cerrar la activa selecciona la siguiente.
- Component: aria-selected, foco al activar, contador dirty.

**Riesgos / decisiones abiertas**
- TOC sidebar y search ahora son por-tab. ¿Compartir estado o aislarlo? Recomendación: aislarlo (`Map<tabId, SearchState>`).
- Memoria con muchos archivos grandes. Considerar lazy unload del `EditorState` para tabs no activas.
- Esto es un refactor amplio: hacer en una rama dedicada y mergear primero D antes que E para no rehacer D.

---

### E.2 Preferencias avanzadas

**Objetivo:** panel "Preferencias" con configuración fina más allá de los toggles del toolbar.

- [ ] Component `<PreferencesDialog />` accesible desde menú (Help/Bruma > Preferencias) y atajo `Cmd/Ctrl+,`.
- [ ] Secciones:
  - Aspecto: tema, idioma, family de fuente (sans / serif / monospace), tamaño base.
  - Editor: ancho de tabulación, ajuste de línea, mostrar números de línea, autosave (de D.1).
  - Preview: tipografía, ancho máximo, mostrar tabla de contenidos por defecto.
  - Atajos: lista del registry (E.3) editable.
- [ ] Schema config nuevos campos: `editorFontFamily`, `editorTabSize`, `editorShowGutter`, `editorWrap`.
- [ ] Integración con `MarkdownEditor`: usar `Compartment` para reconfigurar `EditorState.tabSize`, gutters, line wrapping en caliente.
- [ ] Validación: rangos sanos, fallback a defaults.

**Tests sugeridos**
- Migración v5 → v6 con nuevos campos.
- Component: cambios aplican y persisten; "Restablecer" vuelve a defaults.

**Riesgos**
- Crece la superficie del config. Considerar split en `bruma.config.json` (pequeño, frecuente) y `bruma.preferences.json` (raro).

---

### E.3 Atajos configurables

**Objetivo:** registro central de comandos + binding mutable persistido.

- [ ] `src/features/shortcuts/registry.ts`:
  ```ts
  type Command = { id: string; defaultBinding: string; handler: () => void };
  ```
  Comandos a registrar: file_new, file_open, file_save, file_save_as, edit_find, edit_replace, view_toggle_theme, view_cycle_mode, focus_mode_toggle, toc_toggle, font_zoom_in/out/reset, scroll_sync_toggle, frontmatter_toggle, export_open.
- [ ] `shortcuts: Record<string, string>` en config (override sobre defaults).
- [ ] Hook `useShortcut(commandId, handler)` que escucha keydown global, parseando el binding (Mod+Shift+Key).
- [ ] UI en preferencias: tabla con columnas Comando · Binding actual · Default · "Capturar nuevo binding" (escucha keydown), botón Reset.
- [ ] Detección de conflictos al asignar.
- [ ] El menú nativo Tauri debe sincronizarse: extender `menu.rs` para aceptar bindings desde frontend (comando `set_menu_accelerators(map)`), porque los menús nativos owns la combinación si la tienen registrada.

**Tests sugeridos**
- Pure: `parseBinding('Mod+Shift+T')` normaliza por plataforma.
- Conflict detection.
- Migración config: shortcuts faltantes resuelven a default.

**Riesgos**
- Tauri 2 menus aceptan accelerators sólo al construir el menú. Cambiar bindings requiere reconstruir el menú: ya tenemos ese flujo (`refresh_menu` para recientes), reusar.
- Algunos atajos del SO (Cmd+Q en macOS, F11 en Windows) no deberían poderse rebindear.

---

## v2.0 — Linux

Heredado de `TODO.md`, sin cambios:

- [ ] Job CI Linux desde V1.x (preventivo, sin entregar binarios).
- [ ] AppImage, `.deb`, `.rpm`, investigación Flatpak.
- [ ] QA en Ubuntu LTS, Debian estable, Fedora reciente.
- [ ] Docs de instalación por distro.
- [ ] Auditar fuentes / assets con fallbacks (Inter, monospace).

Nota: el bloqueo local actual (`glib-2.0.pc`, `gtk-3`, `webkit2gtk-4.1`) es ambiental, no de código.

---

## Tareas continuas

- [ ] Mantener `CHANGELOG.md` con secciones por bloque.
- [ ] `ARCHITECTURE.md` requiere actualización cuando se merge la rama (nuevos comandos Rust `read_image_as_data_url`, `save_export_dialog`, dependencia `base64`, schema config v4, allowlist DOMPurify ampliado a `img/src/alt`).
- [ ] `npm audit` / `cargo audit` post-merge.
- [ ] Bundle JS supera 500 KB minified — considerar `manualChunks` para CodeMirror/markdown-it/highlight.js si crece más.
- [ ] Verificar `cargo test` en CI macOS/Windows (los nuevos tests de `image_mime_for_path`, `ensure_extension`, `read_image_as_data_url`).

---

## Sugerencia de orden para retomar

1. **D.1 Autoguardado** (1-2 h, aislado, alto valor).
2. **D.2 Recuperación de sesión** (3-4 h, sinergias con D.1, debe ir antes de E.1).
3. **D.3 Plantillas** (2-3 h, aislado).
4. **E.1 Pestañas** (1-2 días — refactor del store; rehacer D.2 para persistir todas las tabs).
5. **E.2 Preferencias** (medio día, tras E.1 para incluir override de atajos).
6. **E.3 Atajos configurables** (medio día, depende de E.2 para UI).

Antes de E.1, hacer merge de la rama `feature/v1.1-block-a` a `main` y crear `feature/v1.2-tabs` para aislar el refactor.
