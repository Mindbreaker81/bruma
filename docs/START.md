# Guía de inicio para desarrolladores — Bruma

Este documento es el punto de entrada para empezar a implementar Bruma desde cero. Asume que el repositorio ya tiene la documentación de planificación y que vas a ejecutar el Sprint 0 (andamiaje) y siguientes.

## Prerequisitos

- **Node.js** LTS (≥ 20).
- **pnpm** (instalar: `npm install -g pnpm`).
- **Rust** estable (instalar: [rustup](https://rustup.rs/)).
- **Git**.
- Toolchain de la plataforma:
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`).
  - **Windows**: Microsoft C++ Build Tools + WebView2 Runtime (Tauri bootstrapper lo gestiona si falta).
- **GitHub CLI** (opcional, si usas `gh` para workflows).

## Revisión previa (15 min)

Antes de escribir código, lee estos documentos en orden:

1. **`docs/PRDv2.md`** — Entiende el producto, el alcance del MVP y los no-objetivos.
2. **`docs/ARCHITECTURE.md`** — Entiende el stack, la estructura de repositorio y las decisiones técnicas cerradas.
3. **`docs/TODO.md`** — Revisa el Sprint 0 (andamiaje) y los sprints siguientes.

Verifica que las decisiones de sprint 0 están cerradas (están en `ARCHITECTURE.md` §20). Si algo no está claro, preguntar antes de avanzar.

## Sprint 0 — Andamiaje

Sigue los pasos en `docs/TODO.md` → Sprint 0 → Andamiaje. Resumen:

### 1. Revisión del copyright en LICENSE

- Abre `LICENSE` y sustituye `Bruma contributors` por el titular real (tu nombre o entidad legal) antes de publicar el repo.
- Haz commit: `chore: update copyright holder in LICENSE`.

### 2. Configuración base

- `.gitignore` ya existe.
- Crea `.editorconfig` si lo deseas (opcional, pero recomendado para consistencia).
- Crea `.prettierrc` con configuración básica:
  ```json
  {
    "semi": true,
    "singleQuote": true,
    "trailingComma": "es5",
    "printWidth": 80
  }
  ```
- Crea `.eslintrc.cjs` con configuración para React + TypeScript (usa `@eslint/js` o `eslint-config-react-app` como base).
- Crea `rustfmt.toml` en la raíz si quieres overrides (opcional; `rustfmt` por defecto suele bastar).
- Añade lints en `src-tauri/Cargo.toml`:
  ```toml
  [lints]
  rust = { warnings = "deny" }
  ```

Haz commit: `chore: add linting and formatting configs`.

### 3. Estructura de carpetas

Crea la estructura según `ARCHITECTURE.md` §3:

```bash
mkdir -p src/{app,components,features/{editor,preview,files,search,settings,shortcuts},lib,i18n/locales,styles}
mkdir -p src-tauri/src/commands
mkdir -p tests
```

Haz commit: `chore: create folder structure per architecture`.

### 4. Inicializar Tauri 2.x

```bash
pnpm create tauri-app
```

Sigue el wizard:
- Template: React + TypeScript.
- Package manager: pnpm.
- Nombre: bruma.
- Window title: Bruma.
- Dist directory: `dist` (Vite default).

Esto creará `src-tauri/` y el frontend básico. Mueve/ajusta los archivos para que coincidan con la estructura propuesta (el wizard puede crear `src/` plano; reorganiza según §3).

Haz commit: `chore: initialize Tauri 2.x with React + TypeScript template`.

### 5. Añadir Tailwind CSS

```bash
pnpm add -D tailwindcss postcss autoprefixer
pnpm exec tailwindcss init -p
```

Configura `tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // o 'media' si prefieres prefers-color-scheme
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config
```

Añade las directivas de Tailwind a `src/styles/main.css` (o similar):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Importa este CSS en `src/main.tsx`.

Haz commit: `style: add Tailwind CSS with basic config`.

### 6. Añadir dependencias clave

```bash
# Editor
pnpm add @codemirror/state @codemirror/view @codemirror/lang-markdown @codemirror/search

# Markdown y sanitización
pnpm add markdown-it dompurify
pnpm add -D @types/markdown-it @types/dompurify

# Resaltado de código
pnpm add highlight.js
pnpm add -D @types/highlight.js

# Estado
pnpm add zustand

# i18n
pnpm add i18next react-i18next
pnpm add -D i18next-browser-language-detector

# Iconos
pnpm add lucide-react

# Tauri plugins
pnpm add @tauri-apps/plugin-store
```

En `src-tauri/Cargo.toml`, añade `tauri-plugin-store`:

```toml
[dependencies]
tauri-plugin-store = "2"
```

Haz commit: `chore: add core dependencies (editor, markdown, i18n, store)`.

### 7. Configurar Vite y TypeScript

- Asegura que `tsconfig.json` tiene `"strict": true` y `"noUncheckedIndexedAccess": true` si quieres máxima seguridad.
- Configura `vite.config.ts` según necesidades (alias de paths, etc.).

Haz commit: `build: configure Vite and TypeScript strict mode`.

### 8. Configurar i18next

Crea `src/i18n/index.ts`:

```ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-language-detector';

import es from './locales/es.json';
import en from './locales/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { es, en },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;
```

Crea `src/i18n/locales/es.json` y `en.json` con keys mínimas (ej. `app.name`, `menu.file`, `menu.edit`, etc.).

Importa en `src/main.tsx`: `import './i18n';`.

Haz commit: `i18n: setup i18next with es/en locales`.

### 9. Configurar Vitest + React Testing Library

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Configura `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

Crea `src/test/setup.ts` con `import '@testing-library/jest-dom';`.

Añade script en `package.json`: `"test": "vitest"`.

Haz commit: `test: configure Vitest with React Testing Library`.

### 10. Configurar Playwright

```bash
pnpm add -D @playwright/test
```

Inicializa: `npx playwright install`.

Configura `playwright.config.ts` (puedes usar el default y ajustar el webDir a `dist`).

Añade script: `"test:e2e": "playwright test"`.

Haz commit: `test: configure Playwright for E2E tests`.

### 11. Configurar Husky + commitlint

```bash
pnpm add -D husky @commitlint/cli @commitlint/config-conventional
pnpm exec husky init
echo "pnpm exec commitlint --edit \$1" > .husky/commit-msg
```

Crea `commitlint.config.cjs`:

```cjs
module.exports = {
  extends: ['@commitlint/config-conventional'],
};
```

Haz commit: `chore: add Husky and commitlint for conventional commits`.

### 12. (Opcional) Configurar lint-staged

```bash
pnpm add -D lint-staged
```

Añade en `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

Añade hook: `echo "pnpm exec lint-staged" > .husky/pre-commit`.

Haz commit: `chore: add lint-staged for pre-commit formatting`.

### 13. Crear workflow CI

Crea `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm format:check

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test

  test-rust:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions-rust-lang/setup-rust-toolchain@v1
      - working-directory: src-tauri
        run: cargo test

  build:
    strategy:
      matrix:
        os: [macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm tauri build
```

Haz commit: `ci: add GitHub Actions CI workflow (lint, test, build)`.

### 14. Documentar comandos en README

Actualiza `README.md` con los comandos reales de `package.json` (ajusta según hayas definido los scripts).

Haz commit: `docs: update README with actual development commands`.

## Sprint 1 — Cimientos de UI y modelo de documento

Sigue `docs/TODO.md` → Sprint 1. Resumen rápido:

1. Layout base (header, área principal, barra inferior).
2. Tema claro/oscuro/sistema con variables CSS.
3. Modelo `Document` y store (`src/features/files/state.ts`).
4. Indicador `isDirty` en UI.
5. Menú nativo Tauri con acciones básicas.
6. Tests del estado.

## Sprint 2 — Editor + apertura/guardado

Sigue `docs/TODO.md` → Sprint 2. Resumen:

1. Integrar CodeMirror 6.
2. Comandos Rust (`open_file_dialog`, `read_file`, `save_file`, `save_file_dialog`).
3. Drag & drop.
4. Manejo de errores I/O.
5. Tests E2E básicos.

## Sprintes siguientes

Continúa siguiendo `docs/TODO.md` linealmente. Cada sprint tiene criterios de cierre claros.

## Convención de commits

Sigue [Conventional Commits 1.0](https://www.conventionalcommits.org/es/v1.0.0/). `commitlint` validará tus mensajes. Ejemplos:

- `feat(editor): add CodeMirror 6 integration`
- `fix(files): handle file read errors gracefully`
- `docs(arch): update decision table`
- `chore(deps): upgrade markdown-it to latest`

## Ayuda

- Si algo no está claro, revisa `docs/ARCHITECTURE.md` y `docs/PRDv2.md`.
- Para dudas de Tauri, consulta [docs.tauri.app](https://tauri.app/v1/guides/).
- Para dudas de CodeMirror 6, consulta [codemirror.net/docs](https://codemirror.net/docs/).

Buena suerte.
