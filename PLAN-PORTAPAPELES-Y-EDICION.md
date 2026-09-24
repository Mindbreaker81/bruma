# Plan de implementación — Portapapeles, menú Editar y mejoras de edición

**Estado:** propuesta lista para implementar.
**Destinatario:** el agente/persona que implemente los cambios.
**Rama base sugerida:** derivar de `main` tras mergear este documento.
**Versión de referencia del repo:** Bruma 1.8.0 (`package.json`), Tauri 2.10.3, wry 0.54.4, muda 0.17.2 (`src-tauri/Cargo.lock`).

---

## 0. Cómo usar este documento

Cada fase (`F1`…`F9`) es autocontenida: indica **archivos exactos**, **qué cambiar**, **criterios de aceptación** y **tests**. Se pueden entregar en commits separados, pero **F1 y F2 deben ir en el mismo commit** (ver riesgo `R1`, es una regresión garantizada si se separan).

Orden obligatorio: `F1+F2` → `F3` → resto. `F9` es opcional/backlog.

Convención de commits del repo: `commitlint` con `config-conventional` (`feat:`, `fix:`, `test:`, `docs:`…). Hay hook de `husky` + `lint-staged`.

Comandos de validación (los mismos que ejecuta `.github/workflows/ci.yml`):

```bash
pnpm lint
pnpm format:check
pnpm test
pnpm test:e2e            # requiere: pnpm exec playwright install chromium
pnpm build
cargo test --manifest-path src-tauri/Cargo.toml
cargo fmt --check --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
```

---

## 1. Diagnóstico

### 1.1 Causa raíz confirmada: el menú nativo sustituye al de Tauri y pierde el submenú Editar

Bruma construye su propio menú y lo instala con `app.set_menu(...)` en `src-tauri/src/menu.rs:83-87`. Ese menú **reemplaza por completo** al menú por defecto de Tauri.

El submenú «Editar» de Bruma contiene **un único ítem** (`src-tauri/src/menu.rs:202-203`):

```rust
let edit_find = MenuItem::with_id(app, "edit_find", &labels.find, true, Some("CmdOrCtrl+F"))?;
let edit_menu = Submenu::with_items(app, &labels.edit, true, &[&edit_find])?;
```

El menú por defecto de Tauri (`tauri-2.10.3/src/menu/menu.rs`, `Menu::default`) sí incluye:

```rust
&Submenu::with_items(app_handle, "Edit", true, &[
    &PredefinedMenuItem::undo(app_handle, None)?,
    &PredefinedMenuItem::redo(app_handle, None)?,
    &PredefinedMenuItem::separator(app_handle)?,
    &PredefinedMenuItem::cut(app_handle, None)?,
    &PredefinedMenuItem::copy(app_handle, None)?,
    &PredefinedMenuItem::paste(app_handle, None)?,
    &PredefinedMenuItem::select_all(app_handle, None)?,
])?,
```

**Por qué esto rompe los atajos en macOS.** En muda (`muda-0.17.2/src/platform_impl/macos/mod.rs:977-983`) los ítems predefinidos se materializan como `NSMenuItem` con los selectores estándar de AppKit:

```rust
PredefinedMenuItemType::Copy  => Some(sel!(copy:)),
PredefinedMenuItemType::Cut   => Some(sel!(cut:)),
PredefinedMenuItemType::Paste => Some(sel!(paste:)),
PredefinedMenuItemType::SelectAll => Some(sel!(selectAll:)),
```

En macOS, `⌘C`/`⌘V`/`⌘X`/`⌘A` se resuelven como _key equivalents_ del menú principal de la aplicación. Si no existe un ítem de menú con ese _key equivalent_, AppKit no dispara `copy:`/`paste:` sobre el primer respondedor y **la pulsación no llega a WKWebView como acción de edición**. Resultado: en la app de escritorio de macOS los atajos de portapapeles están muertos, exactamente como se reportó.

Esto también explica que `⌘Z` (deshacer) esté afectado: no hay ítem de menú, y además hay una segunda causa (ver `R2`).

### 1.2 Windows: qué está confirmado y qué falta reproducir

Lo confirmado por código:

- wry **no desactiva** ni los menús contextuales ni las teclas aceleradoras de WebView2. Los valores por defecto son `true` (`wry-0.54.4/src/lib.rs:1706-1707`), y `tauri` 2.10.3 / `tauri-runtime-wry` 2.10.1 no los tocan en ningún punto (búsqueda de `default_context_menus`, `browser_accelerator_keys` y `contextmenu` en ambos crates: **cero coincidencias**).
- En Windows, muda **no** usa selectores nativos: sintetiza pulsaciones con `SendInput` (`muda-0.17.2/src/platform_impl/windows/mod.rs:1197-1207` y `1262-1291`). Es decir, el ítem «Copiar» del menú _depende_ de que `Ctrl+C` funcione en el webview, no al revés.
- El frontend no cancela `Ctrl+C`/`Ctrl+V`: `src/hooks/useAppShortcuts.ts:46-67` sólo intercepta `+`, `=`, `-`, `_`, `0`, `Shift+M` y `Shift+H` cuando hay `Ctrl`/`Cmd`, y ningún componente registra un handler de `contextmenu` (búsqueda en `src/`: cero coincidencias).

**Conclusión honesta:** en Windows, `Ctrl+C`/`Ctrl+V` dentro de CodeMirror **deberían** funcionar hoy, y no hay ninguna causa identificada en el código que lo impida. Lo que sí falta en Windows —y es real— es la **UI**: no hay ítems de menú Editar, ni botones de barra, ni menú contextual propio. Es plausible que el reporte de Windows se refiera a la ausencia de opciones visibles, no a un fallo de teclado.

**Antes de implementar, ejecutar el protocolo de reproducción `D1` (sección 4.1) en Windows.** Si el teclado también falla allí, hay una segunda causa no identificada y debe investigarse con los pasos de `D1` antes de cerrar la fase. No inventar una causa: `F1`–`F5` mejoran Windows de todos modos, pero el diagnóstico debe quedar por escrito.

### 1.3 Linux (no reportado, pero afecta al diseño)

En GTK, los ítems predefinidos de portapapeles se implementan enviando la secuencia de teclas con **libxdo** (`muda-0.17.2/src/platform_impl/gtk/mod.rs:1163-1180`), con un `// TODO: wayland` explícito. La feature `linux-libxdo` de `tauri` NO está activada en esta build (verificado: `libxdo` no aparece en `Cargo.lock`), así que los ítems son no-ops incluso bajo X11.

Consecuencias que el plan debe respetar:

- Bajo **Wayland**, los `PredefinedMenuItem` de Cortar/Copiar/Pegar no harían nada (su camino es libxdo, solo X11). Resuelto en Linux con ítems propios que ejecutan `execute_editing_command` de WebKit — verificado funcionando bajo Wayland real (ver §4.2).
- En GTK **no existe** mapeo de `Undo`/`Redo` (cero coincidencias de `Undo`/`Redo` en el `platform_impl/gtk`). Otro motivo para no usar los ítems predefinidos de deshacer/rehacer.

### 1.4 Descartado con evidencia (no perder tiempo aquí)

