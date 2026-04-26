# PRD — Bruma · Editor Markdown de Escritorio

- **Versión:** 2.0
- **Estado:** Borrador aprobado para iniciar implementación
- **Fecha:** 2026-04-26
- **Producto:** Bruma
- **Plataformas objetivo MVP:** macOS, Windows
- **Plataformas roadmap (post-MVP):** Linux (Ubuntu, Debian, Fedora)
- **Tipo de producto:** Aplicación de escritorio nativa
- **Posicionamiento:** Editor Markdown ligero, local-first, rápido y simple

---

## 0. Cambios respecto a v1

- Se incorpora el nombre de producto: **Bruma**.
- Se concreta el stack tecnológico (Tauri 2.x + React + CodeMirror 6 + markdown-it).
- Se añade roadmap explícito de Linux post-MVP (Ubuntu, Debian, Fedora).
- Se especifica el dialecto Markdown soportado (CommonMark + GFM acotado).
- Se fijan políticas de codificación (UTF-8) y de saltos de línea.
- Se añade política expresa de telemetría: **ninguna**.
- Se incluye sección de distribución, firma y notarización por plataforma.
- Se añade estrategia de internacionalización (es / en).
- Se reescribe en formato Markdown limpio y navegable.
- Se añaden objetivos de rendimiento medibles.
- Se añade matriz de soporte Markdown.
- Se añade estrategia de pruebas a alto nivel.
- Se añade política de actualización (manual en MVP, auto-update opcional post-MVP).

---

## 1. Resumen del producto

Bruma es una aplicación de escritorio multiplataforma para abrir, leer, editar y previsualizar archivos Markdown (`.md`, `.markdown`) de forma rápida y sencilla, sin dependencia de la nube ni de formatos propietarios.

El producto se centra en:

- Edición básica de texto Markdown.
- Vista previa renderizada en tiempo real.
- Apertura y guardado de archivos locales.
- Búsqueda dentro del documento.
- Experiencia simple, sin colaboración ni sincronización.

**Propuesta de valor:** un editor que hace muy bien lo esencial (abrir, leer, editar, buscar, guardar, previsualizar) en un binario pequeño y arranque inmediato, frente a suites recargadas.

---

## 2. Problema

Editores Markdown actuales presentan habitualmente una o varias de estas barreras:

- Demasiado complejos para uso básico.
- Exceso de funciones no necesarias.
- Interfaz recargada.
- Consumo elevado de recursos (RAM, disco).
- Dependencia de la nube o de formatos propietarios.
- Tiempos de arranque largos.

Hay espacio para un editor que destaque por hacer lo esencial muy bien y mantenerse fuera del camino del usuario.

---

## 3. Objetivos

### 3.1 De negocio

- Lanzar una app estable con alcance controlado.
- Validar interés por una herramienta Markdown simple, rápida y local.
- Crear una base mantenible para iteraciones futuras.

### 3.2 De producto

- Permitir abrir y editar archivos Markdown locales sin fricción.
- Ofrecer vista raw, vista renderizada y vista dividida.
- Permitir búsqueda rápida dentro del documento.
- Mantener experiencia fluida en documentos pequeños y medianos (hasta 5 MB).
- Minimizar la complejidad de uso.
- Mantener el binario y el consumo de recursos lo más bajo posible.

### 3.3 De usuario

El usuario debe poder, con esfuerzo mínimo:

- Abrir un `.md`.
- Leerlo cómodamente.
- Editarlo.
- Ver el resultado renderizado.
- Buscar texto.
- Guardar los cambios con confianza.

---

## 4. No-objetivos

Quedan **fuera** del MVP y del horizonte cercano:

- Colaboración en tiempo real.
- Sincronización en la nube.
- Base de datos o gestión de "vaults" tipo Obsidian.
- Edición WYSIWYG completa.
- Plugins o sistema de extensiones.
- Soporte para múltiples cursores.
- Control de versiones interno.
- Comentarios o anotaciones colaborativas.
- App móvil.
- Publicación web integrada.
- Soporte de todos los dialectos Markdown existentes (MDX, Obsidian, Pandoc, etc.).
- Telemetría o analítica de uso.
- IA integrada / asistencia generativa.

---

## 5. Usuarios objetivo

### 5.1 Usuario principal

Persona técnica o semitécnica que usa Markdown para notas, documentación, artículos, READMEs o textos estructurados.

