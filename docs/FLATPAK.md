# Investigación Flatpak (BRU-14)

Estado: **manifest de prototipo listo** (2026-09-16). Objetivo: valorar publicar
Bruma en Flathub además de los formatos actuales (`.deb`, `.rpm`, AppImage).

El manifest de prototipo vive en `flatpak/`:

- `com.mindbreaker81.bruma.yml` — manifest `simple` con runtime GNOME 49,
  extensiones SDK de Rust y Node 20, y red durante el build (solo prototipo;
  para Flathub hay que generar fuentes offline con `flatpak-node-generator` y
  `flatpak-cargo-generator`).
- `com.mindbreaker81.bruma.desktop` — `.desktop` real (el de
  `src-tauri/linux/` es una plantilla con placeholders del bundler).
- `com.mindbreaker81.bruma.metainfo.xml` — metainfo AppStream mínimo; faltan
  capturas (`<screenshots>`) antes de enviar a Flathub.

Pendiente de ejecutar (no hay `flatpak-builder` en el entorno actual):

```bash
flatpak-builder --force-clean --user --install-deps-from=flathub \
  --install build-dir flatpak/com.mindbreaker81.bruma.yml
```

## Contexto

Bruma es una app Tauri 2 (Rust + WebKitGTK en Linux). Flatpak/Flathub es la
vía estándar para distribución agnóstica de distro en Linux de escritorio.

## Arquitectura esperada

Una app Tauri en Flatpak corre sobre el runtime `org.gnome.Platform`, que ya
incluye WebKitGTK — no hay que empaquetar WebKit propio. El manifest típico:

```yaml
app-id: eu.mindbreaker81.bruma
runtime: org.gnome.Platform
runtime-version: '47'
sdk: org.gnome.Sdk
command: bruma
finish-args:
  # WebKitGTK necesita IPC compartida o --env=WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS=1
  - --share=ipc
  - --socket=wayland
  - --socket=fallback-x11
  - --share=network          # updater + posibles recursos remotos
  - --device=dri             # aceleración GPU del webview
  - --talk-name=org.freedesktop.Notifications
  # Acceso a documentos: preferir el portal a --filesystem=home
  - --talk-name=org.freedesktop.portal.Documents
```

Módulos: compilar Rust dentro del build (`flatpak-builder` con `cargo` del SDK
extension `org.freedesktop.Sdk.Extension.rust-stable`) y el frontend con Node
(`org.freedesktop.Sdk.Extension.node20`). Tauri genera el binario; el manifest
solo lo instala con `.desktop`, iconos y `appdata.xml`/`metainfo.xml`.

## Decisiones de producto pendientes

1. **Updater**: el updater firmado de Tauri **choca** con Flatpak — la
   actualización la gestiona el sistema (`flatpak update`). Habría que
   desactivar el updater para el build Flatpak (flag de build o feature) o
   aceptar un indicador que solo informe. Recomendación: desactivar el updater
   en Flatpak y apoyarse en el store.
2. **Acceso a archivos**: hoy Bruma abre Markdown desde `~/` y directorios
   concedidos explícitamente (diálogo nativo + scope). En Flatpak la opción
   limpia es el portal de documentos (apertura puntual por archivo concedido);
   `--filesystem=home` es la opción permisiva si el portal no basta para el
   flujo de "abrir carpeta/recientes". Revisar `resolveLocalImages` y el
   guardado junto al documento con rutas del portal (rutas
   `/run/user/$UID/doc/...` no persisten entre sesiones salvo bookmarks).
3. **App ID**: conviene renombrar a un ID RDNN (`eu.mindbreaker81.bruma`) antes
   de publicar; hoy el identificador de `tauri.conf.json` habría que revisarlo.
4. **Metainfo**: Flathub exige `metainfo.xml` con descripción, capturas,
   licencia y `releases`. Es trabajo de contenido, no de código.

## Riesgos conocidos

- **Sandbox de WebKit**: `--share=ipc` suele bastar; en casos problemáticos la
  comunidad usa `WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS=1` (revisores de
  Flathub lo miran con lupa).
- **Drag-and-drop y "abrir con"**: los paths llegan por portal; verificar que
  `handleOpenRecent` y la restauración de sesión toleran rutas de documento
  portalizadas.
- **Menú nativo**: muda/libappindicator en el sandbox — la bandeja/menús ya
  cubiertos por `libayatana-appindicator` deben probarse.
- **Coste de mantenimiento**: cada release implica PR a Flathub (o publicación
  externa con repo propio). Automatizable con `flatpak-github-actions`.

## Siguientes pasos propuestos

1. [~] Prototipo local: manifest creado en `flatpak/` (2026-09-16); falta
   ejecutar `flatpak-builder` y comprobar que la app arranca y que
   abrir/guardar funciona vía portal.
2. Pruebas manuales en Ubuntu LTS, Debian estable y Fedora reciente (instalando
   el `.flatpak` resultante).
3. Si el prototipo pasa: generar fuentes offline (node/cargo) y PR de
   publicación a `flathub/flathub` con metainfo completo.
4. Documentar en `README.md` la vía Flatpak junto a AppImage/.deb/.rpm.

## Referencias

- Flathub — requisitos de publicación: https://docs.flathub.org/
- Tauri + Flatpak (guías de la comunidad): https://github.com/flathub
- Portales XDG (documentos): https://flatpak.github.io/xdg-desktop-portal/
