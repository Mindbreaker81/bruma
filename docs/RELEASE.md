# Release

## Objetivo

Generar bundles distribuibles para **macOS, Windows y Linux** desde un tag SemVer. macOS sale firmado con Developer ID y notarizado por Apple; Windows y Linux salen sin firma todavía (avisarán Gatekeeper/SmartScreen, pero el bundle es válido).

## Publicación (GitHub Releases)

1. Actualizar la version en `package.json` con SemVer y sincronizar metadata:

```bash
pnpm version patch --no-git-tag-version
pnpm sync:version
pnpm check:version
```

2. Crear y pushear el tag `vX.Y.Z` desde la version sincronizada:

```bash
VERSION=$(node -p "require('./package.json').version")
git tag "v$VERSION"
git push origin "v$VERSION"
```

3. Ejecutar el workflow `Release` (o esperar a que se dispare por tag).
4. Verificar que la GitHub Release contiene los assets esperados.
5. Probar los bundles en maquinas reales antes de anunciar/publicar ampliamente.

`package.json` es la fuente unica editable de version. `pnpm sync:version` actualiza automaticamente `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml` y `src-tauri/Cargo.lock`. `pnpm check:version` falla si alguno queda desincronizado.

### Assets esperados (por release `vX.Y.Z`)

- **macOS** (firmado + notarizado):
  - `bruma-vX.Y.Z-macos-aarch64.dmg`
- **Windows x64 (instaladores)**:
  - `bruma-vX.Y.Z-windows-x64.msi`
  - `bruma-vX.Y.Z-windows-x64-setup.exe`
- **Windows portable-full**:
  - `bruma-vX.Y.Z-windows-x64-portable-full.zip`
  - `bruma-vX.Y.Z-windows-arm64-portable-full.zip`
- **Linux**:
  - `bruma-vX.Y.Z-linux-x86_64.AppImage`

> El runner `macos-13` (Intel) está fuera del matrix porque GitHub está retirando ese pool y los jobs quedaban en `queued` indefinidamente. La build `macos-aarch64` corre en Intel vía Rosetta 2.

## Firma macOS — flujo automático en CI

Toda la firma + notarización ocurre en `release.yml` cuando se dispara por tag o `workflow_dispatch`. Lo único que se ha de mantener vivo son las credenciales en GitHub Secrets.

### Secrets requeridos en el repo

| Secret | Origen | Notas |
|---|---|---|
| `APPLE_CERTIFICATE` | `base64 -i bruma_dev_id.p12` | Cert exportado desde Keychain (`Developer ID Application`) |
| `APPLE_CERTIFICATE_PASSWORD` | el que pusiste al exportar el `.p12` | |
| `APPLE_SIGNING_IDENTITY` | `Developer ID Application: <Org> (<TEAM_ID>)` | Cadena exacta de `security find-identity -v -p codesigning` |
| `APPLE_TEAM_ID` | 10 caracteres del Team ID | El de App Store Connect |
| `APPLE_API_KEY` | Key ID de App Store Connect API Key | 10 caracteres |
| `APPLE_API_ISSUER` | Issuer ID (UUID) en *App Store Connect → Integrations* | |
| `APPLE_API_KEY_BASE64` | `base64 -i AuthKey_XXXXX.p8` | El `.p8` solo se descarga **una vez** desde App Store Connect |

### Lo que hace el workflow

1. Step **"Import Apple Developer ID certificate (macOS)"**: crea un keychain temporal, importa el `.p12`, autoriza a `codesign` y `security` con `set-key-partition-list`, y materializa el `.p8` en disco. Inyecta `APPLE_API_KEY_PATH` en `$GITHUB_ENV`.
2. Step **"Build signed & notarized bundle (macOS)"**: ejecuta `pnpm exec tauri build` con las env vars de signing/notarización; Tauri firma el `.app`, lo sube a notarytool, espera `Accepted` y staplea el ticket en `.app` y `.dmg`.

### Verificación local

Antes de tagear, conviene probar el flujo en local con un `.env.local` (gitignored) y `pnpm tauri build`:

```bash
codesign -dv --verbose=4 src-tauri/target/release/bundle/macos/Bruma.app | grep Authority
spctl -a -t exec -vv src-tauri/target/release/bundle/macos/Bruma.app
spctl -a -t open --context context:primary-signature -vv src-tauri/target/release/bundle/dmg/Bruma_*.dmg
```

Las dos llamadas a `spctl` deben responder `accepted` + `source=Notarized Developer ID`.

## Firma Windows (pendiente)

- Requiere certificado Authenticode emitido por CA confiable.
- Firmar `.msi` y/o instalador `.exe` despues del build.
- Validar instalacion en Windows 10 y Windows 11 con WebView2 presente y ausente.

## Checklist MVP

- Build y tests CI en macOS y Windows en verde.
- `cargo test` validado en Linux tras instalar dependencias GTK/WebKit requeridas.
- Abrir `.md` y `.markdown`.
- Crear, editar, guardar y guardar como.
- Preview actualizada tras editar.
- UTF-8 y saltos LF/CRLF preservados.
- Busqueda con navegacion y resaltado.
- Proteccion de cambios sin guardar.
- Tema sistema/claro/oscuro.
- Drag and drop de archivos validos.
- Recientes persistidos.
- Submenu nativo `Archivo > Abrir recientes` abre el archivo correcto sin pasar por popup React.
- Hover en recientes del header muestra el path completo.
- Interfaz en espanol e ingles.
- `Cmd+Q` cierra la app correctamente en macOS.
- Sanitizacion del preview sin ejecucion de scripts.
- Restriccion de lectura/escritura Markdown al home del usuario.
- Pruebas manuales sobre 20+ documentos reales.
- Pruebas macOS 12+ Apple Silicon (también en Intel vía Rosetta 2).
- Pruebas Windows 10/11 x64.
