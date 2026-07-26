# Auditoría de Bruma — julio 2026

Revisión de la versión `1.7.2` (commit `562fe3e`). Alcance: frontend React +
CodeMirror, backend Tauri/Rust, persistencia, seguridad del render de Markdown,
build y pipeline de release.

## Estado general

El proyecto está bien construido para su tamaño. La verificación local pasa
completa:

| Comprobación      | Resultado                       |
| ----------------- | ------------------------------- |
| `pnpm test`       | 146 tests, 29 archivos, en verde |
| `pnpm lint`       | Sin avisos (`--max-warnings 0`) |
| `pnpm format:check` | Limpio                        |
| `pnpm build`      | Correcto                        |
| `cargo test`      | No ejecutable en este entorno (faltan GTK/WebKit dev) |

Aciertos que conviene no perder al refactorizar:

- **Sanitización del Markdown bien planteada.** `html: false` en markdown-it,
  DOMPurify con listas blancas explícitas, `ALLOW_DATA_ATTR: false`,
  `FORBID_ATTR: ['style']` y defensa en profundidad contra `javascript:` /
  `vbscript:`. La CSP de `tauri.conf.json` es restrictiva de verdad
  (`script-src 'self'`, `object-src 'none'`, `base-uri 'none'`).
- **Confirmación explícita antes de abrir enlaces externos**, coherente con la
  promesa de "funciona sin conexión".
- **Separación de lógica pura y UI.** `search.ts`, `toc.ts`, `frontmatter.ts`,
  `textStats.ts`, `format.ts` son funciones puras con tests propios; por eso la
  cobertura es alta sin necesidad de montar componentes.
- **`useSplitScrollSync`** cachea el índice línea→elemento e invalida por
  `MutationObserver` en vez de leer layout en cada tick. Es la pieza mejor
  resuelta del repositorio.
- **Restricción de rutas en Rust** con canonicalización previa a la validación,
  lo que resuelve symlinks antes de comprobar el alcance.

---

## Hallazgos

Ordenados por impacto. Los marcados **[corregido]** se arreglan en esta misma
rama; el resto queda documentado con la corrección propuesta.

### 1. El auto-actualizador está roto en producción

`src-tauri/tauri.conf.json` declara `"createUpdaterArtifacts": false` mientras el
plugin `updater` sigue configurado con `pubkey` y endpoint. Como consecuencia,
Tauri no genera ningún `.sig`, y `scripts/generate-update-json.mjs` omite el
campo `signature` del manifiesto (`if (signature)`, línea 81). El workflow de
release lo asume de forma explícita:

```
echo "No .sig file found (updater artifacts disabled)"
```

`UPDATE_SYSTEM_TROUBLESHOOTING.md` lo documenta como "solución temporal" tras un
problema al descifrar la clave minisign.

El efecto para el usuario está confirmado contra el código del plugin
(`tauri-plugin-updater-2.10.1/src/updater.rs`): `ReleaseManifestPlatform.signature`
es un `String` obligatorio. El manifiesto publicado usa el formato estático
`platforms`, y sus tres entradas carecen de ese campo, así que la deserialización
falla antes de ofrecer una descarga. El mensaje exacto citado anteriormente
(`the 'signature' field was not set on the updater response`) corresponde a la
rama dinámica sin `platforms`, no a este manifiesto; la interfaz sí muestra crudo
el `message` recibido cuando una comprobación manual falla. La versión 1.7.2 no
puede llegar a los usuarios de 1.7.x por esa vía.

