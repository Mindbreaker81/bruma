# AGENTS.md — Bruma

Editor Markdown de escritorio (Tauri 2 + React + TypeScript + CodeMirror 6).
Idioma del proyecto y de los commits: **español**.

## Comandos de validación

Ejecutar antes de cada commit (son los mismos que `.github/workflows/ci.yml`):

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

Las dependencias nativas de Linux (`libglib2.0-dev`, `libgtk-3-dev`,
`libsoup-3.0-dev`, `libwebkit2gtk-4.1-dev`) están instaladas en el entorno
local; `pnpm tauri build` genera el `.deb` pero la firma del updater falla sin
`TAURI_SIGNING_PRIVATE_KEY` (solo existe en los secrets de CI — es esperado).

## Convenciones

- **Commits**: Conventional Commits + `commitlint` (`feat:`, `fix:`, `docs:`…);
  hay hook de `husky` + `lint-staged` (Prettier/ESLint).
- **Versión**: `package.json` es la fuente única; `pnpm sync:version` propaga a
  `tauri.conf.json`, `Cargo.toml` y `Cargo.lock`. El bump se hace en el commit
  de preparación de release, no en cada commit.
- **Changelog**: `CHANGELOG.md` sigue Keep a Changelog; los cambios nuevos van
  en `## [Unreleased]` y se mueven a la versión al preparar el release.
- **Tareas**: ver la sección siguiente.
- **Docs de referencia**: `docs/TODO.md`, `docs/ARCHITECTURE.md`,
  `docs/PLAN-MEJORAS.md`, `PLAN-PORTAPAPELES-Y-EDICION.md` (rama actual).

## Seguimiento de tareas — YouTrack (proyecto BRU)

El tracker oficial es **YouTrack**, proyecto **`BRU`** (Bruma), vía el servidor
MCP `youtrack`. `docs/TODO.md` queda como histórico de sprints/backlog; el
estado operativo se gestiona en BRU.

Reglas:

- **Al empezar una tarea**: pasar el issue a `State: In Progress`.
- **Al terminar**: pasar a `State: Done` y, si hay validación manual pendiente
  (p. ej. la matriz V1–V9), dejarlo `In Progress` con un comentario explicando
  qué falta verificar.
- **Commits**: referenciar el issue en el cuerpo del commit (`BRU-N`).
- **Tarea nueva descubierta**: crear el issue con `create_issue`
  (`project: "BRU"`) en vez de dejarla solo en código o en el TODO.
- **Dependencias**: enlazar con `link_issues` (`depends on`, `subtask of`…).
- **Campos válidos**: `Priority` ∈ {Show-stopper, Critical, Major, Normal,
  Minor}; `State` ∈ {To do, In Progress, Done}; `Assignee` (login); `Due Date`.
- Consultar siempre `search_issues` con `project: BRU` antes de crear un issue
  para evitar duplicados.
- Los textos de issues y comentarios se escriben en español.
