# Plan de mejoras — auditoría julio 2026

Plan de corrección para los hallazgos de [`AUDITORIA-2026-07.md`](./AUDITORIA-2026-07.md)
que no se resolvieron en la rama de auditoría. Ordenado por impacto sobre el
usuario, no por esfuerzo.

Leyenda de esfuerzo: **S** ≈ medio día · **M** ≈ 1-2 días · **L** ≈ 3-5 días.

| #   | Trabajo                                    | Esfuerzo | Riesgo | Bloquea release |
| --- | ------------------------------------------ | -------- | ------ | --------------- |
| F1  | Firma del updater                          | M        | Alto   | Sí              |
| F2  | Persistencia de sesión                     | S        | Bajo   | No              |
| F3  | Ámbito de archivos fuera del home          | M        | Medio  | No              |
| F4  | Límite de tamaño y coste por pulsación     | S        | Bajo   | No              |
| F5  | i18n del menú nativo                       | M        | Bajo   | No              |
| F6  | Imágenes locales en impresión y exportación| M        | Bajo   | No              |
| F7  | Lote de detalles menores                   | S        | Bajo   | No              |
| F8  | Refactor de `App.tsx` y bundle             | L        | Medio  | No              |

---

## F1 · Firma del updater

**Por qué primero.** Es el único hallazgo que deja a los usuarios instalados sin
camino de actualización. Confirmado contra el código del plugin
(`tauri-plugin-updater-2.10.1/src/updater.rs`): `ReleaseManifestPlatform.signature`
es un `String` obligatorio y la deserialización falla explícitamente con

```
the `signature` field was not set on the updater response
```

Es decir, `check()` lanza y el diálogo de actualización muestra ese texto crudo
al usuario que pulsa «Buscar actualizaciones».

### Decisión previa: ¿se conserva la clave privada original?

La pública embebida en `tauri.conf.json` corresponde al key id `97F1D5CFD8779B7D`.
Antes de nada hay que responder si existe todavía la privada correspondiente,
porque **rotar la clave deja sin auto-actualización a todos los instalados de
1.7.x**: sus binarios llevan la pública antigua y rechazarán cualquier bundle
firmado con otra. En ese caso hay que asumir una reinstalación manual y
anunciarla en las notas de la release y en la landing.

- **Si se conserva** → el problema es solo el formato del secret. Ir a los pasos.
- **Si se perdió** → generar par nuevo, aceptar la ruptura y comunicarla.

### Pasos

1. **Reproducir en local antes de tocar CI.** El error histórico
   (`failed to decode secret key: ... failed to fill whole buffer`) indica un
   valor truncado o remanipulado, no una contraseña incorrecta. Verificar el
   formato exacto antes de volver a subirlo:

   ```bash
   # con createUpdaterArtifacts: true
   TAURI_SIGNING_PRIVATE_KEY="$(cat ~/.tauri/bruma.key)" \
   TAURI_SIGNING_PRIVATE_KEY_PASSWORD="" \
   pnpm tauri build
   ```

   Éxito = aparecen `.sig` junto al AppImage, al `.app.tar.gz` y al `-setup.exe`.
   Solo cuando esto funciona en local se vuelve a cargar el secret, con el mismo
   valor byte a byte (sin saltos de línea añadidos por la interfaz web de GitHub).

2. `createUpdaterArtifacts: true` en `src-tauri/tauri.conf.json`.

3. **Que el workflow falle en lugar de continuar.** Sustituir los dos
   `echo "No .sig file found (updater artifacts disabled)"` de
   `.github/workflows/release.yml` por `exit 1`. Un release sin firmas debe
   romper el pipeline, no publicarse a medias.

4. **Que el generador falle igual.** En `scripts/generate-update-json.mjs`, el
   `if (signature)` de la línea 81 es lo que permite emitir un manifiesto
   inválido. Cambiar a: si un asset existe pero no tiene `.sig`, lanzar.

5. **Cubrir las plataformas que faltan.** `platformCandidates` solo contempla
   `darwin-aarch64`, `linux-x86_64` y `windows-x86_64`. El workflow compila
   además Windows ARM64, que hoy nunca recibiría actualizaciones. Añadir
   `windows-aarch64`. (macOS Intel no se compila en absoluto: el `.dmg` es
   aarch64; si se quiere dar soporte, es otra entrada de matriz.)

6. **Test de humo del manifiesto.** Un test que cargue el `update.json`
   generado y compruebe que cada plataforma tiene `url` y `signature` no vacíos.
   Barato y habría atrapado esto.

### Mitigación mientras tanto

Si F1 no entra en la próxima release, ocultar la UI de actualización
(`UpdateIndicator`, entrada de menú, comprobación al arrancar en `App.tsx:1003`)
tras un flag y dejar solo un enlace a la página de releases. Hoy la app promete
algo que no puede cumplir.

---