La clave original se consideró perdida y se rotó el 26 de julio de 2026 con
Tauri CLI 2.10.1. El par nuevo está protegido por contraseña y la pública
embebida corresponde al key id `AFC106CF2079DD11`. La ejecución aislada
[`Release #37`](https://github.com/Mindbreaker81/bruma/actions/runs/30211787915)
confirmó que GitHub descifra la privada, Tauri genera el `.sig` y `minisign`
verifica la firma contra la pública incorporada. No se publicó una release.

La corrección de esta rama activa `createUpdaterArtifacts`, exige y recoge los
`.sig` de macOS, Linux y Windows x64, y hace que tanto el workflow como el
generador fallen ante cualquier asset o firma ausente. La matriz completa
[`Release #38`](https://github.com/Mindbreaker81/bruma/actions/runs/30211995558)
terminó correctamente en sus seis jobs: produjo los bundles reales de macOS
ARM64, Linux x64 y Windows x64 con sus `.sig`, y el generador estricto creó el
`update.json` dentro de una release borrador. Windows ARM64 también compiló, pero
necesita además un bundle instalable por el updater: hoy solo se compila con
`--no-bundle` y se publica un ZIP portable, por lo que añadir
`windows-aarch64` al manifiesto no basta.

La rotación rompe necesariamente la cadena con 1.7.x: la primera versión que
lleve la clave nueva debe distribuirse como reinstalación manual y explicarlo en
las notas de release y en la landing.

### 2. Un enlace relativo en el preview deja la ventana en blanco **[corregido]**

`Preview.tsx` solo interceptaba `http(s):`. Cualquier otro `href` llegaba al
webview: `[nota](./nota.md)` se resolvía contra el origen de la aplicación
(`tauri://localhost/nota.md`), la navegación tenía éxito, y el usuario se
quedaba con una ventana en blanco sin forma de volver salvo reiniciar. Con
autoguardado desactivado eso significa perder el documento.

Corregido cancelando siempre la navegación por defecto y tratando los enlaces
por tipo.

### 3. Los enlaces internos no funcionaban **[corregido]**

markdown-it no genera `id` en los encabezados, así que `[Ver sección](#seccion)`
no llevaba a ninguna parte, ni en el preview ni en el HTML exportado. Es una
carencia visible en un editor de Markdown, sobre todo porque el índice lateral
ya calcula slugs en `lib/toc.ts`.

Corregido con una regla `core` que asigna ids usando exactamente el mismo
`slugify` y la misma numeración de duplicados que el índice, de modo que índice,
preview y export coinciden.

### 4. Path traversal en `read_custom_template` **[corregido]**

```rust
let template_path = config_dir.join("templates").join(format!("{}.md", id));
let canonical_path = resolve_allowed_read_path(&template_path)?;
```

El `id` venía del frontend sin validar, y `resolve_allowed_read_path` solo
comprueba que el destino quede dentro del home. Un `id` como
`../../.ssh/notas` permitía leer cualquier `.md` del home del usuario. La
severidad real es baja (requiere ejecución de código en el renderer, que la CSP
dificulta), pero contradice el modelo descrito en `docs/SECURITY.md`: "evita que
el frontend pueda leer archivos arbitrarios del sistema mediante IPC".

Corregido rechazando ids con separadores, `..` o rutas absolutas.

### 5. La recuperación de sesión no sobrevive a un cierre **[corregido]**

`lib/session.ts` guardaba el borrador en `sessionStorage`. En un webview de
escritorio se perdía al cerrar la ventana, que es exactamente el caso que la
función pretende cubrir.

Corregido con `localStorage` y la clave versionada `bruma.session.v2`, migración
única desde la clave anterior, caducidad de siete días y manejo de errores de
cuota. El plugin `@tauri-apps/plugin-store` queda como fase posterior solo si las
mediciones muestran que la cuota del navegador no es suficiente.

### 6. Ámbito limitado al home: archivos legítimos rechazados **[corregido]**

`is_allowed_path` exige que la ruta canónica empiece por `$HOME`/`%USERPROFILE%`.
La decisión está documentada y es defendible, pero se aplica también a
`open_file_dialog`, es decir, a archivos que **el propio usuario acaba de elegir
en el diálogo nativo del sistema**. En la práctica no se pueden abrir notas en
`/mnt`, `/media`, `/Volumes`, unidades externas, recursos de red ni un segundo
disco en Windows (`D:\`), y el error que ve el usuario es `path_not_allowed` sin
más explicación.

Corregido con concesiones de directorio en memoria por sesión. Los diálogos
nativos y el evento Rust de drag-and-drop conceden la carpeta elegida después de
canonicalizarla. Las rutas recibidas directamente por IPC siguen limitadas al
home y a esas carpetas concedidas; una ruta hermana o inventada continúa
bloqueada. `path_not_allowed` muestra ahora cómo volver a conceder acceso sin
eliminar por error la entrada de recientes.

### 7. El menú nativo está fijo en español

`src-tauri/src/menu.rs` construye todas las etiquetas en literales españoles
("Archivo", "Guardar como...", "Buscar actualizaciones"). La app tiene i18n
completo con selector es/en en la barra y en el propio menú
(`language_es`/`language_en`), pero cambiar a inglés no afecta al menú del
sistema. Además, las cadenas van sin acentos ("Espanol", "Sin recientes"), igual
que `UNTITLED_DOCUMENT_NAME = 'Sin titulo'` en `document.ts`, que sí se muestra
en la interfaz.

Corrección: pasar las etiquetas desde el frontend al reconstruir el menú (ya
existe el mecanismo: `sync_recent_files_menu` reconstruye el menú entero), o
mantener un pequeño catálogo es/en en Rust indexado por el idioma resuelto.

### 8. Sin límite de tamaño al abrir archivos **[backend corregido]**

`read_markdown_file` leía el archivo completo a memoria sin comprobar tamaño.
Ahora rechaza más de 10 MB antes de reservar, acota la lectura y comprueba de
nuevo el tamaño obtenido. El error `file_too_large` tiene traducción y pruebas de
frontera.

Varios consumidores frontend mantienen coste lineal respecto al contenido. Las
estadísticas dependen de cada cambio; la búsqueda puede terminar pronto si no
hay consulta, el índice solo existe cuando el TOC está montado y el preview solo
se monta en los modos correspondientes y ya usa un debounce de 150 ms. Todavía
hay que medir apertura y latencia de escritura antes de seleccionar
optimizaciones frontend.
`useDeferredValue` es una opción para los consumidores cuyo coste se confirme,
pero la búsqueda y el reemplazo deben mantenerse sobre la misma versión del
contenido para evitar posiciones obsoletas.

### 9. La impresión no resuelve las imágenes locales

`Preview.tsx` convierte las rutas relativas a `data:` URLs mediante
`read_image_as_data_url`, pero `handlePrint` renderiza un HTML aparte
(`App.tsx:518`) que no pasa por ese paso. Imprimir o exportar a PDF un documento
con imágenes locales las deja rotas. El mismo problema afecta a
`buildExportHtml`: el HTML exportado conserva rutas relativas que solo funcionan
si el destino queda en la misma carpeta que el original.

Corrección: extraer la resolución de imágenes a una función reutilizable y
aplicarla también en impresión y exportación.

### 10. Detalles menores

- **`printHtml` nunca se limpia** (`App.tsx:342`). Tras imprimir una vez, el
  HTML queda montado en el DOM con `display: none` durante toda la sesión y se
  vuelve a renderizar en cada cambio de estado de `App`.
- **Abrir un archivo ya abierto descarta cambios sin avisar.** `openTab`
  (`files/state.ts:99`) reemplaza el documento de la pestaña existente; si esa
  pestaña tenía modificaciones sin guardar, se pierden en silencio. La
  confirmación de `requestDirtyConfirmation` solo mira la pestaña activa.
- **`resetUntitled` no resetea, añade.** Crea una pestaña nueva. El nombre
  induce a error respecto de lo que hace.
- **`customTemplates` no se valida en `migrateConfig`** (`config.ts:146`): se
  hace un cast directo a `Template[]` mientras el resto de campos se validan uno
  a uno. Un `bruma.config` corrupto se propaga sin filtrar.
- **`generate-update-json.mjs` usa `new URL('..', import.meta.url).pathname`**,
  que en Windows produce `/C:/...`. Debería usar `fileURLToPath`. Hoy solo se
  ejecuta en Ubuntu en CI, así que no rompe nada.
- **`App.tsx` tiene 1555 líneas** y concentra estado de diálogos, atajos,
  autoguardado, sesión, actualizaciones y arrastrar-soltar. Los `useShallow` con
  más de treinta claves son síntoma: extraer `useAutosave`, `useSessionRestore` y
  `useUpdateFlow` a hooks propios reduciría el archivo a la mitad sin cambiar
  comportamiento.
- **El chunk de entrada sigue en 479 kB** tras la corrección de esta rama. El
  siguiente candidato es `highlight.js/lib/common` (~40 lenguajes) dentro del
  chunk de markdown: importar solo los lenguajes habituales bajaría bastante más.
- **`e2e_emit_recent_open` se registra siempre** en `invoke_handler`, aunque
  devuelva error fuera de `debug_assertions`. Compilarlo bajo
  `#[cfg(debug_assertions)]` eliminaría el comando de los binarios de release.

---

## Recomendaciones por orden

1. Arreglar la firma del updater (#1) o retirar la UI que promete actualizar.
2. Mover la sesión a un almacenamiento persistente (#5) — hoy la recuperación
   ante fallos no existe.
3. Permitir abrir archivos elegidos en el diálogo nativo fuera del home (#6).
4. Límite de tamaño al abrir (#8).
5. Localizar el menú nativo (#7).
6. Imágenes locales en impresión y exportación (#9).

El plan de corrección detallado, con enfoque técnico, esfuerzo y orden de
entrega para cada punto, está en [`PLAN-MEJORAS.md`](./PLAN-MEJORAS.md).