| Hipótesis                                                               | Veredicto                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CSS `user-select: none` bloquea la selección                            | **Falso.** Las únicas apariciones de `select-none` están en `dropdown-menu.tsx`, `slider.tsx` y `select.tsx` (componentes de UI, no el editor ni la preview).                                                                                 |
| La CSP de `tauri.conf.json` bloquea el portapapeles                     | **Falso.** La CSP no gobierna las operaciones de portapapeles.                                                                                                                                                                                |
| Algún handler de la app hace `preventDefault()` sobre `Ctrl+C`/`Ctrl+V` | **Falso.** Ver 1.2.                                                                                                                                                                                                                           |
| Tauri desactiva el menú contextual del webview                          | **Falso.** Ver 1.2.                                                                                                                                                                                                                           |
| Falta un keymap de portapapeles en CodeMirror                           | **Irrelevante.** CodeMirror no vincula copiar/pegar por teclado: escucha los eventos DOM `copy`/`cut`/`paste` (`@codemirror/view@6.38.8`, `handlers.copy = handlers.cut` y `handlers.paste`). Quien debe entregar esos eventos es el webview. |

---

## 2. Decisiones de diseño ya tomadas

1. **Sin dependencias nuevas.** No se añade `tauri-plugin-clipboard-manager`. Se usan: ítems nativos del menú (`muda` vía Tauri), los handlers DOM de CodeMirror, `document.execCommand('copy'|'cut')` y `navigator.clipboard`.
   _Escape hatch documentado:_ si `V3` (sección 4.2) demuestra que `navigator.clipboard.readText()` no está disponible en alguna plataforma objetivo, se reevalúa el plugin en una propuesta aparte. No añadirlo por iniciativa propia dentro de este plan.
2. **Deshacer/Rehacer con ítems propios, no predefinidos.** Justificación en `R2`.
3. **Menú contextual propio en React**, no el del webview: el nativo no está traducido, no respeta el tema y es inconsistente entre plataformas (y en macOS depende del mismo sistema de respondedores que ya falla).
4. **Idioma del documento y de la UI:** todo texto nuevo pasa por i18n (`es`/`en`), sin cadenas hardcodeadas.

---

## 3. Fases

### F1 · Menú Editar nativo completo (Rust) — **bloqueante**

**Archivo:** `src-tauri/src/menu.rs`

**3.1.1 Ampliar `MenuLabels`** (`menu.rs:20-78`). Añadir campos y sus valores por defecto en español:

| Campo           | `Default` (es)       | Nota                                                                                          |
| --------------- | -------------------- | --------------------------------------------------------------------------------------------- |
| `undo`          | `"Deshacer"`         |                                                                                               |
| `redo`          | `"Rehacer"`          |                                                                                               |
| `cut`           | `"Cortar"`           |                                                                                               |
| `copy`          | `"Copiar"`           |                                                                                               |
| `paste`         | `"Pegar"`            |                                                                                               |
| `select_all`    | `"Seleccionar todo"` |                                                                                               |
| `replace`       | `"Reemplazar"`       | La función ya existe en la UI de búsqueda (`search.toggleReplace`), pero no estaba en el menú |
| `copy_as_html`  | `"Copiar como HTML"` | Ver `F7`                                                                                      |
| `copy_document` | `"Copiar documento"` | Ver `F7`                                                                                      |

`MenuLabels` es `#[serde(rename_all = "camelCase")]`, así que el frontend enviará `selectAll`, `copyAsHtml`, `copyDocument`. La estructura se replica en **tres** sitios que deben cambiarse a la vez:

1. `src-tauri/src/menu.rs:20-78` — el `struct MenuLabels` y su `impl Default` (los valores por defecto en español se usan al arrancar, antes de que el frontend envíe nada).
2. `src/features/files/ipc.ts:17-42` — el tipo TypeScript `MenuLabels`.
3. `src/App.tsx:842-867` — el objeto que se envía a `setMenuLabels`, con claves i18n planas del espacio `menu.*` (`menuT('menu.find')`, etc.).

`set_menu_labels` (`src-tauri/src/commands/app_menu.rs`) deserializa el payload completo: si Rust declara un campo que el frontend no envía, **la llamada falla y el menú deja de traducirse** (ver `R6`).

**3.1.2 Reconstruir el submenú Editar** sustituyendo `menu.rs:202-203` por:

```rust
let edit_undo = MenuItem::with_id(app, "edit_undo", &labels.undo, true, Some("CmdOrCtrl+Z"))?;
let edit_redo = MenuItem::with_id(
    app,
    "edit_redo",
    &labels.redo,
    true,
    // Windows/Linux usan Ctrl+Y en @codemirror/commands; macOS usa ⇧⌘Z.
    Some(if cfg!(target_os = "macos") { "CmdOrCtrl+Shift+Z" } else { "CmdOrCtrl+Y" }),
)?;
let edit_separator_history = PredefinedMenuItem::separator(app)?;
let edit_cut = PredefinedMenuItem::cut(app, Some(&labels.cut))?;
let edit_copy = PredefinedMenuItem::copy(app, Some(&labels.copy))?;
let edit_paste = PredefinedMenuItem::paste(app, Some(&labels.paste))?;
let edit_select_all = PredefinedMenuItem::select_all(app, Some(&labels.select_all))?;
let edit_separator_clipboard = PredefinedMenuItem::separator(app)?;
let edit_copy_document = MenuItem::with_id(app, "edit_copy_document", &labels.copy_document, true, None::<&str>)?;
let edit_copy_as_html = MenuItem::with_id(app, "edit_copy_as_html", &labels.copy_as_html, true, None::<&str>)?;
let edit_separator_find = PredefinedMenuItem::separator(app)?;
let edit_find = MenuItem::with_id(app, "edit_find", &labels.find, true, Some("CmdOrCtrl+F"))?;
let edit_replace = MenuItem::with_id(app, "edit_replace", &labels.replace, true, Some("CmdOrCtrl+Shift+F"))?;

let edit_menu = Submenu::with_items(
    app,
    &labels.edit,
    true,
    &[
        &edit_undo,
        &edit_redo,
        &edit_separator_history,
        &edit_cut,
        &edit_copy,
        &edit_paste,
        &edit_select_all,
        &edit_separator_clipboard,
        &edit_copy_document,
        &edit_copy_as_html,
        &edit_separator_find,
        &edit_find,
        &edit_replace,
    ],
)?;
```

Notas de implementación:

- Los ítems predefinidos **ya traen su acelerador por defecto** (`CmdOrCtrl+X/C/V/A`); no hay que pasarlo. El argumento `Some(&labels.x)` sólo cambia el texto visible, que es lo que necesitamos para i18n.
- **No** usar `PredefinedMenuItem::undo/redo`. Ver `R2`.
- Verificar que `Some(&labels.cut)` compila con el tipo esperado (`Option<&str>`); si el tipo genérico se queja, usar `Some(labels.cut.as_str())`.
- `CmdOrCtrl+Shift+F` para reemplazar: comprobar que no colisiona con nada existente (hoy no hay `Shift+F` registrado).