## F2 · Persistencia de sesión

**Problema.** `lib/session.ts` usa `sessionStorage`, que en un webview de
escritorio muere con la ventana — exactamente el caso que la función pretende
cubrir.

**Fase A (inmediata, S).** Cambiar a `localStorage`, igual que `lib/config.ts`:

- Clave nueva (`bruma.session.v2`) y lectura única de la antigua para migrar.
- `try/catch` en `writeSession`: hoy no lo hay, y con varias pestañas grandes se
  supera la cuota (~5 MB) — `setItem` lanza `QuotaExceededError` dentro del
  efecto de `App.tsx:1032` y se lleva por delante el guardado de sesión.
- Descartar sesiones con `savedAt` de más de N días al leer (el campo ya existe
  y no se usa para nada).
- Adaptar `lib/session.test.ts`, que ya cubre el contrato.

**Fase B (si hace falta, M).** Mover a `@tauri-apps/plugin-store` — ya es
dependencia y se usa en `updateStore.ts` — que escribe a disco sin cuota. Cuesta
volver `readSession` asíncrono, lo que afecta al efecto de arranque de
`App.tsx:866`; es mecánico pero toca el flujo de restauración.

**Recomendación:** hacer la Fase A ya y medir. Si el uso real son documentos de
notas, `localStorage` sobra.

---

## F3 · Ámbito de archivos fuera del home

**Problema.** `is_allowed_path` rechaza incluso archivos que el usuario acaba de
elegir en el diálogo nativo del sistema. En la práctica no se puede trabajar en
`/mnt`, `/media`, `/Volumes`, unidades externas, recursos de red ni `D:\`, y el
error que ve el usuario es `path_not_allowed` sin explicación.

**Enfoque.** Conservar la propiedad de seguridad real (*el frontend no puede
leer rutas arbitrarias por IPC*) sin castigar la elección explícita del usuario:

1. **La elección en diálogo nativo es consentimiento.** `open_file_dialog` y
   `save_file_dialog` dejan de aplicar `is_allowed_path` sobre lo que el usuario
   acaba de seleccionar; se mantiene la canonicalización y la validación de
   extensión.

2. **Lista de directorios concedidos por sesión.** Un
   `Mutex<HashSet<PathBuf>>` gestionado por Tauri, sembrado con el home. Cada
   selección en diálogo y cada archivo soltado sobre la ventana (evento del SO,
   también acción explícita) añade su directorio padre.

3. **`read_file` / `save_file` por IPC** (recientes, restauración de sesión)
   siguen validando, pero contra la lista concedida en vez de solo el home. Una
   ruta de recientes en un disco externo vuelve a funcionar tras reabrirla una
   vez desde el diálogo; una ruta inventada por el renderer sigue bloqueada.

4. Traducir `path_not_allowed` a un mensaje que explique el motivo
   (`errors.pathNotAllowed` en ambos locales).

5. Actualizar `docs/SECURITY.md`, que hoy describe el modelo anterior, y
   extender los tests de Rust de traversal con los casos nuevos.

**Alternativa más simple** si se prefiere no gestionar estado: eliminar la
restricción para todo lo que venga de diálogo y mantener el home solo para
`read_file`. Menos preciso pero mucho menos código.

---

## F4 · Límite de tamaño y coste por pulsación

**Backend (S).** En `read_markdown_file`, comprobar `fs::metadata(path)?.len()`
antes de leer y rechazar por encima de un umbral (10 MB es holgado para
Markdown) con `file_too_large`. Añadir la clave de error a los dos locales. Hoy
abrir por error un log renombrado a `.md` congela la ventana sin mensaje.

**Frontend (S).** El contenido alimenta cuatro cálculos O(n) en cada cambio del
store — `findSearchMatches`, `getTextStats`, `parseHeadings` y el render del
preview. Envolver el valor que consumen preview, índice y estadísticas en
`useDeferredValue`, dejando el editor sobre el valor inmediato: la escritura
sigue instantánea y el resto se recalcula cuando hay hueco.

**Sesión.** El efecto de `App.tsx:1032` serializa el contenido de *todas* las
pestañas cada 500 ms. Subir el debounce y/o guardar solo la pestaña activa más
los metadatos del resto.

**Verificación.** Añadir un fixture grande (~2 MB) a los tests de Playwright y
medir el tiempo hasta interacción antes y después.

---

## F5 · i18n del menú nativo

**Problema.** `src-tauri/src/menu.rs` tiene las etiquetas fijas en español
mientras la app ofrece selector es/en — incluido dentro del propio menú. Además
van sin acentos («Espanol», «Sin recientes»).

**Enfoque recomendado: las cadenas viven en los JSON de i18n.** El menú ya se
reconstruye entero desde el frontend (`sync_recent_files_menu`,
`set_update_available_menu_state`), así que la vía natural es pasar también las
etiquetas:

1. Struct `MenuLabels` en Rust, gestionado como estado igual que
   `RecentFilesMenuState`.
2. Comando `set_menu_labels(labels)` y bloque `menu.*` en `en.json` / `es.json`.
3. El frontend lo llama al montar y cuando cambia `resolvedLanguage`
   (`App.tsx:896` ya observa ese valor).
4. Fallback en español si nunca llega, para no dejar el menú vacío al arrancar.

Evita duplicar catálogos en Rust y deja a quien traduzca tocando solo JSON.

**Aparte, la misma tanda:** `UNTITLED_DOCUMENT_NAME = 'Sin titulo'`
(`files/document.ts:18`) se muestra en la interfaz sin acento y sin traducir.
`getDocumentDisplayName` es una función pura usada en el store, así que lo limpio
es devolver `null` para documentos sin ruta y traducir en el punto de render.

---

## F6 · Imágenes locales en impresión y exportación

**Problema.** `Preview.tsx` resuelve rutas relativas a `data:` URLs vía
`read_image_as_data_url`, pero ni la impresión (`App.tsx:518`) ni
`buildExportHtml` pasan por ese paso: el PDF sale con imágenes rotas y el HTML
exportado solo funciona si acaba en la misma carpeta que el original.

**Plan.** Extraer la resolución a `lib/images.ts`
(`resolveLocalImages(html, basePath): Promise<string>`), reutilizable desde los
tres sitios. La exportación pasa a ser asíncrona y gana una opción «incrustar
imágenes» en el menú de export; sin ella, el HTML se queda como hoy y pesa poco.

**Nota de tamaño.** Incrustar en base64 infla ~33 %. Con documentos con muchas
capturas conviene avisar o permitir exportar a una carpeta con los assets al
lado, que es la alternativa clásica.

---

## F7 · Lote de detalles menores

Todos independientes, cabe en un solo PR:

- **`printHtml` nunca se limpia** (`App.tsx:342`): tras imprimir una vez queda
  montado el resto de la sesión y se re-renderiza en cada cambio de estado.
  Limpiar cuando el diálogo nativo devuelve el control.
- **`openTab` descarta cambios sin avisar** (`files/state.ts:99`): reabrir un
  archivo que ya tiene pestaña con modificaciones sin guardar las pierde en
  silencio. `requestDirtyConfirmation` solo mira la pestaña activa. Comprobar el
  estado sucio de la pestaña destino antes de reemplazar el documento.
- **`resetUntitled` no resetea, añade una pestaña.** Renombrar a `openUntitledTab`.
- **`customTemplates` sin validar** (`config.ts:146`): cast directo a `Template[]`
  mientras el resto de campos se validan uno a uno.
- **`generate-update-json.mjs`** usa `new URL('..', import.meta.url).pathname`,
  que en Windows produce `/C:/...`. Usar `fileURLToPath`. Hoy solo corre en
  Ubuntu, así que es preventivo.
- **`e2e_emit_recent_open`** se registra siempre en `invoke_handler` aunque
  devuelva error fuera de `debug_assertions`. Compilarlo bajo
  `#[cfg(debug_assertions)]` lo elimina del binario de release.
