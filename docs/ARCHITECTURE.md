# Arquitectura — Bruma

- **Versión:** 0.1 (inicial, pre-implementación)
- **Estado:** Documento vivo alineado con la implementación MVP actual
- **Documento padre:** `PRDv2.md`

Este documento describe la arquitectura técnica propuesta para Bruma. Su objetivo es dar suficiente contexto para iniciar la implementación del MVP sin tomar decisiones críticas en caliente. Cualquier desviación durante la implementación debe reflejarse aquí.

---

## 1. Objetivos arquitectónicos

Derivados del PRD:

- **Ligero:** binario instalado < 30 MB, RAM en reposo < 200 MB.
- **Rápido:** arranque en frío < 1 s, edición sin lag (< 16 ms/keystroke) hasta 1 MB.
- **Local-first:** sin red en MVP salvo apertura externa explícita.
- **Multiplataforma real:** mismo código y mismo comportamiento en macOS y Windows; Linux post-MVP sin reescrituras.
- **Mantenible:** lógica de dominio aislada del framework de UI y del shell desktop.
- **Seguro:** sanitización del HTML del preview, capacidades del shell restringidas y acceso FS acotado al home del usuario.

---

## 2. Stack tecnológico

| Capa                         | Elección                              | Motivo                                                                 |
| ---------------------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| Shell desktop                | **Tauri 2.x**                         | Binario pequeño, WebView del SO, backend en Rust, capacidades granulares. |
| Backend nativo               | **Rust (estable)**                    | Requerido por Tauri; FS, diálogos, eventos.                            |
| UI                           | **React 18 + TypeScript**             | Ecosistema, tipado, componentes maduros.                               |
| Bundler frontend             | **Vite 5**                            | DX, HMR, builds rápidas.                                               |
| Editor de texto              | **CodeMirror 6** + `@codemirror/lang-markdown` | Modular, performante, accesible, búsqueda integrada.            |
| Parser/render Markdown       | **markdown-it** + plugins             | Estable, ampliable (GFM), determinista.                                |
| Plugins markdown-it (MVP)    | `markdown-it-gfm-table`, `markdown-it-task-lists` (o equivalentes) | Soporte GFM acotado.       |
| Sanitización                 | **DOMPurify**                         | Estándar de facto, allowlist conservadora.                             |
| Estilos                      | **Tailwind CSS**                      | DX rápida y diseño consistente; tema claro/oscuro vía `dark:` + variables CSS. |
| Estado                       | Hooks + **Zustand** (si crece)        | Mínimo overhead, ergonómico.                                           |
| i18n                         | **i18next + react-i18next**           | Estándar maduro, catálogos JSON.                                       |
| Iconos                       | **lucide-react**                      | Ligero, consistente.                                                   |
| Tests unit/component         | **Vitest + React Testing Library**    | Integración natural con Vite.                                          |
| Tests E2E                    | **Playwright**                        | Soporte multi-SO, posible integración con `tauri-driver` en V1.x.      |
| Resaltado de código (preview) | **highlight.js**                     | ~30 KB con tema y lenguajes comunes; integración limpia con markdown-it. |
| Persistencia config          | **tauri-plugin-store**                | Plugin oficial; key-value JSON multiplataforma.                        |
| Convención de commits        | **Conventional Commits** + `commitlint` | Habilita generación de CHANGELOG y bumps SemVer asistidos.           |
| Versionado                   | **SemVer estricto** (MAJOR.MINOR.PATCH) | Coherente con Conventional Commits.                                  |
| Lint/format                  | **ESLint + Prettier**                 | Estándar.                                                              |
| Rust lint                    | **rustfmt + clippy**                  | Estándar.                                                              |
| CI                           | **GitHub Actions** (matrices macOS/Windows) | Builds y tests reproducibles.                                  |

Decisión adicional pendiente (no bloqueante):

- Librería de primitivas accesibles (Radix UI, Headless UI o componentes propios). Se evaluará en el primer sprint con UI.

---

## 3. Estructura del repositorio (propuesta)