### 5.2 Perfiles típicos

- Desarrolladores.
- Redactores técnicos.
- Estudiantes.
- Investigadores.
- Usuarios que escriben documentación local.
- Usuarios que quieren una app simple de lectura/escritura Markdown.

### 5.3 Anti-perfiles (para los que **no** está pensada)

- Equipos que necesitan colaboración en tiempo real.
- Usuarios que viven en la nube y necesitan sync multi-dispositivo gestionado por la app.
- Usuarios que buscan un IDE Markdown extensible vía plugins.

---

## 6. Casos de uso principales

1. Abrir un archivo `.md` desde el disco y leerlo.
2. Editar el contenido raw del archivo.
3. Ver la previsualización renderizada en tiempo real.
4. Buscar una palabra o frase dentro del documento.
5. Guardar el documento sobrescribiendo el archivo actual.
6. Guardar una copia con "Guardar como".
7. Abrir un archivo arrastrándolo sobre la ventana.
8. Cerrar la app sin perder cambios no guardados (con confirmación).
9. Reabrir un archivo desde la lista de recientes.
10. Alternar entre tema claro y oscuro.

---

## 7. Propuesta de valor

> "Un editor Markdown de escritorio, ligero y local, que cubre lo esencial muy bien: abrir, editar, buscar, previsualizar y guardar."

**Diferenciales:**

- Simple de usar, sin tutorial.
- Rápido de abrir (objetivo: < 1 s arranque en frío en hardware moderno).
- Binario pequeño (objetivo: < 20 MB instalado, gracias a Tauri).
- Sin distracciones, foco en contenido.
- Local-first estricto (sin red salvo apertura de enlaces externos por petición explícita del usuario).
- Multiplataforma real (mismo comportamiento en macOS y Windows; Linux en roadmap).

---

## 8. Alcance

### 8.1 MVP — funcionalidades incluidas

#### Gestión de archivos

- Abrir archivo `.md` / `.markdown` desde menú o diálogo del sistema.
- Soporte de drag & drop sobre la ventana para abrir archivos.
- Guardar archivo actual (sobrescritura).
- Guardar como (nuevo nombre / ubicación).
- Crear documento nuevo vacío.
- Lista básica de archivos recientes (últimos 10).

#### Edición

- Editor raw de Markdown (CodeMirror 6).
- Soporte estándar: copiar, cortar, pegar, deshacer, rehacer, seleccionar todo.
- Atajos de teclado estándar por plataforma (`Cmd` en macOS, `Ctrl` en Windows/Linux).
- Resaltado de sintaxis Markdown en el editor.

#### Visualización

- Modo solo editor.
- Modo solo preview.
- Modo dividido (editor + preview lado a lado).
- Actualización de preview con debounce (~150 ms) para no bloquear la edición.

#### Búsqueda

- Buscar texto dentro del documento actual.
- Navegación entre coincidencias: siguiente / anterior.
- Resaltado visual de coincidencias y de la coincidencia activa.
- Opción de sensible a mayúsculas/minúsculas.
- Cierre del panel con `Esc`.

#### Estado del documento

- Detección de cambios no guardados (`isDirty`).
- Indicador visual en el título de la ventana y en barra inferior.
- Confirmación al cerrar si hay cambios sin guardar (Guardar / Descartar / Cancelar).
- Confirmación al abrir otro archivo si hay cambios sin guardar.

#### Interfaz

- Tema claro y oscuro (manual; respeta preferencia del SO en primer arranque).
- Diseño limpio con foco en lectura/escritura.
- Barra superior con menú nativo de la plataforma.
- Barra inferior con: nombre de archivo, estado guardado/no guardado.

#### Internacionalización

- Idiomas en MVP: **español (es)**, **inglés (en)**.
- Detección inicial por preferencia del SO; modificable desde menú.

### 8.2 V1.1 — deseable

- Reemplazar texto.
- Índice de encabezados (TOC) navegable.
- Exportar a HTML.
- Exportar a PDF (vía render del SO o impresión a PDF).
- Scroll sincronizado entre editor y preview.
- Ajuste de tamaño de fuente (zoom de UI y/o de contenido).
- Apertura de enlaces externos desde preview en navegador del SO (con confirmación).
- Soporte básico de imágenes locales referenciadas por ruta relativa.
- Conteo de palabras y caracteres en barra inferior.

### 8.3 V1.2+ — futuras