**3.1.3 Tests Rust.** Ampliar el módulo `#[cfg(test)]` de `menu.rs` (que hoy cubre labels y recientes) con un test de regresión que evite que alguien vuelva a borrar los ítems. Como `Menu` requiere runtime, el test practicable es sobre los datos: añadir una constante con los IDs esperados del submenú Editar y comprobarla, o extraer la lista de IDs a una función pura `edit_menu_item_ids() -> &'static [&'static str]` que `build_menu` consuma y el test verifique. **Preferir la función pura**, que sí es testeable sin runtime.

**Aceptación F1**

- `cargo test`, `cargo clippy -D warnings` y `cargo fmt --check` pasan.
- En macOS: el menú «Editar» muestra Deshacer/Rehacer/Cortar/Copiar/Pegar/Seleccionar todo con sus aceleradores, y `⌘C`/`⌘V`/`⌘X`/`⌘A` funcionan dentro del editor **y** al seleccionar texto en la vista previa.
- Los ítems aparecen traducidos al cambiar de idioma (Idioma ▸ English) sin reiniciar.

---

### F2 · Puente de acciones de edición en el frontend — **mismo commit que F1**

**Archivos:** `src/hooks/useTauriMenuBridge.ts`, `src/App.tsx`, nuevo `src/features/editor/editActions.ts`.

Al añadir `edit_undo`/`edit_redo` con aceleradores, el menú nativo **captura `Ctrl/⌘+Z` antes que el webview** en las tres plataformas. Si no se implementa el handler, se rompe el deshacer que hoy funciona en Windows y Linux. De ahí la obligación de entregarlo junto a `F1`.

**3.2.1 Nuevo `src/features/editor/editActions.ts`:**

```ts
import { redo, undo } from '@codemirror/commands';
import { selectAll } from '@codemirror/commands';
import type { EditorView } from '@codemirror/view';

/** ¿El foco está dentro del contenido de CodeMirror? */
export function isEditorFocused(): boolean {
  const active = document.activeElement;
  return (
    active instanceof HTMLElement && Boolean(active.closest('.cm-content'))
  );
}

/** ¿El foco está en un input/textarea nativo (búsqueda, diálogos…)? */
export function isNativeInputFocused(): boolean {
  const active = document.activeElement;
  return (
    active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement
  );
}
```

Las funciones que operan sobre la vista (`undo`, `redo`, `selectAll`) reciben el `EditorView`. Como `MarkdownEditor` no expone el `EditorView` crudo, **ampliar `MarkdownEditorHandle`** (`src/features/editor/MarkdownEditor.tsx:66-79`) con los métodos necesarios, manteniendo el patrón actual de no filtrar la instancia:

```ts
export type MarkdownEditorHandle = {
  // …existentes…
  undo: () => boolean;
  redo: () => boolean;
  selectAll: () => void;
  cut: () => void; // ver F3
  copy: () => void; // ver F3
  paste: (text: string) => void; // ver F3
  getSelectedText: () => string;
  hasSelection: () => boolean;
};
```

Implementarlos en el `useImperativeHandle` (`MarkdownEditor.tsx:155-194`) delegando en `editorRef.current`.

**3.2.2 Enrutado en `useTauriMenuBridge.ts`.** Añadir al tipo `MenuHandlers` (líneas 5-18) y al `if`-chain (líneas 42-92):

```ts
if (action === 'edit_undo') h.handleUndo();
if (action === 'edit_redo') h.handleRedo();
if (action === 'edit_replace') h.handleOpenReplace();
if (action === 'edit_copy_document') void h.handleCopyDocument();
if (action === 'edit_copy_as_html') void h.handleCopyAsHtml();
```

Cortar, Copiar, Pegar y Seleccionar todo **no** aparecen aquí a propósito: son `PredefinedMenuItem`, los resuelve el sistema y no emiten `menu://action`. El `selectAll` del handle de `MarkdownEditor` (3.2.1) lo usan la barra y el menú contextual (`F4`, `F5`), no el puente.

**3.2.3 Reglas de enrutado de `handleUndo`/`handleRedo`** (implementar en `App.tsx`, junto al resto de handlers que ya se registran en `handlersRef`, cerca de `src/App.tsx:942-951`):

```
si isEditorFocused()        → editorRef.current?.undo()
si no, si isNativeInputFocused() → document.execCommand('undo')
si no                        → no-op
```

Esto preserva el comportamiento de deshacer al escribir en el campo de búsqueda.

**Aceptación F2**

- macOS/Windows/Linux: `⌘/Ctrl+Z` y `⌘⇧Z` / `Ctrl+Y` deshacen y rehacen en el editor.
- Escribir en el campo de búsqueda y pulsar `Ctrl+Z` deshace **en el campo**, no en el documento.
- Editar ▸ Reemplazar abre el panel de búsqueda con reemplazo visible.

---

### F3 · Helpers de portapapeles sin dependencias

**Archivo nuevo:** `src/lib/clipboard.ts`. **Test nuevo:** `src/lib/clipboard.test.ts`.

Base técnica (verificada en `@codemirror/view@6.38.8`): CodeMirror registra handlers para los eventos DOM `copy`, `cut` y `paste`. Por tanto:

- **Copiar/Cortar** desde un botón: `document.execCommand('copy' | 'cut')` con el foco en `.cm-content` dispara el evento DOM y CodeMirror hace el resto (incluida su copia por líneas cuando no hay selección). No hace falta reimplementar nada.
- **Pegar** desde un botón: `document.execCommand('paste')` está bloqueado en los webviews modernos. Hay que leer con `navigator.clipboard.readText()` y despachar una transacción de CodeMirror.

API propuesta:

```ts
export function canReadClipboard(): boolean; // typeof navigator.clipboard?.readText === 'function'
export function canWriteClipboard(): boolean; // idem con writeText
export async function readClipboardText(): Promise<string | null>;
export async function writeClipboardText(text: string): Promise<boolean>;
export async function writeClipboardHtml(
  html: string,
  plainText: string
): Promise<boolean>;
```

Requisitos de implementación:

- `readClipboardText` devuelve `null` (no lanza) si la API no existe o rechaza por permisos. Todos los llamadores deben tolerar `null` y mostrar un toast de error (`sonner` ya está integrado; ver `src/components/ui/sonner.tsx`).
- `writeClipboardHtml` intenta `navigator.clipboard.write(new ClipboardItem({'text/html': …, 'text/plain': …}))` y, si `ClipboardItem` no existe o falla, cae a `writeClipboardText(plainText)` devolviendo `true` igualmente (degradación, no error).
- **Nunca** llamar a estas funciones fuera de un gesto de usuario (click/atajo): WebKit exige gesto para leer el portapapeles.

**Pegado en el editor** — añadir a `src/features/editor/format.ts`:

```ts
export function pasteText(view: EditorView, text: string): void {
  const { from, to } = view.state.selection.main;
  view.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from + text.length },
    userEvent: 'input.paste',
  });
  view.focus();
}
```

`userEvent: 'input.paste'` importa: el autosave y el historial de CodeMirror clasifican los cambios por `userEvent`. No reutilizar `insertSnippet` (no lo anota).

