# Bruma

Editor Markdown de escritorio, local-first, enfocado en lo esencial.

## Estado actual

- Version de app: se lee desde `package.json` y se sincroniza con Tauri/Rust con `npm run sync:version`.
- Plataformas objetivo MVP: macOS, Windows y Linux
- Estado de entrega: build y tests CI en macOS/Windows en verde; pendiente QA manual de aceptacion final
- Estado de seguridad: fix de path traversal aplicado en comandos Tauri de filesystem y validado con tests Rust

## Que incluye la version actual

- Nuevo, abrir, guardar y guardar como (`.md` / `.markdown`)
- Editor Markdown (CodeMirror 6)
- Preview en tiempo real (markdown-it + sanitizacion con DOMPurify)
- Modos de vista: editor, preview, dividido; en dividido, scroll del editor y del preview **sincronizable** u independiente (preferencia persistida)
- Interfaz: barra superior, pestañas y barra de modo de vista **fijas**; el documento largo se desplaza solo en el panel de edición o vista previa
- Busqueda con contador, siguiente/anterior y case-sensitive
- Proteccion ante cambios sin guardar (confirmacion en acciones de riesgo)
- Drag and drop de archivos Markdown
- Recientes persistidos (max 10) con submenu nativo real en `Archivo > Abrir recientes`
- Tema claro/oscuro/sistema
- Interfaz bilingue `es` / `en` con deteccion de idioma del sistema
- Menu nativo de app (Archivo, Editar, Ver, Idioma, Ayuda)
- Soporte restaurado de cierre nativo con `Cmd+Q` en macOS
- Exportacion HTML con estilos o plano
- Imprimir documento desde toolbar o menu nativo
- Carga diferida de editor, preview, busqueda, dialogos y export para reducir el JS inicial
- Reporte de bundle local con `npm run build:analyze`

## Seguridad y privacidad

- Local-first estricto: sin nube y sin telemetria
- Sanitizacion de HTML del preview (bloquea scripts y payloads peligrosos)
- CSP de Tauri endurecida para build de escritorio
- Lectura/escritura Markdown del backend restringida al home del usuario tras canonicalizacion de paths

## Descargar builds desde GitHub Actions

El workflow CI sube bundles sin firmar por plataforma.

1. Ir a `Actions` en GitHub.
2. Abrir un run exitoso de `CI` (job `Tauri`).
3. Descargar artifacts con formato:
   - `bruma-v<version>-macos-latest-unsigned`
   - `bruma-v<version>-windows-latest-unsigned`

El nombre del artifact se genera automaticamente desde `package.json`.

## Descargas (GitHub Releases)

Para usuarios finales, usamos **GitHub Releases** con archivos listos para descargar por plataforma.

- **macOS**:
  - `bruma-vX.Y.Z-macos-x64.dmg` (Intel)
  - `bruma-vX.Y.Z-macos-aarch64.dmg` (Apple Silicon)
- **Windows (instaladores)**:
  - `bruma-vX.Y.Z-windows-x64.msi`
  - `bruma-vX.Y.Z-windows-x64-setup.exe`
- **Windows (portable-full)**:
  - `bruma-vX.Y.Z-windows-x64-portable-full.zip`
  - `bruma-vX.Y.Z-windows-arm64-portable-full.zip`
  - Incluye **Fixed WebView2 Runtime**, pensado para arrancar incluso si falta WebView2 en el sistema.
- **Linux**:
  - `bruma-vX.Y.Z-linux-x86_64.AppImage`

## Ejecutar builds en macOS y Windows

### macOS

1. Descargar el artifact de macOS desde `Actions`.
2. Extraer el archivo descargado.
3. Abrir el `.dmg` y mover `Bruma.app` a `Applications`.
4. Si macOS indica que la app esta danada o bloqueada, quitar la cuarentena:

```bash
xattr -dr com.apple.quarantine "/Applications/Bruma.app"
open "/Applications/Bruma.app"
```

5. Si Gatekeeper sigue bloqueando la app, abrirla una vez con clic derecho sobre `Bruma.app` y luego `Open`, o autorizarla en `System Settings > Privacy & Security`.

### Windows

1. Descargar el artifact de Windows desde `Actions`.
2. Extraer el archivo descargado.
3. Ejecutar el `.msi` o `.exe`.
4. Si Windows SmartScreen muestra una advertencia por app no firmada:
   - Pulsar `More info`.
   - Pulsar `Run anyway`.
5. Si el sistema bloquea el archivo por descarga:
   - Abrir `Properties` del `.exe` o `.msi`.
   - Marcar `Unblock` si aparece esa opcion.
   - Aplicar cambios y volver a ejecutar.

Las builds actuales de CI son internas y sin firma/notarizacion, por eso ambos sistemas pueden mostrar avisos de seguridad incluso cuando el bundle es valido.

Nota: los bundles de **GitHub Releases** tambien pueden disparar advertencias (SmartScreen/Gatekeeper) mientras no haya firma/notarizacion.

## Desarrollo local

Requisitos:

- Node.js >= 20
- pnpm
- Rust estable (`rustup`)
- Toolchain Tauri por plataforma:
  - macOS: Xcode Command Line Tools
  - Windows: Microsoft C++ Build Tools + WebView2 Runtime

Comandos:

```bash
pnpm install
pnpm dev
pnpm tauri dev
pnpm lint
pnpm format:check
pnpm test
pnpm test:e2e
pnpm test:tauri:e2e
pnpm check:version
pnpm build
pnpm build:analyze
pnpm tauri build
```

### Versionado

`package.json` es la fuente unica editable para la version de Bruma. Para preparar una nueva version:

```bash
pnpm version minor --no-git-tag-version
pnpm sync:version
pnpm check:version
```

`pnpm sync:version` actualiza automaticamente:

- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`
- `src-tauri/Cargo.lock`

Los comandos `pnpm dev`, `pnpm build` y `pnpm tauri ...` ejecutan esa sincronizacion antes de arrancar.
`pnpm check:version` falla si algun archivo generado quedo desincronizado.

### Tests E2E nativos (Tauri)

El repo tiene dos suites E2E:

- **Web (Playwright)**: `pnpm test:e2e` (corre contra `pnpm dev`).
- **Nativo (Tauri WebDriver / tauri-driver)**: `pnpm test:tauri:e2e` (corre la app Tauri y automatiza el WebView).

#### Requisitos

- **macOS / Windows**:
  - `tauri-driver` instalado en el PATH:

```bash
cargo install tauri-driver --locked
```

- **Windows**: Edge Driver en el PATH (en CI se instala con `msedgedriver-tool`).

- **Linux**:
  - `tauri-driver` necesita `WebKitWebDriver` disponible en PATH.
  - Por defecto, `pnpm test:tauri:e2e` **se salta en Linux** para evitar falsos negativos (ver `tests-tauri/run.js`).

#### Nota sobre CI

Los E2E nativos están pensados para correr en **macOS + Windows** (matriz del job `Tauri` en `.github/workflows/ci.yml`).

### Nota Playwright (primer uso)

Si `pnpm test:e2e` falla con un error tipo “Executable doesn't exist…”, instala los navegadores:

```bash
pnpm exec playwright install chromium
```

Nota para entorno Linux de desarrollo: `cargo check/test` y `pnpm tauri build` pueden fallar si faltan librerias GTK/WebKit (`glib-2.0`, `gobject-2.0`, `gio-2.0`, `gdk-3.0`).

En Ubuntu 24.04, `cargo test` ya fue verificado correctamente tras instalar:

- `libglib2.0-dev`
- `libgtk-3-dev`
- `libsoup-3.0-dev`
- `libwebkit2gtk-4.1-dev`

## Release interno

El workflow de release se dispara con un tag SemVer `vX.Y.Z`. El valor `X.Y.Z` debe coincidir con `package.json`.

```bash
VERSION=$(node -p "require('./package.json').version")
pnpm sync:version
git tag "v$VERSION"
git push origin "v$VERSION"
```

El detalle operativo de firma y QA esta en `docs/RELEASE.md`.

## Calidad y CI

- Frontend: lint + format + unit tests + build
- E2E: smoke Playwright
- Tauri matrix: macOS + Windows
- Rust backend: tests validados tambien en Linux con dependencias nativas instaladas
- Artifacts versionados automaticos en CI y Release

## Roadmap

- `v1.1`: reemplazar, exportar HTML, imagenes locales
- `v1.2`: pestanas, preferencias avanzadas, modo enfoque, autoguardado
- `v2.0`: soporte Linux oficial (Ubuntu/Debian/Fedora)

## Sitio web

Hay una pagina de presentacion minima en [`landing/`](landing/) para desplegar en **Vercel**. En cada deploy, el build incorpora el `README.md` y `CHANGELOG.md` de la raiz del mismo commit.

La configuracion vive en [`vercel.json`](vercel.json) en la **raiz del repo** (contexto completo del monorepo), no en `landing/` aislada.

1. **Dashboard:** importar el repo con raiz del proyecto en el repositorio (sin subcarpeta `landing` como Root Directory), o Root Directory vacio.
2. **CLI:** desde la raiz del repo, `vercel` / `vercel --prod` (ver `landing/README.md`).
3. La URL de produccion aparece en el dashboard tras el primer deploy (dominio `*.vercel.app` o alias del proyecto).

Enlace al codigo y releases: [github.com/Mindbreaker81/bruma](https://github.com/Mindbreaker81/bruma).

Sitio desplegado (produccion): [bruma-sigma.vercel.app](https://bruma-sigma.vercel.app).

## Documentacion

- `docs/PRDv2.md`: PRD vigente
- `docs/ARCHITECTURE.md`: arquitectura tecnica
- `docs/SECURITY.md`: decisiones y controles de seguridad
- `docs/TODO.md`: estado por sprints
- `docs/RELEASE.md`: checklist de release/firma/QA
- `CHANGELOG.md`: historial de cambios
- `landing/README.md`: sitio de presentacion (Vercel)

## Licencia

[MIT](LICENSE)