- Pestañas múltiples.
- Preferencias avanzadas (fuente, tema personalizado, atajos).
- Modo enfoque.
- Atajos configurables.
- Vista de estructura del documento (panel TOC permanente).
- Estadísticas avanzadas del documento.
- Autoguardado opcional.
- Recuperación de sesión (reabrir últimos archivos al iniciar).
- Soporte parcial de frontmatter YAML (mostrar/ocultar, parseo básico).
- Plantillas de documentos.

### 8.4 Roadmap de plataforma

- **MVP (v1.0):** macOS (Apple Silicon + Intel), Windows 10/11 x64.
- **v1.x:** mantenimiento y mejoras sobre macOS/Windows.
- **v2.0 (objetivo):** soporte oficial Linux:
  - Ubuntu LTS (22.04+).
  - Debian estable.
  - Fedora reciente (último estable).
  - Empaquetado: AppImage + `.deb` + `.rpm`. Flatpak como objetivo deseable.
- **No comprometido:** ARM Linux, otras distros, BSDs.

---

## 9. Requisitos funcionales

### 9.1 Archivos

- **RF-01 Abrir archivo.** El usuario podrá abrir un archivo desde el SO.
  - Acepta `.md`, `.markdown`. Opcionalmente `.txt` (asume Markdown).
  - Si el archivo no se puede leer, mensaje de error claro y la app sigue operativa.
  - Codificación de lectura: **UTF-8** (con o sin BOM). Si se detecta otra, se informa al usuario y se intenta UTF-8 best-effort.
- **RF-02 Drag & drop.** Arrastrar un archivo sobre la ventana lo abre. Si hay cambios sin guardar, se aplica RF-19.
- **RF-03 Guardar.** Sobrescribe la ruta actual. Si es nuevo documento sin ruta, equivale a RF-04.
  - Codificación de escritura: **UTF-8 sin BOM**.
  - Saltos de línea: se preserva el estilo detectado al abrir (LF / CRLF). Documentos nuevos: LF en macOS/Linux, LF en Windows también (configurable post-MVP).
- **RF-04 Guardar como.** Diálogo nativo. Sufijo `.md` por defecto.
- **RF-05 Nuevo documento.** Crea buffer vacío sin ruta asociada.
- **RF-06 Archivos recientes.** Lista persistente con últimos 10 archivos abiertos. Entradas cuyo archivo ya no existe se marcan o se eliminan.

### 9.2 Edición

- **RF-07 Editor raw.** Área editable con contenido Markdown en texto plano y resaltado de sintaxis.
- **RF-08 Operaciones básicas.** Copiar, cortar, pegar, deshacer, rehacer, seleccionar todo.
- **RF-09 Atajos.** La app respeta los atajos estándar del sistema:

  | Acción         | macOS                     | Windows / Linux           |
  | -------------- | ------------------------- | ------------------------- |
  | Nuevo          | `Cmd + N`                 | `Ctrl + N`                |
  | Abrir          | `Cmd + O`                 | `Ctrl + O`                |
  | Guardar        | `Cmd + S`                 | `Ctrl + S`                |
  | Guardar como   | `Cmd + Shift + S`         | `Ctrl + Shift + S`        |
  | Buscar         | `Cmd + F`                 | `Ctrl + F`                |
  | Deshacer       | `Cmd + Z`                 | `Ctrl + Z`                |
  | Rehacer        | `Cmd + Shift + Z`         | `Ctrl + Y` / `Ctrl+Shift+Z` |
  | Seleccionar todo | `Cmd + A`               | `Ctrl + A`                |
  | Cerrar ventana | `Cmd + W`                 | `Ctrl + W`                |
  | Salir          | `Cmd + Q`                 | `Alt + F4`                |

### 9.3 Vista previa

- **RF-10 Renderizado Markdown.** Ver matriz de soporte en sección 12.
- **RF-11 Modos de visualización.** Solo editor, solo preview, dividido. Persistir el modo entre sesiones.
- **RF-12 Preview en tiempo real.** Actualización con debounce ~150 ms tras último cambio. La edición nunca debe bloquearse esperando al preview.

### 9.4 Búsqueda