**Tests unitarios (`vitest`, entorno `happy-dom`, ver `vitest.config.ts`)**

- `readClipboardText` devuelve `null` cuando `navigator.clipboard` no existe.
- `readClipboardText` devuelve `null` cuando `readText` rechaza.
- `writeClipboardHtml` cae a `writeText` cuando `ClipboardItem` no está definido.
- `pasteText` reemplaza la selección y deja el cursor al final (test contra un `EditorState`, siguiendo el estilo de `src/features/editor/format.test.ts`).

---

### F4 · Botones de portapapeles en la barra de formato

**Archivos:** `src/features/shell/toolbar/FormatToolbar.tsx`, `src/features/editor/formatCommands.ts` (o un módulo nuevo; ver nota), i18n.

Ésta es la petición literal del reporte: **opciones visibles** de cortar/copiar/pegar.

- Añadir un grupo nuevo al principio de la barra (antes de los grupos de formato) con tres `IconButton` usando `lucide-react`: `Scissors` (cortar), `Copy` (copiar), `ClipboardPaste` (pegar). `IconButton` ya aporta tooltip + `sr-only` (`src/components/ui/icon-button.tsx`).
- **No** meter estos comandos en `FORMAT_COMMANDS` (`formatCommands.ts`): ese array alimenta `formatKeymap` en `MarkdownEditor.tsx:41-47` y el resaltado de formato activo. Mezclarlos rompería ambos. Crear `CLIPBOARD_COMMANDS` en un módulo aparte, o declarar los tres botones directamente en `FormatToolbar` y separarlos con el `Separator` que ya usa.
- Etiquetas con atajo visible mediante `withShortcutLabel(...)` + `getShortcutById('edit.copy')` (ver `F6`), igual que hace `ToolbarWrite.tsx:21-24`.
- **Estado deshabilitado:** Cortar y Copiar deshabilitados cuando no hay selección **ni** línea bajo el cursor (en la práctica: cuando el editor está vacío). Pegar deshabilitado si `canReadClipboard()` es `false`; en ese caso el tooltip debe decir que se use el menú Editar (nueva clave i18n `clipboard.unavailable`).
- Los botones deben devolver el foco al editor al terminar (`editorRef.current?.focus()`), o las acciones siguientes fallan.

**Aceptación F4**

- Los tres botones son visibles en modo editor y dividido, con tooltip traducido.
- Copiar con selección deja el texto en el portapapeles del sistema (verificación manual `V1`).
- Pegar inserta el contenido reemplazando la selección.

---

### F5 · Menú contextual propio (editor y vista previa)

**Archivos:** nuevo `src/features/editor/EditorContextMenu.tsx`, integración en `src/App.tsx` (editor, `App.tsx:1171-1172`) y `src/features/preview/Preview.tsx`.

Motivo: el menú contextual del webview no está traducido, no respeta el tema de Bruma y varía por plataforma.

- Implementar con los primitivos ya presentes (`@radix-ui/react-dropdown-menu`, envuelto en `src/components/ui/dropdown-menu.tsx`) usando un trigger posicionado en las coordenadas del evento, o con un componente propio ligero. Si se opta por Radix, controlar `open` y posicionar con un elemento ancla de 0×0 en `clientX/clientY`.
- Handler: `onContextMenu` con `event.preventDefault()` **sólo dentro del editor y de la preview**, nunca a nivel de `document` (no romper el menú nativo en campos de texto de los diálogos).
- **Editor:** Cortar · Copiar · Pegar · Seleccionar todo · (separador) · Negrita · Cursiva · Enlace · (separador) · Copiar como HTML.
- **Vista previa** (contenido de sólo lectura, `Preview.tsx:96-104`): Copiar selección · Copiar todo el documento · Copiar HTML renderizado. Ojo: el `onClick` existente de la preview intercepta enlaces; el menú contextual no debe interferir con ese handler.
- Accesibilidad: navegable con teclado, `Escape` cierra, `role="menu"` (Radix ya lo aporta).

**Aceptación F5**

- Clic derecho en el editor abre el menú de Bruma (traducido, con el tema activo), no el del sistema.
- Clic derecho en un `input` de un diálogo sigue mostrando el menú nativo.

---

### F6 · Catálogo de atajos, diálogo de ayuda e i18n

**Archivos:** `src/lib/shortcutsCatalog.ts`, `src/lib/shortcutsCatalog.test.ts`, `src/i18n/locales/es.json`, `src/i18n/locales/en.json`.

El catálogo declara explícitamente que «refleja los aceleradores nativos de `src-tauri/src/menu.rs`» y hoy **no lista ningún atajo de portapapeles**, lo que contribuye a la sensación de que no existen. Añadir al grupo `edit` (`shortcutsCatalog.ts:64-88`), por delante de `edit.find`:

| `id`             | `labelKey`                       | `shortcut`    |
| ---------------- | -------------------------------- | ------------- |
| `edit.undo`      | `shortcuts.action.editUndo`      | `Mod-Z`       |
| `edit.redo`      | `shortcuts.action.editRedo`      | `Mod-Shift-Z` |
| `edit.cut`       | `shortcuts.action.editCut`       | `Mod-X`       |
| `edit.copy`      | `shortcuts.action.editCopy`      | `Mod-C`       |
| `edit.paste`     | `shortcuts.action.editPaste`     | `Mod-V`       |
| `edit.selectAll` | `shortcuts.action.editSelectAll` | `Mod-A`       |
| `edit.replace`   | `shortcuts.action.editReplace`   | `Mod-Shift-F` |

`formatShortcut` (`src/lib/formatShortcut.ts`) ya traduce `Mod-`/`Shift-` a `⌘`/`⇧` en Apple. **Atención al caso de Rehacer:** el acelerador real difiere por plataforma (`⇧⌘Z` en macOS, `Ctrl+Y` en Windows/Linux). Extender `ShortcutItem` con un campo opcional `shortcutWindows?: string` y que `formatShortcut` elija según `isApplePlatform()`, o el diálogo mostrará un atajo falso en Windows. **No mostrar un atajo que no funciona.**

`ShortcutsDialog` no necesita cambios: itera el catálogo.

**Test:** `shortcutsCatalog.test.ts` debe comprobar que existen los siete IDs nuevos y que no hay `shortcut` duplicado dentro del mismo grupo.

---

### F7 · Acciones de copia de alto nivel

**Archivos:** `src/lib/export.ts` (reutilizar), `src/App.tsx`, menú Editar (`F1`), menú contextual (`F5`).

1. **Copiar documento** (`edit_copy_document`): copia el Markdown completo del documento activo. Una línea sobre `writeClipboardText`.
2. **Copiar como HTML** (`edit_copy_as_html`): renderiza con `renderSafeMarkdown` (`src/lib/markdown.ts`, ya sanea con DOMPurify) y llama a `writeClipboardHtml(html, markdown)`. Así, al pegar en un editor enriquecido (correo, Word, Notion) llega con formato, y en un editor de texto llega el Markdown.
   - **No** reutilizar `buildExportHtml` aquí: incluye `<!doctype>`, `<head>` y los estilos embebidos, que no deben ir al portapapeles. Usar sólo el cuerpo renderizado.
