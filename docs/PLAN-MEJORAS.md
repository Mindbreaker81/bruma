# Plan de mejoras — auditoría julio 2026

Plan de corrección para los hallazgos de [`AUDITORIA-2026-07.md`](./AUDITORIA-2026-07.md).
Las ocho líneas de trabajo quedaron implementadas en la rama de auditoría. El
único gate restante es operativo: publicar una release y comprobar desde
instalaciones reales que `releases/latest` completa la actualización.

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
es un `String` obligatorio. El `update.json` publicado para 1.7.2 usa el formato
estático (`platforms`) y ninguna de sus tres entradas tiene `signature`, por lo
que `check()` falla durante la deserialización antes de poder ofrecer una
descarga. El texto exacto depende de la rama de deserialización del plugin; el
mensaje `the 'signature' field was not set on the updater response` pertenece a
la respuesta dinámica sin `platforms` y no debe citarse como el error exacto de
este manifiesto. La interfaz sí muestra crudo el `message` recibido cuando la
comprobación manual falla.

### Estado de la clave: rotada el 26 de julio de 2026

La privada original no se encontró y la copia guardada en GitHub no era
utilizable sin una contraseña que tampoco se conservaba. Se generó con Tauri CLI
2.10.1 un par nuevo protegido por contraseña. La pública embebida ahora
corresponde al key id `AFC106CF2079DD11`, y GitHub contiene tanto
`TAURI_SIGNING_PRIVATE_KEY` como `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`.