- **RF-13 Buscar en documento.** Panel de búsqueda no modal sobre el editor.
- **RF-14 Navegación.** Siguiente / anterior por teclado y por botones.
- **RF-15 Resaltado.** Coincidencias resaltadas; coincidencia activa con énfasis distinto.
- **RF-16 Mayúsculas/minúsculas.** Toggle case-sensitive.
- **RF-16.1 Cierre del panel.** `Esc` cierra el panel y devuelve foco al editor.

### 9.5 Estado y seguridad de cambios

- **RF-17 Detección de modificación.** El estado `isDirty` cambia en cuanto el contenido difiere del último persistido.
- **RF-18 Confirmación al cerrar.** Si `isDirty`, diálogo con tres opciones: Guardar / Descartar / Cancelar.
- **RF-19 Confirmación al abrir / cambiar archivo.** Mismo diálogo si `isDirty` antes de reemplazar el documento actual.

### 9.6 Configuración

- **RF-20 Preferencias mínimas.** Tema (claro/oscuro/sistema) e idioma (es/en/sistema). Persistencia entre sesiones.

---

## 10. Requisitos no funcionales

- **RNF-01 Rendimiento.**
  - Arranque en frío: **< 1 s** percibido en hardware moderno (M1+, Intel i5 8.ª gen+).
  - Apertura de documento típico (< 100 KB): **< 100 ms**.
  - Edición sin lag perceptible (< 16 ms por keystroke) hasta 1 MB.
  - Documentos hasta 5 MB siguen siendo utilizables aunque algunas mejoras (preview vivo) puedan degradarse a actualización manual.
  - Uso de RAM en reposo con documento típico: **< 200 MB**.
- **RNF-02 Tamaño de binario.** Instalado: **< 20 MB** objetivo, **< 30 MB** límite duro.
- **RNF-03 Usabilidad.** Interfaz clara, sin saturación. Flujo principal entendible sin tutorial. Funciones esenciales accesibles por menú **y** por atajo.
- **RNF-04 Estabilidad.** No pérdida de datos ante acciones normales. Errores de I/O con mensajes claros. Crashes < 0.1% de sesiones.
- **RNF-04 Compatibilidad.**
  - macOS 12 (Monterey) o superior, x86_64 y arm64 (Apple Silicon M1/M2/M3). Se distribuirá como universal binary (un solo `.app` compatible con ambas arquitecturas).
  - Windows 10 (build 19041+) y Windows 11, x86_64.
  - WebView del sistema: WebKit (macOS), WebView2 (Windows). Se asume disponible en versiones soportadas; en Windows se documenta el bootstrapper de WebView2 para edge cases.
- **RNF-06 Seguridad.**
  - Sanitización del HTML derivado de Markdown con DOMPurify (allowlist conservadora).
  - **No** ejecución de `<script>` ni HTML embebido peligroso del archivo.
  - Apertura de enlaces externos: solo bajo acción explícita del usuario, vía API del SO (no en webview interno).
  - Capacidades de Tauri restringidas al mínimo necesario (allowlist de filesystem, dialog, shell.open).
- **RNF-07 Privacidad.**
  - Local-first estricto en MVP.
  - **Sin telemetría**, sin analítica, sin reporting automático de errores.
  - Sin auto-update en MVP (descargas manuales). Auto-update opt-in se evalúa para v1.x.
- **RNF-08 Accesibilidad.**
  - Navegación completa por teclado de los flujos principales.
  - Contraste AA (WCAG 2.1) en ambos temas.
  - Tamaños de texto legibles, escalables.
  - Roles ARIA correctos en componentes no nativos.
- **RNF-09 Internacionalización.**
  - Todos los textos visibles vía catálogo i18n.
  - Soporte inicial: `es-ES`, `en-US`.
  - Estructura preparada para añadir más sin cambios de código.

---

## 11. UX / UI

### 11.1 Principios de diseño

- Simplicidad.
- Velocidad.
- Claridad.
- Bajo ruido visual.
- Foco en contenido.
- Tipografía cómoda para lectura prolongada.

### 11.2 Estructura de pantalla

#### Barra superior / menú

- **Archivo**: Nuevo, Abrir, Guardar, Guardar como, Recientes, Salir.
- **Editar**: Deshacer, Rehacer, Cortar, Copiar, Pegar, Seleccionar todo, Buscar.
- **Ver**: Solo editor, Solo preview, Dividido, Tema (Claro/Oscuro/Sistema).
- **Idioma**: es / en / Sistema.
- **Ayuda**: Acerca de, Versión, Repositorio.

#### Área principal