3. **Botón de copiar en los bloques de código de la vista previa:** al renderizar, inyectar un botón sobre cada `<pre>`. Implementarlo en `Preview.tsx` con delegación de eventos sobre el contenedor (no con `dangerouslySetInnerHTML` de botones: el HTML pasa por DOMPurify y el handler se perdería). Es decir: tras cada render, recorrer `containerRef.current.querySelectorAll('pre')` y añadir el botón desde React/DOM, limpiándolo en el efecto siguiente.

Toast de confirmación (`sonner`) en las tres acciones: clave `clipboard.copied`.

---

### F8 · Tests

**Unitarios (`vitest`)**

- `src/lib/clipboard.test.ts` — ver `F3`.
- `src/features/editor/format.test.ts` — añadir casos de `pasteText`.
- `src/lib/shortcutsCatalog.test.ts` — ver `F6`.
- `src/features/editor/MarkdownEditor.test.tsx` — cubrir los métodos nuevos del handle (`undo`, `redo`, `selectAll`, `hasSelection`).

**Rust (`cargo test`)**

- `src-tauri/src/menu.rs` — test de regresión sobre los IDs del submenú Editar (`F1.3`).

**E2E (`playwright`, se ejecuta contra el build web, no Tauri)**

Nuevo `tests/clipboard.spec.ts`, siguiendo el estilo de `tests/format-toolbar.spec.ts`:

- Los tres botones de portapapeles están presentes y accesibles por rol/nombre.
- Copiar con selección: conceder permisos con `context.grantPermissions(['clipboard-read', 'clipboard-write'])` y verificar con `navigator.clipboard.readText()`.
- Pegar: escribir en el portapapeles con `page.evaluate` y comprobar que el contenido del editor cambia.
- Menú contextual: clic derecho sobre el editor muestra el menú de la app.

**Limitación que debe quedar escrita en el PR:** los E2E corren en Chromium (`playwright.config.ts`), **no** validan el menú nativo de macOS/Windows/Linux. La comprobación de `F1` es manual y obligatoria (sección 4).

---

### F9 · Pegar imagen del portapapeles — implementado

Decisión tomada (opción A de BRU-10): guardar la imagen **junto al
documento** con nombre `imagen-<timestamp>.<ext>` e insertar
`![](imagen-…)` en el cursor.

Implementación:

- `src-tauri/src/commands/fs.rs`: comando `save_pasted_image` — valida la
  extensión contra la lista blanca de imágenes, limita el binario a 25 MB,
  resuelve el destino con `resolve_allowed_write_path` (misma protección
  anti _path traversal_ del resto de comandos) y devuelve el nombre de
  archivo generado.
- `src/features/editor/MarkdownEditor.tsx`: prop `onPasteImage`; el
  `onPaste` del contenedor detecta `clipboardData.files` con tipo
  `image/*`, hace `preventDefault` y delega en la app.
- `src/App.tsx`: `handlePasteImage` exige documento guardado (sin
  `document.path` avisa con un toast), codifica el `File` en base64 e
  inserta la sintaxis de imagen al guardar.
- `src/lib/images.ts`: helpers `imageExtensionForFile` (mime → extensión)
  y `fileToBase64`.

Limitación conocida en Flatpak: el portal de documentos concede acceso
**por archivo**, así que escribir un archivo hermano junto al documento
falla dentro del sandbox salvo `--filesystem=home` o que el usuario abra
la carpeta completa. El error se muestra como toast; el pegado por texto
sigue funcionando.

Verificación:

- Tests Rust (`fs.rs`): guardado junto al documento, rechazo de extensión
  no permitida y rechazo de ruta fuera del scope permitido.
- Tests unitarios (`src/lib/images.test.ts`): mapeo mime → extensión,
  _fallback_ por nombre de archivo y codificación base64.
- Tests E2E (`tests/image-paste.spec.ts`): con `__TAURI_INTERNALS__`
  simulado, un pegado con `image/*` en documento sin guardar muestra el
  aviso localizado, y en documento guardado inserta `![](imagen-…)` tras
  `save_pasted_image`.
- Validación manual en Windows 11 real (build release 1.8.0,
  `edmundo@192.168.1.92`): ambos caminos verificados con una imagen PNG
  real depositada en el portapapeles del sistema (`Clipboard.SetImage`):
  - Documento **sin guardar** → toast «Guarda el documento antes de
    pegar imágenes del portapapeles.» y no se inserta nada.
  - Documento **guardado** (`f9doc.md`) → el evento `paste` expone
    `files: [image/png]`, se crea `imagen-<timestamp>.png` junto al
    documento, se inserta `![](imagen-…)` en el cursor y el
    autoguardado persiste el documento en disco.
    En macOS la automatización remota por AX no pudo conducir los paneles
    de archivo ni el webview del build de desarrollo; no es un fallo de la
    app — la misma cadena quedó cubierta por los tests y por Windows.

---

## 4. Verificación

### 4.1 `D1` — protocolo de reproducción en Windows (ejecutar **antes** de dar por cerrado el diagnóstico)

En un build de escritorio (`pnpm tauri build --bundles nsis` o `pnpm tauri dev`), con un documento abierto:

1. Seleccionar texto en el editor → `Ctrl+C` → pegar en el Bloc de notas. ¿Llega el texto?
2. Copiar texto desde el Bloc de notas → foco en el editor → `Ctrl+V`. ¿Se inserta?
3. Clic derecho sobre el editor. ¿Aparece el menú de WebView2 con Cortar/Copiar/Pegar?
4. `Ctrl+A`, `Ctrl+Z`, `Ctrl+Y`. ¿Funcionan?
5. Abrir DevTools (`pnpm tauri dev`) y, con el editor enfocado, ejecutar:
   `document.querySelector('.cm-content').addEventListener('copy', e => console.log('copy', e), true)` y repetir el paso 1.

Registrar los resultados en el PR. Si 1-4 funcionan, el problema en Windows era **de UI**, y `F1`/`F4`/`F5` lo resuelven. Si alguno falla, **detenerse y reportarlo**: hay una causa no identificada y este plan no la cubre.

### 4.2 Matriz de verificación manual (tras implementar)

| ID   | Comprobación                                               | macOS | Windows | Linux X11  | Linux Wayland |
| ---- | ---------------------------------------------------------- | ----- | ------- | ---------- | ------------- |
| `V1` | `⌘/Ctrl+C` y `+V` en el editor                             | ✅    | ✅      | ✅         | ☐             |
| `V2` | Menú Editar ▸ Copiar/Pegar con el editor enfocado          | ✅    | ✅      | ✅         | ✅            |
| `V3` | Botón Pegar de la barra (`navigator.clipboard.readText`)   | ✅    | ✅      | ⚠ ver nota | ☐             |
| `V4` | `⌘/Ctrl+Z` y rehacer, dentro del editor                    | ✅    | ✅      | ✅         | ☐             |
| `V5` | `Ctrl+Z` en el campo de búsqueda deshace **ahí**           | ✅    | ✅      | ✅         | ☐             |
| `V6` | Copiar desde la vista previa (selección de texto)          | ✅    | ✅      | ✅         | ☐             |
| `V7` | Menú contextual propio en editor y preview                 | ✅    | ✅      | ✅         | ☐             |
| `V8` | Etiquetas del menú nativo cambian al conmutar idioma       | ✅    | ✅      | ✅         | ☐             |
| `V9` | Copiar como HTML pega con formato en un editor enriquecido | ✅    | ✅      | ✅         | ☐             |

