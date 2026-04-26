# Release v1.0.1

## Objetivo

Generar builds sin firmar para QA interno en macOS y Windows, y dejar listo el camino de firma para distribucion publica.

## Builds internos

1. Crear el tag `v1.0.1`.
2. Ejecutar el workflow `Release`.
3. Descargar artefactos `bruma-v1.0.1-macos-latest-unsigned` y `bruma-v1.0.1-windows-latest-unsigned`.
4. Probar los bundles en maquinas reales antes de publicar.

## Firma macOS

- Requiere Apple Developer Program.
- Usar certificado Developer ID Application.
- Activar notarizacion con credenciales de App Store Connect.
- Publicar `.dmg` notarizado cuando Gatekeeper valide el bundle.

## Firma Windows

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
- Pruebas macOS 12+ Apple Silicon e Intel.
- Pruebas Windows 10/11 x64.
