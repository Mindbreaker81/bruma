# Investigación Flatpak (BRU-14)

Estado: **prototipo compilado e instalado** (2026-09-16). Objetivo: valorar
publicar Bruma en Flathub además de los formatos actuales (`.deb`, `.rpm`,
AppImage).

El manifest de prototipo vive en `flatpak/`:

- `com.mindbreaker81.bruma.yml` — manifest `simple` con runtime GNOME 49,
  extensiones SDK de Rust y Node 20, y red durante el build (solo prototipo;
  para Flathub hay que generar fuentes offline con `flatpak-node-generator` y
  `flatpak-cargo-generator`).
- `com.mindbreaker81.bruma.desktop` — `.desktop` real (el de
  `src-tauri/linux/` es una plantilla con placeholders del bundler).
- `com.mindbreaker81.bruma.metainfo.xml` — metainfo AppStream mínimo; faltan
  capturas (`<screenshots>`) antes de enviar a Flathub.

Verificado en el entorno local (Ubuntu 24.04):

```bash
flatpak-builder --force-clean --user --install-deps-from=flathub \
  --install build-dir flatpak/com.mindbreaker81.bruma.yml
```

- El módulo compila dentro del sandbox: `pnpm install`, `vite build` y
  `cargo build --release` contra el WebKitGTK del runtime GNOME (7 min de Rust).
- `appstreamcli compose` genera los metadatos. Requisito del host:
  `librsvg2-common` (sin el cargador SVG de gdk-pixbuf el compose falla con
  `file-read-error` al procesar `icon.svg`).
- La app se instala (`flatpak list --user`) y arranca con
  `flatpak run com.mindbreaker81.bruma` bajo `xvfb-run` (headless): solo
  warnings benignos de AT-SPI/DRI3.

Verificado en sesión X11 headless (Xvfb + `dbus-run-session` + AT-SPI +
`xclip`, 2026-09-23, build reconstruido con el fix del menú `b15fa38`):

- **Menú nativo dentro del sandbox**: el árbol AT-SPI expone todos los ítems
  (Archivo/Editar/Ver/Idioma/Ayuda). `Seleccionar todo` + `Copiar` escribieron
  el contenido en el portapapeles X11 del host — el camino
  `execute_editing_command` funciona dentro del sandbox.
- **Portal de documentos (abrir)**: `Abrir…` lanza el `FileChooser` de
  `xdg-desktop-portal-gtk`; al elegir `/tmp/test-portal-doc.md` el portal lo
  concede a la app en `/run/user/1000/doc/<id>/test-portal-doc.md` con
  permisos `read write grant-permissions` (`flatpak documents`).
- **Updater**: en la validación de 2026-09-23 el menú aún incluía «Buscar
  actualizaciones»; desde entonces el updater se desactiva en runtime dentro
  del sandbox (ver decisión 1).
- Pendiente de verificar: guardado vía portal (rutas `/run/user/$UID/doc/` no
  persisten entre sesiones salvo bookmarks), matriz por distro y publicación.

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

1. **Updater**: ~~el updater firmado de Tauri **choca** con Flatpak~~ —
   **resuelto**: la app detecta el sandbox en runtime (`/.flatpak-info`,
   `is_flatpak_runtime` en `src-tauri/src/lib.rs`) y entonces **no registra
   el plugin updater**, **oculta «Buscar actualizaciones»** del menú Ayuda y
   **omite la auto-comprobación** y el botón de la barra de formato. La
   actualización la gestiona el sistema (`flatpak update`).
2. **Acceso a archivos**: hoy Bruma abre Markdown desde `~/` y directorios
   concedidos explícitamente (diálogo nativo + scope). En Flatpak la opción
   limpia es el portal de documentos (apertura puntual por archivo concedido);
   `--filesystem=home` es la opción permisiva si el portal no basta para el
   flujo de "abrir carpeta/recientes". Revisar `resolveLocalImages` y el
   guardado junto al documento con rutas del portal (rutas
   `/run/user/$UID/doc/...` no persisten entre sesiones salvo bookmarks).
   Afecta directamente a F9 (pegar imagen del portapapeles): el comando
   `save_pasted_image` escribe un archivo **hermano** del documento y el
   portal solo concede acceso por archivo — en el sandbox fallará salvo
   `--filesystem=home` o que el usuario abra la carpeta completa.
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

1. [x] Prototipo local: manifest en `flatpak/` compilado e instalado con
   `flatpak-builder` (2026-09-16); la app arranca en el sandbox.
   Verificado 2026-09-23: menú nativo funcional en el sandbox (copiar al
   portapapeles X11 del host) y apertura de archivo vía portal de documentos
   (`xdg-desktop-portal-gtk` → grant `read write` en
   `/run/user/1000/doc/<id>/`). Falta guardado vía portal.
2. Pruebas manuales en Ubuntu LTS, Debian estable y Fedora reciente (instalando
   el `.flatpak` resultante).
3. Si el prototipo pasa: generar fuentes offline (node/cargo) y PR de
   publicación a `flathub/flathub` con metainfo completo.
4. Documentar en `README.md` la vía Flatpak junto a AppImage/.deb/.rpm.

## Referencias

- Flathub — requisitos de publicación: https://docs.flathub.org/
- Tauri + Flatpak (guías de la comunidad): https://github.com/flathub
- Portales XDG (documentos): https://flatpak.github.io/xdg-desktop-portal/