Según modo: editor raw, preview, o ambos en columnas.

#### Barra inferior

- Nombre del archivo (o "Sin título").
- Indicador `●` cuando `isDirty`.
- Posición línea/columna (visible en modos editor y dividido).
- (V1.1) Conteo palabras/caracteres.

### 11.3 Comportamientos UX clave

- Escribir nunca bloquea la UI; la preview se actualiza con debounce.
- Cerrar con cambios siempre pasa por confirmación (no destructivo por defecto).
- Archivos no válidos: error claro, app sigue operativa con buffer anterior.
- Archivos grandes (> 1 MB): la preview puede caer a "actualizar manualmente"; la edición sigue fluida.
- Drag & drop: feedback visual durante el arrastre.
- Tema: el cambio aplica inmediatamente sin recarga.

---

## 12. Matriz de soporte Markdown

Bruma soporta **CommonMark** + un subconjunto controlado de **GFM** (GitHub Flavored Markdown).

| Característica          | Soporte MVP | Notas                                         |
| ----------------------- | ----------- | --------------------------------------------- |
| Encabezados `#`..`######` | Sí        | Generan IDs para futura vista TOC.            |
| Párrafos                | Sí          |                                               |
| Negrita / cursiva       | Sí          |                                               |
| Listas ordenadas        | Sí          |                                               |
| Listas desordenadas     | Sí          |                                               |
| Listas anidadas         | Sí          |                                               |
| Task lists `- [ ]`      | Sí (GFM)    | Solo lectura visual; toggleable en V1.1+.     |
| Enlaces                 | Sí          | Apertura externa con confirmación (V1.1).     |
| Imágenes locales        | V1.1        | Por ruta relativa al archivo.                 |
| Imágenes remotas        | V1.1        | Carga sujeta a confirmación (privacidad).     |
| Bloques de código       | Sí          | Resaltado de sintaxis vía `highlight.js`.       |
| Inline code             | Sí          |                                               |
| Citas (`>`)             | Sí          |                                               |
| Tablas                  | Sí (GFM)    | Tablas básicas.                               |
| Tachado `~~`            | Sí (GFM)    |                                               |
| Autolinks               | Sí (GFM)    |                                               |
| HTML embebido           | Sanitizado  | Allowlist conservadora vía DOMPurify.         |
| Frontmatter YAML        | V1.2+       | En MVP, se muestra como texto.                |
| Math (KaTeX/MathJax)    | No          | Fuera de alcance.                             |
| Mermaid / diagramas     | No          | Fuera de alcance.                             |
| Footnotes               | No          | Evaluable en V1.1.                            |

---

## 13. Historias de usuario

- **HU-01.** Como usuario, quiero abrir un archivo Markdown desde mi ordenador para leerlo o editarlo.
- **HU-02.** Como usuario, quiero ver el Markdown renderizado para comprobar cómo quedará el documento final.
- **HU-03.** Como usuario, quiero alternar entre raw y preview para trabajar más cómodamente.
- **HU-04.** Como usuario, quiero editar el texto del documento para actualizar su contenido.
- **HU-05.** Como usuario, quiero buscar palabras o frases dentro del documento para encontrar información rápido.
- **HU-06.** Como usuario, quiero guardar mis cambios para no perder trabajo.
- **HU-07.** Como usuario, quiero recibir una advertencia si voy a cerrar un documento no guardado.
- **HU-08.** Como usuario, quiero arrastrar un archivo a la ventana para abrirlo de forma rápida.
- **HU-09.** Como usuario, quiero que la app respete el tema oscuro/claro de mi sistema.
- **HU-10.** Como usuario, quiero usar la app en español o en inglés según mi preferencia.
- **HU-11.** Como usuario, quiero reabrir mis archivos recientes sin tener que navegar de nuevo.

---

## 14. Criterios de aceptación del MVP

El MVP se considerará listo cuando, en macOS y Windows, simultáneamente:

- La app abra archivos `.md` y `.markdown` correctamente.
- El usuario pueda crear, editar y guardar documentos.
- La preview renderizada refleje cambios en < 200 ms tras dejar de teclear.
- "Guardar" y "Guardar como" funcionen con codificación UTF-8 y preserven saltos de línea.
- La búsqueda funcione con navegación entre resultados y resaltado visible.
- La app detecte cambios no guardados y proteja al usuario en cierre y cambio de archivo.
- La app respete el tema del sistema y permita override manual.
- Drag & drop abra archivos válidos.
- La lista de recientes muestre y abra los últimos archivos.
- La interfaz esté disponible en español e inglés.
- El tiempo de arranque en frío sea < 1 s en hardware de referencia.
- El binario instalado sea < 30 MB.
- No haya errores bloqueantes en el flujo principal en pruebas manuales sobre 20+ documentos reales.
- La sanitización del HTML del preview impida ejecución de scripts.

---

## 15. Prioridades

### P0 — Imprescindible (MVP)

- Nuevo, abrir, guardar, guardar como.
- Editor raw con resaltado.
- Preview renderizada.
- Modos de vista (editor / preview / dividido).
- Búsqueda con navegación.
- Detección de cambios no guardados + confirmaciones.
- Atajos básicos por plataforma.
- Tema claro / oscuro / sistema.
- i18n es / en.
- Drag & drop.
- Recientes.

### P1 — Muy recomendable (V1.1)

- Reemplazar texto.
- Índice de encabezados.
- Exportar HTML.
- Exportar PDF.
- Scroll sincronizado.
- Apertura de enlaces externos con confirmación.
- Imágenes locales.
- Zoom de fuente.
- Conteo de palabras.

### P2 — Futuro (V1.2+)

- Pestañas múltiples.
- Preferencias avanzadas.
- Modo enfoque.
- Atajos configurables.
- Estadísticas de documento.
- Autoguardado opcional.
- Recuperación de sesión.
- Frontmatter YAML.
- Plantillas.

### P3 — Plataforma (V2.0)

- Soporte oficial Linux (Ubuntu, Debian, Fedora).
- Empaquetado AppImage / `.deb` / `.rpm`.

---

## 16. Distribución, firma y actualización

### 16.1 macOS

- Empaquetado `.app` y `.dmg` vía Tauri bundler.
- **Firma con Developer ID** y **notarización con Apple** para distribución pública (requiere cuenta Apple Developer).
- Para builds internos de desarrollo: sin firma; el usuario debe permitirlo en Preferencias de Seguridad.

### 16.2 Windows

- Empaquetado `.msi` y/o `.exe` (NSIS) vía Tauri bundler.
- **Firma con certificado Authenticode** para reducir avisos de SmartScreen (deseable, no bloqueante para v1.0).
- Dependencia: WebView2. Tauri ofrece bootstrapper para instalarlo si falta.

### 16.3 Linux (post-MVP)

- AppImage (universal).
- `.deb` para Debian / Ubuntu.
- `.rpm` para Fedora.
- Flatpak como objetivo deseable.

### 16.4 Actualizaciones

- **MVP:** descarga manual desde el repositorio / página oficial. La app comprueba contra una versión "última conocida" embebida; sin red.
- **V1.x:** se evaluará auto-update opt-in con servidor de releases firmado (no antes de tener canal estable).

---

## 17. Supuestos de producto

- El usuario trabaja principalmente con archivos locales.
- La mayoría de documentos son pequeños o medianos (< 1 MB).
- El usuario no necesita colaboración ni nube en una primera etapa.
- La app prioriza rapidez y simplicidad frente a extensibilidad.
- Los WebViews del sistema (WebKit / WebView2) están disponibles en las versiones soportadas.

---

## 18. Riesgos y mitigaciones

- **R1 — Scope creep.** Añadir demasiadas funciones convierte la app simple en suite compleja.
  - *Mitigación:* MVP estricto, prioridades P0/P1/P2/P3, sin plugins ni nube en horizonte cercano.
- **R2 — Experiencia de edición pobre.** Un editor demasiado básico se siente limitado.
  - *Mitigación:* CodeMirror 6 como base, atajos completos, undo/redo robusto, búsqueda cómoda.
- **R3 — Variantes de Markdown.** Diferentes dialectos generan expectativas distintas.
  - *Mitigación:* alcance documentado (sección 12), CommonMark + GFM acotado, librería estable (markdown-it).
- **R4 — Distribución macOS.** Sin firma/notarización hay fricción.
  - *Mitigación:* separar builds internas de distribución pública; planificar Apple Developer y notarización antes de distribuir.
- **R5 — WebView2 ausente en Windows.** Algunas instalaciones lo carecen.
  - *Mitigación:* usar bootstrapper de Tauri y documentar el caso.