Resultados de la columna **Linux X11** obtenidos con el harness
`tests-tauri/v-matrix-linux.sh` (Xvfb + AT-SPI + `xdotool`/`xclip`, portapapeles
X11 real, sin window manager):

- `V2`: era un defecto real, no de foco — los `PredefinedMenuItem` de
  portapapeles en GTK son no-ops sobre el WebKitWebView (su camino es libxdo,
  ausente en esta build). Resuelto: en Linux son ítems propios que en
  `handle_event` ejecutan `execute_editing_command` del WebKit (`Cut`/`Copy`/
  `Paste`/`SelectAll`), el mismo camino del teclado, que funciona en X11 y
  Wayland. Verificado en sesión X11 real (Xorg + Openbox): activando
  «Editar ▸ Copiar» por AT-SPI el texto seleccionado llegó a `xclip`, y
  «Editar ▸ Pegar» insertó el texto del portapapeles en el editor.
- `V3`: el botón Pegar no apareció en el árbol de accesibilidad — coherente con
  `R4` (`canReadClipboard()` devuelve false en este entorno headless y el botón
  se autodeshabilita). Verificar en sesión real antes de decidir el escape
  hatch.
- `V6`: verificado en sesión X11 real — con texto seleccionado en la preview,
  «Editar ▸ Copiar» (comando `Copy` de WebKit) escribió la selección en el
  portapapeles X11 (`xclip`).

Resultados de la columna **Linux Wayland** obtenidos en sesión Wayland real
(`cage` headless sobre wlroots en el Mac Mini remoto, portapapeles verificado
con `wl-copy`/`wl-paste`, menú activado vía AT-SPI):

- `V2`: ✅ — el mismo camino `execute_editing_command` funciona bajo Wayland.
  «Editar ▸ Copiar» escribió la selección en el portapapeles Wayland real
  (ofertas `text/plain`, `text/html` y `org.webkitgtk.WebKit.
custom-pasteboard-data`, leídas con `wl-paste`), y «Editar ▸ Pegar» insertó
  el texto que `wl-copy` había depositado. «Seleccionar todo» también activa
  vía AT-SPI (selecciona el documento webview completo, semántica nativa de
  WebKit).
- Limitaciones del entorno headless (no de la app): wl-clipboard exige un seat
  con teclado — se resolvió creando uno virtual (`wtype`, protocolo
  `virtual-keyboard-v1`); las teclas sintéticas no llegan a la ventana en cage
  sin dispositivos físicos, así que V1/D1 por teclado real quedan para una
  sesión Wayland con hardware. La nota de la §1.3 («el menú no es el camino
  fiable en Wayland») queda obsoleta: era cierta para los `PredefinedMenuItem`
  de libxdo, pero los ítems propios usan el camino nativo de WebKit.

Resultados de la columna **macOS** obtenidos en sesión real (macOS ARM64,
bundle `.app` release, portapapeles del sistema verificado con el pasteboard
nativo y conducción de la app por el árbol de accesibilidad):

- `V1`: `⌘C`, `⌘V`, `⌘X` y `⌘A` funcionan en el editor con el portapapeles real
  en ambas direcciones.
- `V2`: verificado invocando los ítems del menú nativo vía accesibilidad
  (`menu item` de System Events): «Pegar» insertó el contenido del
  pasteboard en el editor enfocado, «Seleccionar todo» + «Copiar» escribieron
  el documento en el pasteboard, y los ítems propios «Undo»/«Redo» deshicieron
  y rehicieron a través de la ruta `menu://action` → CodeMirror.
- `V3`: el botón Pegar insertó el texto del portapapeles con un clic real —
  `navigator.clipboard.readText()` funciona en WKWebView con gesto de usuario.
  **No hace falta el escape hatch `R4` en macOS.**
- `V4`/`V5`: `⌘Z`/`⇧⌘Z` deshacen y rehacen en el editor; `⌘Z` en el campo de
  búsqueda deshace ahí sin tocar el documento.
- `V6`: la selección de texto en la vista previa copia al portapapeles con
  `⌘C` (verificado en el pasteboard con texto plano, RTF y HTML).
- `V7`: el menú contextual del editor funciona (Cortar/Copiar/Pegar/Seleccionar
  todo/formato/Copiar como HTML). El de la vista previa perdía la selección al
  abrirse en WKWebView («Copiar selección» copiaba vacío); corregido
  capturando la selección en `onContextMenu` (`Preview.tsx`), con test de
  regresión E2E, y re-verificado en la `.app` real: `AXShowMenu` sobre el
  texto abre el menú y «Copiar selección» escribe la palabra seleccionada en
  el pasteboard. Se encontró además una fuga de edición al desmontar el editor
  dentro del `debounce` de `onChange` (también corregida).
- `V8`: el menú nativo re-etiqueta en caliente al conmutar idioma — verificado
  directamente en la barra de menús vía accesibilidad: los menús
  `Archivo/Editar/Ver/Idioma/Ayuda` pasan a `File/Edit/View/Language/Help` y
  los ítems `Deshacer/Rehacer/…` a `Undo/Redo/…` tras activar «Idioma ▸
  Inglés».
- `V9`: «Copiar como HTML» escribe `text/html` con el marcado renderizado
  (verificado en el pasteboard) además del texto plano.

Re-verificación de la columna **macOS** sobre la `.app` release compilada
desde la rama actual (M2 Max, `edmundorosalesmayor@192.168.1.91`, conducción
por System Events con Accesibilidad y pasteboard real con `pbcopy`/`pbpaste`):

- `V1`: `⌘A`/`⌘C` copiaron el contenido del editor al pasteboard y `⌘V`
  insertó un centinela depositado con `pbcopy` (33→50 caracteres).
- `V2`: «Editar ▸ Copiar» escribió la selección al pasteboard y «Editar ▸
  Pegar» insertó el centinela del pasteboard reemplazando la selección.
- `V3`: el botón «Pegar» de la toolbar insertó el centinela del pasteboard —
  `navigator.clipboard.readText()` funciona en WKWebView.
- `V4`: «Editar ▸ Deshacer/Rehacer» revirtió y reaplicó el pegado (50→33→50).
- `V5`: «Editar ▸ Deshacer» vació el campo de búsqueda sin tocar el documento.
- `V6`: en modo Vista previa, `⌘A`/`⌘C` copiaron el contenido renderizado.
- `V7`: clic derecho real (CGEvent) en el editor abrió el menú contextual
  propio (`Cortar/Copiar/Pegar/Seleccionar todo/formato/Copiar como HTML`).
- `V8`: al elegir «Language ▸ Spanish» la barra pasó a
  `Archivo/Editar/Ver/Idioma/Ayuda` con los ítems localizados en caliente.
- `V9`: «Copiar como HTML» escribió el flavor `«class HTML»` (662 bytes de
  marcado renderizado) junto al texto plano.