La ejecución aislada
[`Release #37`](https://github.com/Mindbreaker81/bruma/actions/runs/30211787915)
confirmó los tres puntos necesarios: la privada se descifra, Tauri produce el
`.sig` y `minisign` verifica que esa firma corresponde a la pública incorporada
en la aplicación. No se publicó ninguna release durante la prueba.

La rotación implica que **todos los instalados de 1.7.x necesitan reinstalar
manualmente la primera versión que lleve la clave nueva**. Sus binarios conservan
la pública antigua y no pueden validar bundles firmados por el par nuevo. Debe
anunciarse en las notas de la release y en la landing.

### Pasos

1. **Completado: rotar y validar el par.** El nuevo par está protegido por
   contraseña, respaldado fuera del repositorio y verificado criptográficamente
   en GitHub Actions con Tauri CLI 2.10.1.

2. **Completado:** `createUpdaterArtifacts: true` en
   `src-tauri/tauri.conf.json`.

3. **Completado:** recoger y exigir las firmas de cada plataforma.

   - macOS: exigir el `.app.tar.gz` y su `.sig`; el `.dmg` es un instalador para
     descarga manual, no el artefacto preferido por el updater.
   - Linux: exigir el `.AppImage.sig`.
   - Windows x64: exigir y copiar las firmas tanto del `.msi` como del instalador
     NSIS `.exe`; el manifiesto usa el `.msi`.

   Los dos mensajes que hoy toleran la ausencia de artefactos updater deben
   convertirse en fallos, y Windows debe ganar una comprobación equivalente. Un
   release sin todas las firmas esperadas debe romper el pipeline.

4. **Completado: el generador falla igual.**
   `scripts/generate-update-json.mjs` exige las cuatro plataformas soportadas y
   rechaza assets sin `.sig` o firmas vacías.

5. **Completado: Windows ARM64.** El workflow genera un instalador NSIS ARM64
   firmado además del ZIP portable, exige su `.sig`, lo recoge en
   `release-assets` y publica `windows-aarch64` en el manifiesto. macOS Intel no
   se declara soportado porque no existe una entrada de matriz para esa
   arquitectura.

6. **Completado: test de humo del manifiesto.** La prueba local con fixtures
   de las cuatro plataformas confirma que un manifiesto completo se genera y
   que una firma ARM64 ausente se rechaza. La matriz
   [`Release #38`](https://github.com/Mindbreaker81/bruma/actions/runs/30211995558)
   validó los bundles reales y firmas de macOS ARM64, Linux x64 y Windows x64,
   y publicó correctamente el `update.json` estricto de esas plataformas en una
   release borrador:

   - conjunto exacto de plataformas que la release declara soportar;
   - `url` y `signature` no vacíos en todas ellas;
   - que cada URL apunta al tipo de bundle elegido para el updater;
   - que los assets y `.sig` referenciados existen en `release-assets`.

   El nuevo bundle NSIS ARM64 no puede validarse de extremo a extremo localmente:
   debe pasar el siguiente workflow `Release` en GitHub Actions antes de
   publicar. La release de prueba anterior quedó como borrador y no sustituyó a
   `releases/latest`.

7. **Gate de publicación (operativo).** Después de publicar la próxima versión,
   descargar el `update.json` desde el
   endpoint `releases/latest`, verificar de nuevo el esquema y ejecutar una
   comprobación real desde una instalación de la versión anterior en cada
   plataforma soportada. Esta comprobación requiere hacer pública una release y
   no es trabajo de implementación pendiente.

---

## F2 · Persistencia de sesión **[completado]**

**Problema.** `lib/session.ts` usa `sessionStorage`, que en un webview de
escritorio muere con la ventana — exactamente el caso que la función pretende
cubrir.

La sesión usa `localStorage` con la clave
`bruma.session.v2`:

- migra una sola vez la antigua `bruma.session` desde `sessionStorage`;
- conserva la copia antigua si la persistencia falla durante la migración;
- absorbe `QuotaExceededError` y otros fallos de almacenamiento;
- descarta y elimina sesiones de más de siete días;
- limpia ambas claves al confirmar o descartar la recuperación.

El esquema de payload es versión 3: no duplica el documento activo, conserva
completas las pestañas sucias o sin ruta y restaura desde disco las pestañas
limpias con ruta. Las pruebas cubren persistencia, migración, caducidad, datos
inválidos, cuota, limpieza y restauración.

Mover el almacenamiento a `@tauri-apps/plugin-store` queda como posible
evolución si la telemetría o reportes reales muestran errores de cuota; no es
necesario para cerrar el hallazgo.

---

## F3 · Ámbito de archivos fuera del home **[completado]**

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

**Implementación:** se adoptó el enfoque de concesiones por sesión. El home
permanece permitido; los diálogos nativos de apertura, guardado y exportación
conceden únicamente el directorio elegido. Los drops se conceden desde
`WindowEvent::DragDrop` en Rust, de modo que el renderer no puede inventar una
concesión mediante IPC. Las rutas se canonicalizan antes de conceder o validar,
y `read_file`, `save_file` e imágenes relativas mantienen la comprobación.

La prueba de regresión demuestra que una ruta externa se rechaza antes de la
concesión, que el archivo seleccionado funciona después y que un directorio
hermano continúa bloqueado.

---

## F4 · Límite de tamaño y coste por pulsación **[completado]**

### Hechos confirmados

- `read_markdown_file` ya limita la lectura a 10 MB en backend.
- `getTextStats` recibe el contenido en cada cambio. La búsqueda también depende
  del contenido, aunque puede terminar pronto si no hay consulta.
- El índice solo se calcula cuando el TOC está montado y el preview solo en los
  modos que lo muestran; además, el preview ya aplica un debounce de 150 ms. Por
  tanto, no es correcto afirmar que los cuatro trabajos se ejecutan en cada
  pulsación en todos los modos.
- La sesión serializa todas las pestañas 500 ms después de un cambio y además
  repite los datos del documento activo en los campos heredados de nivel
  superior.

La prueba reproducible de 2, 5 y 10 MiB fija un máximo explícito de 500 ms por
operación. Tras sustituir las asignaciones masivas por un recorrido único, una
ejecución de cierre representativa procesó las estadísticas de 10 MiB en
51,3 ms y una búsqueda sin coincidencias en 0,3 ms.

### Trabajo

1. **Completado: medición reproducible.** El test genera documentos de 2, 5 y
   10 MiB, mide estadísticas y búsqueda y aplica un umbral explícito de 500 ms.
   CI ejecuta la misma prueba en macOS, Windows y Linux.

2. **Completado: límite backend independiente de la medición.**
   `MAX_MARKDOWN_BYTES` queda inicialmente en 10 MB. El backend consulta metadata
   antes de reservar, limita la lectura a un byte más que el máximo y comprueba
   de nuevo el tamaño realmente leído. Devuelve `file_too_large`, traducido en
   ambos idiomas, sin eliminar por error la entrada de archivos recientes. Las
   pruebas cubren exactamente el límite y un byte por encima.

3. **Completado: optimizar solo los consumidores medidos.**

   - no calcular coincidencias si la búsqueda está cerrada o vacía;
   - diferir estadísticas con `useDeferredValue`;
   - mantener búsqueda y reemplazo sobre la misma versión del contenido para no
     aplicar posiciones obsoletas;
   - conservar el debounce que ya protege el preview.

4. **Completado: reducir el coste de sesión sin perder recuperación.** Versionar el esquema,
   eliminar la duplicación del documento activo y guardar contenido completo de
   pestañas sucias o sin ruta. Las pestañas limpias con ruta pueden restaurarse
   desde disco. Ajustar el debounce según las mediciones; no descartar el
   contenido de pestañas inactivas que tengan cambios sin guardar.

5. **Completado: verificación.** Añadir pruebas de límite en Rust y una prueba de rendimiento
   reproducible con umbrales explícitos. Comparar las mismas métricas antes y
   después; no usar únicamente el tamaño del bundle o la duración total del test
   como proxy de responsividad.

---

## F5 · i18n del menú nativo **[completado]**

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

**Implementación:** `MenuLabels` y `MenuLabelsState` conservan las etiquetas
activas junto a recientes y disponibilidad de actualización. El frontend las
envía desde `menu.*` al montar y al cambiar `resolvedLanguage`; todas las
reconstrucciones posteriores reutilizan ese estado. El fallback de arranque está
en español correctamente acentuado.

`getDocumentDisplayName` devuelve `null` para documentos sin ruta, y `App` y
`TabBar` traducen `document.untitled` al renderizar. También se corrigieron los
acentos de las preferencias de idioma.

---

## F6 · Imágenes locales en impresión y exportación **[completado]**

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

`resolveLocalImages` se reutiliza en preview, impresión y exportación. La opción
de incrustación es explícita; la impresión siempre resuelve imágenes y limpia el
HTML temporal al finalizar.

---

## F7 · Lote de detalles menores **[completado]**

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

Los siete puntos están implementados y cubiertos por las pruebas existentes o
por regresiones nuevas. CI y release ejecutan ahora formato y clippy con warnings
como errores.

---

## F8 · `App.tsx` y bundle **[completado]**

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

Los cuatro hooks fueron extraídos y `App.tsx` bajó a 1403 líneas. El registro
selectivo de doce lenguajes redujo el chunk Markdown de 282,59 kB a 191,57 kB
(−32 %); el build procesa 2008 módulos frente a 2029.

---

## Cierre

F1–F8 están implementados. Antes de publicar, la release debe pasar la matriz
completa con los cuatro bundles firmados. Después de publicarla, se debe ejecutar
el gate operativo descrito en F1.7 y comunicar que los usuarios de 1.7.x
necesitan una reinstalación manual por la rotación de clave.