- **R6 — Rendimiento en documentos grandes.** Preview puede degradarse.
  - *Mitigación:* debounce, render incremental si es posible, fallback a actualización manual sobre umbral configurable (ej. 1 MB).
- **R7 — Accesibilidad insuficiente.** Componentes custom mal implementados.
  - *Mitigación:* uso de primitivas accesibles (Radix u otra), test manual con teclado, contraste AA.
- **R8 — Lock-in con stack.** Cambiar de framework es caro.
  - *Mitigación:* aislar lógica de dominio (parseo Markdown, modelo de documento) del framework UI.

---

## 19. Métricas de éxito

> En coherencia con la política sin telemetría, las métricas cuantitativas se obtienen en pruebas internas y feedback explícito. **No** se envían datos del usuario.

### 19.1 De producto (medibles internamente o con beta testers)

- Tiempo medio de arranque en hardware de referencia.
- Tiempo de apertura de documento típico.
- Memoria en reposo con documento abierto.
- Tamaño del binario instalado.
- Tasa de crashes en sesiones de prueba.
- Cobertura de criterios de aceptación.

### 19.2 Cualitativas (encuesta a beta testers)

- Percepción de rapidez.
- Facilidad de uso (1–5).
- Claridad de la interfaz (1–5).
- Utilidad del preview (1–5).
- Net Promoter Score informal.

---

## 20. Roadmap

### Fase 1 — MVP (v1.0)

Nuevo, abrir, guardar, guardar como, editor raw, preview, modos de vista, búsqueda, cambios no guardados, tema, drag & drop, recientes, i18n es/en. macOS + Windows.

### Fase 2 — Productividad (v1.1)

Reemplazar, índice de encabezados, exportar HTML, exportar PDF, imágenes locales, scroll sincronizado, conteo de palabras, apertura de enlaces externos.

### Fase 3 — Pulido (v1.2)

Pestañas, preferencias avanzadas, modo enfoque, autoguardado opcional, recuperación de sesión, frontmatter YAML básico.

### Fase 4 — Plataforma (v2.0)

Soporte oficial Linux (Ubuntu, Debian, Fedora) con paquetes nativos.

---

## 21. Stack técnico (resumen)

> Detalle completo en `ARCHITECTURE.md`.

- **Shell desktop:** Tauri 2.x (Rust backend + WebView del sistema).
- **UI:** React 18 + TypeScript.
- **Editor:** CodeMirror 6 + extensión Markdown.
- **Renderer Markdown:** markdown-it + plugins GFM acotados.
- **Sanitización:** DOMPurify.
- **Estilos:** Tailwind CSS (con `dark:` y variables CSS para temas).
- **Estado:** mínimo, hooks de React + un store ligero (Zustand) si crece.
- **Persistencia de configuración:** `tauri-plugin-store` (oficial).
- **i18n:** i18next + react-i18next.
- **Build:** Vite (frontend), Cargo + Tauri CLI (bundle).
- **Tests:** Vitest (unit/component), Playwright (E2E sobre webview Tauri o sobre dev server).
- **Versionado:** SemVer estricto.
- **Convención de commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, etc.).

**Por qué Tauri y no Electron:** binario una orden de magnitud menor, menor uso de RAM, mayor coherencia con los objetivos "ligero, rápido". Coste: dependencia del WebView del sistema (asumible en macOS/Windows soportados).

---

## 22. Definición de "hecho"

Una funcionalidad se considera terminada cuando:

- Cumple sus criterios de aceptación.
- Funciona en macOS y Windows con comportamiento consistente.
- Tiene paridad de teclado y menú donde aplique.
- No rompe el flujo principal.
- Maneja errores básicos con mensajes comprensibles y sin perder datos.
- Tiene tests unitarios sobre la lógica de dominio cuando aplique.
- Está validada manualmente con archivos Markdown reales.
- Sus textos visibles están en el catálogo i18n (es/en).
- Su rendimiento cumple los objetivos de RNF-01.

---

## 23. Glosario

- **MVP:** Producto Mínimo Viable.
- **CommonMark:** especificación estándar de Markdown.
- **GFM:** GitHub Flavored Markdown, extensión sobre CommonMark.
- **WebView:** componente del SO que renderiza HTML/CSS/JS.
- **Local-first:** datos del usuario residen y se procesan en su dispositivo.
- **`isDirty`:** estado del documento con cambios no persistidos.