```
bruma/
├── docs/
│   ├── PRDv1.md
│   ├── PRDv2.md
│   ├── ARCHITECTURE.md
│   └── TODO.md
├── src/                       # Frontend (React + TS)
│   ├── app/                   # Composición de la app, layout, rutas internas
│   ├── components/            # Componentes UI reutilizables
│   ├── features/
│   │   ├── editor/            # Integración CodeMirror, comandos, atajos UI
│   │   ├── preview/           # Render Markdown + sanitización
│   │   ├── files/             # Estado de documento, recientes, dirty tracking
│   │   ├── search/            # Panel y lógica de búsqueda
│   │   ├── settings/          # Tema, idioma
│   │   └── shortcuts/         # Mapa de atajos por plataforma
│   ├── lib/                   # Utilidades puras (parser md wrapper, sanitizer, etc.)
│   ├── i18n/
│   │   ├── index.ts
│   │   └── locales/
│   │       ├── es.json
│   │       └── en.json
│   ├── styles/
│   ├── main.tsx
│   └── App.tsx
├── src-tauri/                 # Backend Tauri (Rust)
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands/          # Comandos invocables desde JS
│   │   │   ├── fs.rs          # open, save, save_as, recent
│   │   │   ├── dialog.rs      # diálogos open/save
│   │   │   └── shell.rs       # apertura de enlaces externos
│   │   ├── menu.rs            # menú nativo
│   │   └── lib.rs
│   ├── icons/
│   ├── tauri.conf.json
│   ├── Cargo.toml
│   └── build.rs
├── tests/                     # E2E
├── public/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
├── .editorconfig
├── .gitignore
├── .prettierrc
├── .eslintrc.cjs
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
├── README.md
├── CHANGELOG.md
└── LICENSE                    # TBD
```

---

## 4. Modelo conceptual

### 4.1 Documento

```ts
type Document = {
  id: string;                  // UUID local
  path: string | null;         // null si nuevo sin guardar
  content: string;             // contenido raw Markdown (UTF-8)
  savedContent: string;        // último contenido persistido
  encoding: "utf-8";           // fijo en MVP
  eol: "lf" | "crlf";          // detectado al abrir; lf por defecto
  lastSavedAt: number | null;
};

const isDirty = (d: Document) => d.content !== d.savedContent;
```

### 4.2 Estado de la app (cliente)

```ts
type AppState = {
  document: Document;
  view: "editor" | "preview" | "split";
  theme: "light" | "dark" | "system";
  language: "es" | "en" | "system";
  recentFiles: string[];       // máx. 10
  search: {
    open: boolean;
    query: string;
    caseSensitive: boolean;
    matchIndex: number;
    matchCount: number;
  };
};
```

Persistencia entre sesiones (mediante store del SO o JSON local en directorio de config):

- `theme`, `language`, `view`, `recentFiles`.
- **No** se persiste contenido en MVP (sin autoguardado).

---

## 5. Frontera frontend ↔ backend (Tauri IPC)

Tauri expone `invoke("comando", args)` desde JS y recibe en Rust funciones `#[tauri::command]`. Eventos `emit/listen` para señales asíncronas.

### 5.1 Comandos Rust expuestos (MVP)

| Comando             | Args                          | Devuelve                | Descripción                                  |
| ------------------- | ----------------------------- | ----------------------- | -------------------------------------------- |
| `open_file_dialog`  | —                             | `Option<OpenedFile>`    | Diálogo nativo de apertura.                  |
| `read_file`         | `{ path: string }`            | `OpenedFile`            | Lee UTF-8, detecta EOL.                      |
| `save_file`         | `{ path, content, eol }`      | `SavedFile`             | Escribe UTF-8 sin BOM.                       |
| `save_file_dialog`  | `{ content, eol, suggested }` | `Option<SavedFile>`     | "Guardar como" + escritura.                  |
| `open_external`     | `{ url: string }`             | `()`                    | Abre URL en navegador del SO (allowlist).    |
| `get_recent_files`  | —                             | `string[]`              | Lee desde config local.                      |
| `set_recent_files`  | `{ paths: string[] }`         | `()`                    | Persiste en config local.                    |

```ts
type OpenedFile = {
  path: string;
  content: string;
  eol: "lf" | "crlf";
};

type SavedFile = {
  path: string;
  savedAt: number;
};
```

### 5.2 Eventos Tauri ↔ JS

- `menu://action` (Rust → JS): clicks de menú nativo (`new`, `open`, `save`, `save_as`, `find`, `toggle_view`, `toggle_theme`).
- `file://drop` (Rust → JS): payload con paths arrastrados sobre la ventana.
- `app://before-close` (JS → Rust): JS confirma si puede cerrarse (gestiona `isDirty`).

