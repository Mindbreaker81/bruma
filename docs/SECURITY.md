# Seguridad

## Revision pre-publica (2026-05-01)

Antes de hacer publico el repositorio se ejecuto una revision orientada a secretos y superficie expuesta:

| Herramienta | Version | Resultado |
|-------------|---------|-----------|
| gitleaks | 8.30.1 | Sin fugas en historial (`detect`, ~70 commits) |
| trufflehog | 3.95.2 | Sin hallazgos en `git` desde el commit raiz |
| `pnpm audit --prod` | (lockfile vigente) | Sin vulnerabilidades conocidas |
| `cargo audit` | no instalado en el entorno | **Pendiente:** ejecutar en CI o local antes de releases |

Revision manual breve:

- No hay archivos rastreados con extensiones tipicas de credenciales (`.env`, `.pem`, keystores, etc.).
- Workflows `.github/workflows/*.yml` no contienen tokens en claro; usan permisos de `GITHUB_TOKEN` donde aplica.
- El job `Tauri` en CI declara `permissions: contents: write` para publicar artifacts; es mas amplio que el frontend job; valorar restringir a `contents: read` en PRs si GitHub lo permite para tu flujo de uploads.

Recomendaciones al publicar:

- Confirmar que `.env` y `.env.*` siguen ignorados y que ningun colaborador sube secretos en commits.
- Ejecutar `cargo audit` periodicamente en `src-tauri/`.
- Volver a correr gitleaks/trufflehog tras cambios grandes en CI o en scripts de release.

## Sistema de archivos

Bruma restringe las operaciones de lectura y escritura Markdown del backend Tauri al home del usuario actual.

Reglas aplicadas en `src-tauri/src/commands/fs.rs`:

- Los paths de lectura se canonicalizan antes de abrir el archivo.
- Los paths de escritura se canonicalizan sobre el archivo existente o sobre su directorio padre si el archivo aun no existe.
- Los symlinks se resuelven antes de validar el alcance.
- Solo se permite operar sobre paths cuyo destino final quede dentro del home del usuario.
- Los intentos fuera de ese alcance devuelven `path_not_allowed`.

Esto reduce el riesgo de path traversal y evita que el frontend pueda leer o sobrescribir archivos arbitrarios del sistema mediante IPC.

## Validacion

- Tests Rust de traversal ejecutados correctamente en Ubuntu 24.04.
- Casos cubiertos: lectura valida en home, rechazo de paths absolutos del sistema y rechazo de escrituras fuera del home.
- Dependencias nativas usadas para habilitar `cargo test`: `libglib2.0-dev`, `libgtk-3-dev`, `libsoup-3.0-dev`, `libwebkit2gtk-4.1-dev`.
