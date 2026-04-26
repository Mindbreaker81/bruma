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