- **`cargo fmt --check` y `cargo clippy` en CI**: hoy CI solo ejecuta
  `cargo test`, y `fs.rs` ya tiene divergencias de formato acumuladas.

---

## F8 · `App.tsx` y bundle

**`App.tsx` (1555 líneas).** Concentra estado de diálogos, atajos, autoguardado,
sesión, actualizaciones y arrastrar-soltar. Los `useShallow` de más de treinta
claves son el síntoma. Extraer, en este orden y con un PR por hook para que cada
uno sea revisable:

1. `useAutosave` — efecto de `App.tsx:919` más su estado de texto.
2. `useSessionRestore` — efectos de `866` y `1022` más el diálogo.
3. `useUpdateFlow` — los cuatro `useState` de actualización y sus handlers.
4. `useAppShortcuts` — el `keydown` global de `1058`.

Sin cambios de comportamiento; cada paso debe dejar los 146 tests en verde.

**Bundle.** Tras la carga diferida de esta rama, el chunk de entrada está en
479 kB y el de markdown en 282 kB. El siguiente candidato es
`highlight.js/lib/common`, que registra ~40 lenguajes dentro del chunk de
markdown. Registrar solo los habituales en notas (js, ts, json, bash, python,
rust, html, css, sql, yaml, md, diff) debería recortarlo bastante — medir con
`pnpm build:analyze` antes y después en vez de estimar.

---

## Orden sugerido de entrega

1. **Release de corrección**: F1 (o su mitigación) + F2 fase A + F4 backend.
   Es lo que afecta a datos y a la capacidad de actualizar.
2. **Release de usabilidad**: F3 + F5 + F4 frontend.
3. **Mantenimiento continuo**: F6, F7, F8 según haya hueco.