Resultados de la columna **Windows** obtenidos en Windows 11 real
(`edmundo@192.168.1.92`, build 26200, WebView2 runtime 153.0.4234.48 +
`msedgedriver` emparejado, `tauri-driver` 2.0.6). Dos caminos de evidencia:
el harness E2E nativo (`pnpm test:e2e:tauri`, **10 passing** sobre
`bruma.exe` debug en la sesión interactiva de consola) y conducción del menú
nativo Win32 vía `WM_COMMAND` + verificación del portapapeles real con
PowerShell y del DOM vía DevTools:

- `V1`/`D1`: cubierto por el harness (Ctrl+C/V/Z/Y reales por WebDriver,
  portapapeles del sistema verificado en ambos sentidos). D1-1…D1-5 ✅.
- `V2`/`D1-3`: verificado de forma nativa — «Editar ▸ Pegar» (ídem.
  `Paste` predefinido de muda → `SendInput(Ctrl+V)`) insertó un centinela
  depositado con `Set-Clipboard` en el editor enfocado, y «Seleccionar
  todo» + «Copiar» escribieron el contenido del documento en el
  portapapeles real (canary previo descartado). Confirma además `R3`: un
  solo «Pegar» pega una sola vez.
- `V3`: el botón «Pegar» de la toolbar inserta el texto del portapapeles.
  Primera llamada muestra el infobar de permiso de WebView2 («quiere ver el
  Portapapeles / Bloquear / Permitir») — el harness lo acepta
  (`fluent-button#allow-button`) y el permiso persiste en el perfil.
  **`navigator.clipboard.readText()` funciona en WebView2 — no hace falta el
  escape hatch `R4` en Windows.**
- `V4`/`V5`: cubiertos por el harness (Ctrl+Z/Y reales; undo en el campo de
  búsqueda vacía el campo — granularidad por carácter de Chromium en inputs
  controlados, ajustado el spec).
- `V6`: en Vista previa, «Seleccionar todo» + «Copiar» del menú escribieron
  el contenido renderizado en el portapapeles real.
- `V7`: el harness abre el menú contextual propio con `contextClick` real
  (el check de cierre usa `data-state` — `isDisplayed()` de Selenium no es
  fiable sobre el portal Radix).
- `V8`: «Language ▸ Spanish» re-etiquetó la barra Win32 en caliente
  (`Archivo/Editar/Ver/Idioma/Ayuda`, ítems localizados) y el inverso a
  inglés también — verificado enumerando el `HMENU` real.
- `V9`: el harness verifica que «Copiar como HTML» deja formato HTML en el
  portapapeles del sistema.
- `F9` (ambos caminos, ver sección F9): el camino negativo mostró el toast
  correcto sin insertar, y el positivo —ya sobre el **build release**—
  creó `imagen-<timestamp>.png` junto al documento e insertó la referencia
  Markdown.

Re-verificación sobre el **build release** de Windows (`bruma.exe` 1.8.0,
`src-tauri/target/release`, conducido por `WM_COMMAND` + DevTools
`--remote-debugging-port`):

- Arranque en frío hasta ventana: ~142 ms.
- Tamaños: `bruma.exe` 13,6 MB · MSI `Bruma_1.8.0_x64_en-US.msi` 5,1 MB ·
  NSIS `Bruma_1.8.0_x64-setup.exe` 3,7 MB (todos < 30 MB).