### 5.3 Capacidades / allowlist Tauri

Configurar `tauri.conf.json` con permisos mínimos:

- `fs`: solo lectura/escritura de Markdown dentro del home del usuario tras canonicalización y validación del path final.
- `dialog`: open / save.
- `shell`: solo `open` para URLs en allowlist (`http`, `https`, `mailto`).
- `path`: para resolver rutas de configuración.
- **Sin** `http`, `process`, `notification` (no necesarios en MVP).

---

## 6. Render Markdown — pipeline

```
[contenido raw]
    │ (debounce 150 ms)
    ▼
[markdown-it.parse + render]
    │
    ▼
[HTML]
    │
    ▼
[DOMPurify.sanitize con allowlist]
    │
    ▼
[insertar en preview con dangerouslySetInnerHTML controlado]
```

**Reglas de sanitización (allowlist):**

- Etiquetas: encabezados, párrafos, listas, blockquote, code, pre, em, strong, del, a, img (V1.1+), table/thead/tbody/tr/th/td, hr, br, span (con clases del renderer), input checkbox readonly (task lists).
- Atributos: `href` (solo `http(s)`, `mailto:`), `src` (V1.1+, file:// con resolución), `alt`, `title`, `class` (allowlist), `id` (para anclas de encabezados).
- **Bloqueado:** `<script>`, `<iframe>`, `<object>`, `<embed>`, `on*` handlers, `style` con `expression`, `javascript:` urls.

---

## 7. Editor

### 7.1 CodeMirror 6 — extensiones MVP

- `basicSetup` (line numbers off por defecto en MVP, configurable post-MVP).
- `markdown({ codeLanguages, base: GFM-like })`.
- Tema claro/oscuro propio coordinado con el de la app.
- `search` (panel) — usable internamente o reemplazado por panel propio para coherencia visual.
- `history` (undo/redo).
- Atajos por defecto + overrides para coherencia con el menú nativo.

### 7.2 Sincronía editor ↔ estado

- El editor mantiene su propio estado interno (`EditorView`).
- Cambios → callback `onChange` debounced (50 ms) → actualiza `document.content` → dispara render preview con su debounce (150 ms).
- Apertura de archivo → reemplazo de `EditorState` con `Transaction` desde el contenido cargado.

---

## 8. Búsqueda

Dos opciones; decidir en sprint 0:

- **A.** Reusar el panel de búsqueda integrado de CodeMirror 6 (`@codemirror/search`).
- **B.** Construir panel propio en React, delegando highlight/find al `EditorView` mediante comandos de CM6.

**Decisión cerrada (sprint 0):** opción **B** — panel propio en React. Justificación: consistencia visual con el resto de la UI, control completo sobre i18n y atajos, mejor UX final. La búsqueda real se delega al `EditorView` de CM6 mediante comandos (`findNext`, `findPrevious`, `setSearchQuery`).

---

## 9. Atajos y menú

- El menú nativo se construye en Rust (Tauri) con identificadores estables.
- En el frontend hay un `KeymapProvider` que mapea los mismos identificadores a comandos de la app.
- Los atajos por SO se resuelven en JS mediante una utilidad `getPlatform()` y un mapa declarativo.

---

## 10. i18n

- Catálogos `src/i18n/locales/{es,en}.json`.
- Carga inicial: `language === "system"` → idioma del SO si está disponible; fallback `en`.
- API: `t("key")` desde `react-i18next`.
- Convención de claves: `feature.componente.texto` (ej. `editor.menu.save`).
- Toggle desde menú "Idioma".

---

## 11. Temas

- Variables CSS para colores en `:root[data-theme="light"]` y `:root[data-theme="dark"]`.
- `theme === "system"` escucha `prefers-color-scheme`.
- El tema del editor (CM6) se sincroniza vía extensión condicional.
- Contraste verificado AA en sprint de pulido.

---

## 12. Persistencia local

- Implementación: **`tauri-plugin-store`** (oficial). API key-value sobre JSON, gestionada por el plugin.
- Ubicación de los datos (gestionada por Tauri según `app_config_dir`):
  - macOS: `~/Library/Application Support/<bundle_id>/`.
  - Windows: `%APPDATA%/<bundle_id>/`.
  - Linux (post-MVP): `$XDG_CONFIG_HOME/<bundle_id>/` o `~/.config/<bundle_id>/`.
- Archivo único por defecto: `settings.json`.
- Esquema mínimo:
  ```json
  {
    "version": 1,
    "theme": "system",
    "language": "system",
    "view": "split",
    "recentFiles": []
  }
  ```
- Migración: campo `version`; si futura versión cambia el esquema, migración explícita en arranque.

---

## 13. Manejo de errores

- Errores de I/O (lectura/escritura) → toast no bloqueante con texto claro + opción "Reintentar" cuando aplique.
- Errores de parseo Markdown → no aplica (markdown-it no lanza); se renderiza lo posible.
- Errores no recuperables del backend Rust → ventana de error y log en archivo local (sin envío externo).
- Logs locales en `~/Library/Logs/Bruma/` (macOS) / `%LOCALAPPDATA%/Bruma/Logs/` (Windows). Rotación simple.

---

## 14. Rendimiento — tácticas

- Debounce de preview (150 ms) y de persistencia de configuración (500 ms).
- Memoización de render Markdown si el contenido no cambió.
- Render del preview en el mismo proceso (no worker en MVP) — simple y suficiente para los objetivos. Worker se evalúa si se exceden 16 ms en docs grandes.
- Lazy-load de plugins markdown-it pesados si los hubiera.
- Evitar re-render global ante cada keystroke: el editor mantiene estado local; el `document.content` solo se sincroniza al store con debounce.

---

## 15. Seguridad

- DOMPurify con allowlist (sección 6).
- Tauri: `withGlobalTauri: false` y comandos invocables desde JS solo los listados.
- Apertura de URLs externas: validación de esquema en Rust antes de delegar al SO.
- CSP estricta en `tauri.conf.json`:
  - `default-src 'self'`
  - `style-src 'self' 'unsafe-inline'` (para CM6/Tailwind si aplica)
  - `script-src 'self'`
  - `img-src 'self' data: file:` (V1.1)
  - `connect-src 'self' ipc: http://ipc.localhost`

---

## 16. Pruebas

### 16.1 Pirámide

- **Unit (Vitest):** parser wrapper, sanitizer, lógica de `isDirty`, atajos por plataforma, i18n key resolution.
- **Component (Vitest + RTL):** panel de búsqueda, barra inferior, diálogos de confirmación.
- **E2E (Playwright):** abrir/editar/guardar, drag & drop (mock), búsqueda, cambio de tema/idioma. En MVP, ejecutados sobre el dev server (vite); integración con `tauri-driver` queda para V1.x.

### 16.2 Cobertura objetivo MVP

- Lógica de dominio (`src/lib`, `src/features/files/state`): **> 80%**.
- Componentes críticos (editor wrapper, preview, search): smoke tests + interacciones clave.
- E2E: 1 happy path por historia de usuario P0.

### 16.3 Pruebas manuales obligatorias antes de release

- Checklist sobre 20+ archivos `.md` reales (READMEs, notas, docs).
- Pruebas en macOS (Apple Silicon e Intel si disponible) y Windows 10 + 11.
- Pruebas con archivos de 1 MB y 5 MB.
- Pruebas de drag & drop con archivos válidos e inválidos.

---

## 17. CI / CD

- **CI (`ci.yml`)** en cada PR:
  - Job `frontend`: ESLint, Prettier check, Vitest y build Vite.
  - Job `tauri`: matriz `[macos-latest, windows-latest]` con `cargo test` y build Tauri (sin firmar).
  - Publicación de artifacts versionados `bruma-vX.Y.Z-<platform>-unsigned`.
- **Release (`release.yml`)** disparado por tag `vX.Y.Z`:
  - Build sin firmar para QA interno en macOS y Windows.
  - Publicación de artifacts versionados desde el workflow.
  - Firma/notarización pendiente de credenciales de plataforma.

---

## 18. Estrategia multiplataforma

### 18.1 macOS (Apple Silicon + Intel)

- Universal binary: un solo `.app` contiene código x86_64 y arm64. Tauri compila ambos targets y los une con `lipo`.
- Build de desarrollo: puede ser solo la arquitectura del host para velocidad; builds de release siempre universal.
- Tests: CI debe validar ambas arquitecturas (o al menos el universal binary).

### 18.2 Linux (post-MVP, v2.0)

Para que el cambio sea barato cuando llegue:

- Evitar APIs específicas de plataforma fuera de los comandos Rust (que ya manejan multiplataforma).
- Mantener la matriz de CI con un job Linux (build only) desde antes para detectar regresiones.
- Fuentes y assets compatibles (no depender de SF Pro / Segoe UI sin fallback).
- Diálogos: usar siempre los APIs de Tauri, no asumir comportamiento concreto de SO.
- Empaquetado en v2.0: `appimage`, `deb`, `rpm` vía Tauri bundler. Flatpak: investigación adicional.

---

## 19. Trazabilidad PRD ↔ implementación

| PRD                | Módulo / archivo principal                                         |
| ------------------ | ------------------------------------------------------------------ |
| RF-01..RF-06       | `src/features/files/*`, `src-tauri/src/commands/fs.rs`, `dialog.rs`|
| RF-07..RF-09       | `src/features/editor/*`, `src/features/shortcuts/*`                |
| RF-10..RF-12       | `src/features/preview/*`, `src/lib/markdown.ts`                    |
| RF-13..RF-16.1     | `src/features/search/*`                                            |
| RF-17..RF-19       | `src/features/files/state.ts`, `src/app/dialogs/*`                 |
| RF-20              | `src/features/settings/*`                                          |
| RNF-05 / Seguridad | `src/lib/sanitize.ts`, `src-tauri/tauri.conf.json`, `src-tauri/src/commands/fs.rs`, `docs/SECURITY.md`|
| RNF-09 / i18n      | `src/i18n/*`                                                       |

---

## 20. Decisiones de sprint 0

### Cerradas

| #   | Decisión                                | Resolución                          |
| --- | --------------------------------------- | ----------------------------------- |
| 1   | Licencia                                | **MIT**                             |
| 2   | Gestor de paquetes JS                   | **pnpm**                            |
| 3   | Estilos                                 | **Tailwind CSS**                    |
| 4   | Resaltado de código en preview (MVP)    | **Sí**, con `highlight.js`          |
| 5   | Panel de búsqueda                       | **Panel propio en React**           |
| 6   | Persistencia de configuración           | **`tauri-plugin-store`**            |
| 7   | Versionado y commits                    | **SemVer estricto + Conventional Commits** |

### Versionado de app

`package.json` es la fuente unica editable de version. La metadata que Tauri y Cargo requieren en archivos propios se trata como salida sincronizada:

- `pnpm sync:version` propaga `package.json.version` a `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml` y `src-tauri/Cargo.lock`.
- `pnpm check:version` falla si alguno de esos archivos queda desincronizado.
- `pnpm dev`, `pnpm build` y `pnpm tauri ...` ejecutan la sincronizacion antes de arrancar.
- El frontend expone la version con `__APP_VERSION__`, definido desde `package.json` en Vite/Vitest.

### Pendientes (no bloqueantes para arrancar)

- Librería de primitivas accesibles (Radix UI, Headless UI o componentes propios).
- Estrategia de firma de código en Windows (Authenticode) — se aborda al preparar release.
- Cuenta Apple Developer y notarización macOS — se aborda al preparar release.

## 21. Convención de commits

Se adopta [Conventional Commits 1.0](https://www.conventionalcommits.org/es/v1.0.0/).

Tipos permitidos:

- `feat`: nueva funcionalidad de cara al usuario.
- `fix`: corrección de bug.
- `docs`: cambios solo en documentación.
- `style`: cambios de formato sin impacto funcional.
- `refactor`: cambio de código sin nueva función ni fix.
- `perf`: mejora de rendimiento.
- `test`: añadir o ajustar tests.
- `build`: cambios en sistema de build o dependencias.
- `ci`: cambios en configuración de CI.
- `chore`: tareas de mantenimiento sin impacto en src ni tests.
- `revert`: revertir un commit anterior.

Formato:

```
<tipo>(<ámbito opcional>): <descripción corta en imperativo>

<cuerpo opcional>

<footer opcional, p.ej. BREAKING CHANGE: ... o Closes #123>
```

Reglas:

- Descripción corta en minúsculas, sin punto final, < 72 caracteres.
- `BREAKING CHANGE:` en footer (o `!` tras tipo) → bump MAJOR.
- `feat:` → bump MINOR. `fix:` → bump PATCH. Resto no incrementa versión por sí mismo.
- Validación automática vía `commitlint` con la configuración `@commitlint/config-conventional` y hook `commit-msg` (Husky).
