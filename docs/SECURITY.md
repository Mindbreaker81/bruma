# Seguridad

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