- Abrir documento por el diálogo nativo «Abrir» (`f9doc.md`): OK; el menú
  «Abrir recientes» lo lista como `f9doc.md — C:\Users\Edmundo` (sin
  prefijo `\\?\`).
- Editar → autoguardado: texto insertado en el editor persiste a disco y
  la barra de estado pasa a «Guardado». El flujo edición → dirty →
  autoguardado → `save_file` funciona en release.
- «Editar ▸ Pegar» con imagen PNG real: crea `imagen-1790244615344.png`
  junto al documento e inserta `![](imagen-…)` (camino positivo de F9).
- «Editar ▸ Copiar como HTML» escribe el flavor `HTML Format` real en el
  portapapeles (marcado renderizado + `text/plain`).
- «Buscar» abre el panel y acepta entrada; «Preferencias» abre el diálogo
  (Autoguardado/Tema); la protección de cambios sin guardar muestra el
  diálogo «Cancelar/Descartar» al hacer «Nuevo» con el doc dirty.
- Nota de automatización: los IDs de menú Win32 cambian al reconstruirse
  el menú (recientes/idioma) y un modal de «Recuperar sesión» bloquea el
  input real — ambos fueron artefactos del scripting, no defectos de la
  app.

Notas de entorno Windows (no de la app): los tests nativos deben ejecutarse
en la sesión de consola interactiva — en la sesión 0 (SSH) el WebView2 no
inicializa su UI. La sesión se auto-bloqueó durante la validación
(`Mystify.scr`/`LockApp`); con el escritorio bloqueado `OpenClipboard` falla
para todos los procesos, invalidando los tests de portapapeles. El fallo del
job `windows` de CI (`DevToolsActivePort`) es la regresión conocida del
runtime 152 del runner; con el runtime 153 de una máquina real el harness
conecta y pasa íntegro. Defecto real encontrado y corregido: las rutas
canonizadas de Windows se filtraban a la UI con prefijo verbatim `\\?\`
(p. ej. en el menú de recientes) — `path_to_string` ahora lo normaliza.

`V3` es el punto de decisión del escape hatch de la sección 2.1: si falla en alguna plataforma, documentarlo y proponer el plugin aparte.

---

## 5. Riesgos

| ID   | Riesgo                                                                                                                                                                                                                                                                                                                                                    | Mitigación                                                                                                                                                                 |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `R1` | Añadir `edit_undo`/`edit_redo` con aceleradores hace que el menú capture `Ctrl+Z` antes que el webview; sin handler, se **rompe** el deshacer que hoy funciona en Windows y Linux.                                                                                                                                                                        | Entregar `F1` y `F2` en el mismo commit. Cubrir con `V4` y `V5` en las tres plataformas.                                                                                   |
| `R2` | `PredefinedMenuItem::undo/redo` **no** sirve: en macOS invoca el selector `undo:` sobre el gestor de deshacer de WebKit, no sobre el historial de CodeMirror; y `@codemirror/view@6.38.8` no atiende los `beforeinput` de tipo `historyUndo`/`historyRedo` (verificado: cero coincidencias en `dist/index.js`). En GTK, muda ni siquiera mapea Undo/Redo. | Usar `MenuItem` propios enrutados al comando `undo()`/`redo()` de `@codemirror/commands`.                                                                                  |
| `R3` | En Windows, muda ejecuta los ítems de portapapeles sintetizando `Ctrl+C` con `SendInput`. Si el acelerador del menú vuelve a capturar esa pulsación, podría re-disparar el ítem.                                                                                                                                                                          | Es el comportamiento del menú por defecto de Tauri, así que se asume estable, pero **verificar explícitamente** con `V2` en Windows que un solo «Pegar» no pega dos veces. |
| `R4` | `navigator.clipboard.readText()` exige contexto seguro y gesto de usuario; en WKWebView el origen es `tauri://localhost`.                                                                                                                                                                                                                                 | El botón Pegar se autodeshabilita con `canReadClipboard()`; el camino siempre disponible es el ítem nativo del menú. Medir con `V3`.                                       |
| `R5` | El menú contextual propio puede tapar el nativo en campos donde sí se quiere el del sistema.                                                                                                                                                                                                                                                              | Registrar `onContextMenu` sólo en el contenedor del editor y en el de la preview, nunca en `document`.                                                                     |
| `R6` | `MenuLabels` está duplicado en tres sitios (`menu.rs`, `ipc.ts`, el payload de `App.tsx`). Si se añade un campo en Rust y no en el payload TS, `set_menu_labels` falla al deserializar y **el menú deja de traducirse al cambiar de idioma**, en silencio.                                                                                                | Tocar los tres sitios en el mismo commit (lista en `F1.1`); `V8` lo cubre.                                                                                                 |

---

## 6. Definición de terminado

- [ ] `D1` ejecutado y documentado en el PR.
- [ ] `F1`+`F2` en un commit; `F3`–`F8` entregadas.
- [ ] CI verde: `pnpm lint`, `format:check`, `test`, `test:e2e`, `build`, `cargo test`, `cargo fmt --check`, `cargo clippy -D warnings`.
- [ ] Matriz `V1`–`V9` completada en al menos macOS y Windows (Linux si hay entorno).
- [ ] `README.md` actualizado en «Qué incluye la versión actual» con las capacidades de portapapeles y el menú Editar completo.
- [ ] `CHANGELOG.md` con entrada bajo la versión correspondiente.
- [ ] Sin dependencias nuevas en `package.json` ni en `src-tauri/Cargo.toml` (salvo decisión explícita sobre `R4`).

---

## Anexo A — Claves i18n nuevas

Añadir en `src/i18n/locales/es.json` y `en.json`, respetando la estructura anidada existente.

| Clave                            | es                                                       | en                                         |
| -------------------------------- | -------------------------------------------------------- | ------------------------------------------ |
| `toolbar.clipboard`              | `Portapapeles`                                           | `Clipboard`                                |
| `clipboard.cut`                  | `Cortar`                                                 | `Cut`                                      |
| `clipboard.copy`                 | `Copiar`                                                 | `Copy`                                     |
| `clipboard.paste`                | `Pegar`                                                  | `Paste`                                    |
| `clipboard.selectAll`            | `Seleccionar todo`                                       | `Select all`                               |
| `clipboard.copyDocument`         | `Copiar documento`                                       | `Copy document`                            |
| `clipboard.copyAsHtml`           | `Copiar como HTML`                                       | `Copy as HTML`                             |
| `clipboard.copyCode`             | `Copiar código`                                          | `Copy code`                                |
| `clipboard.copied`               | `Copiado al portapapeles`                                | `Copied to clipboard`                      |
| `clipboard.unavailable`          | `El portapapeles no está disponible; usa el menú Editar` | `Clipboard unavailable; use the Edit menu` |
| `clipboard.pasteFailed`          | `No se pudo leer el portapapeles`                        | `Could not read the clipboard`             |
| `menu.undo`                      | `Deshacer`                                               | `Undo`                                     |
| `menu.redo`                      | `Rehacer`                                                | `Redo`                                     |
| `menu.cut`                       | `Cortar`                                                 | `Cut`                                      |
| `menu.copy`                      | `Copiar`                                                 | `Copy`                                     |
| `menu.paste`                     | `Pegar`                                                  | `Paste`                                    |
| `menu.selectAll`                 | `Seleccionar todo`                                       | `Select all`                               |
| `menu.replace`                   | `Reemplazar`                                             | `Replace`                                  |
| `menu.copyDocument`              | `Copiar documento`                                       | `Copy document`                            |
| `menu.copyAsHtml`                | `Copiar como HTML`                                       | `Copy as HTML`                             |
| `shortcuts.action.editUndo`      | `Deshacer`                                               | `Undo`                                     |
| `shortcuts.action.editRedo`      | `Rehacer`                                                | `Redo`                                     |
| `shortcuts.action.editCut`       | `Cortar`                                                 | `Cut`                                      |
| `shortcuts.action.editCopy`      | `Copiar`                                                 | `Copy`                                     |
| `shortcuts.action.editPaste`     | `Pegar`                                                  | `Paste`                                    |
| `shortcuts.action.editSelectAll` | `Seleccionar todo`                                       | `Select all`                               |
| `shortcuts.action.editReplace`   | `Reemplazar`                                             | `Replace`                                  |

Las claves `menu.*` son las que viajan al menú nativo a través de `setMenuLabels` (`src/App.tsx:842-867`); las claves `clipboard.*` y `shortcuts.action.*` son sólo de la UI web. Ambos ficheros de idioma deben quedar con exactamente el mismo conjunto de claves.

---

## Anexo B — Evidencia consultada

Todas las afirmaciones de la sección 1 proceden de estas fuentes, no de suposiciones:

| Afirmación                                                     | Fuente                                                                                                                             |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Bruma reemplaza el menú por defecto                            | `src-tauri/src/menu.rs:83-87`, `192-287`                                                                                           |
| El submenú Editar sólo tiene «Buscar»                          | `src-tauri/src/menu.rs:202-203`                                                                                                    |
| El menú por defecto de Tauri sí trae portapapeles              | `tauri` 2.10.3, `src/menu/menu.rs`, `Menu::default`                                                                                |
| En macOS los ítems predefinidos son selectores AppKit          | `muda` 0.17.2, `src/platform_impl/macos/mod.rs:977-983`                                                                            |
| En Windows muda sintetiza teclas con `SendInput`               | `muda` 0.17.2, `src/platform_impl/windows/mod.rs:1197-1207`, `1262-1291`                                                           |
| En GTK dependen de libxdo y no soportan Wayland; sin Undo/Redo | `muda` 0.17.2, `src/platform_impl/gtk/mod.rs:1163-1180`, `1495-1501`                                                               |
| `libxdo` activado por Tauri                                    | `tauri` 2.10.3, `Cargo.toml:103`                                                                                                   |
| WebView2 conserva menús contextuales y aceleradores            | `wry` 0.54.4, `src/lib.rs:1706-1707`, `src/webview2/mod.rs:571-584`; sin overrides en `tauri` 2.10.3 ni `tauri-runtime-wry` 2.10.1 |
| CodeMirror atiende los eventos DOM `copy`/`cut`/`paste`        | `@codemirror/view` 6.38.8, `handlers.copy`/`handlers.cut`/`handlers.paste`                                                         |
| CodeMirror **no** atiende `historyUndo`/`historyRedo`          | `@codemirror/view` 6.38.8, `handlers.beforeinput`                                                                                  |
| Aceleradores de historial por plataforma                       | `@codemirror/commands` 6.10.3, `historyKeymap`                                                                                     |
| El frontend no cancela `Ctrl+C`/`Ctrl+V` ni `contextmenu`      | `src/hooks/useAppShortcuts.ts:46-67`; búsqueda en `src/`: sin handlers de `contextmenu`                                            |
