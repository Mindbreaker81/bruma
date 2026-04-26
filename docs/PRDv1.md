PRD — Editor Markdown de Escritorio
Versión: 1.0
Estado: Borrador
Plataformas objetivo: macOS, Windows
Tipo de producto: Aplicación de escritorio
Posicionamiento: Editor Markdown ligero, local-first, rápido y simple

1. Resumen del producto
Aplicación de escritorio multiplataforma para abrir, leer, editar y previsualizar archivos Markdown (.md) de forma rápida y sencilla.

El producto estará centrado en:

edición básica de texto Markdown
vista previa renderizada en tiempo real
apertura y guardado de archivos locales
búsqueda dentro del documento
experiencia simple, sin funciones avanzadas de colaboración o sincronización
La propuesta de valor es ofrecer una herramienta ligera y clara para usuarios que quieren trabajar con Markdown sin la complejidad de suites más grandes.

2. Problema
Muchos editores Markdown existentes presentan una o varias de estas barreras:

demasiado complejos para un uso básico
exceso de funciones no necesarias
interfaz recargada
consumo elevado de recursos
dependencia de la nube o de formatos propietarios
Existe espacio para un editor que haga muy bien lo esencial:

abrir
leer
editar
buscar
guardar
previsualizar
3. Objetivos
Objetivos de negocio
Lanzar una aplicación de escritorio útil y estable con alcance controlado.
Validar interés por una herramienta Markdown simple y rápida.
Crear una base mantenible para iteraciones futuras.
Objetivos de producto
Permitir abrir y editar archivos Markdown locales sin fricción.
Ofrecer vista raw y vista renderizada.
Permitir búsqueda rápida dentro del documento.
Mantener una experiencia fluida en documentos de tamaño pequeño y medio.
Minimizar la complejidad de uso.
Objetivos de usuario
El usuario debe poder:

abrir un .md
leerlo cómodamente
editarlo
ver el resultado renderizado
buscar texto
guardar los cambios con confianza
4. No objetivos
Quedan fuera del MVP:

colaboración en tiempo real
sincronización en la nube
base de datos o gestión de “vaults”
edición WYSIWYG avanzada
plugins o extensiones
soporte para múltiples cursores
control de versiones interno
comentarios o anotaciones colaborativas
app móvil
publicación web integrada
soporte completo para todos los dialectos de Markdown existentes
5. Usuarios objetivo
Usuario principal
Persona técnica o semitécnica que usa Markdown para:

notas
documentación
artículos
README
textos estructurados
Perfiles típicos
desarrolladores
redactores técnicos
estudiantes
investigadores
usuarios que escriben documentación local
usuarios que quieren una app simple de lectura/escritura Markdown
6. Casos de uso principales
Abrir un archivo .md desde el disco y leerlo.
Editar el contenido raw del archivo.
Ver la previsualización renderizada en tiempo real.
Buscar una palabra o frase dentro del documento.
Guardar el documento sobrescribiendo el archivo actual.
Guardar una copia con “Guardar como”.
Abrir un archivo arrastrándolo a la ventana.
Cerrar la app sin perder cambios no guardados.
7. Propuesta de valor
“Un editor Markdown de escritorio, ligero y local, que cubre lo básico muy bien: abrir, editar, buscar, previsualizar y guardar.”

Diferenciales:

simple de usar
rápido de abrir
sin distracciones
local-first
multiplataforma
8. Alcance del MVP
8.1 Funcionalidades incluidas en MVP
Gestión de archivos
Abrir archivo .md desde menú o diálogo del sistema.
Soporte de drag & drop para abrir archivos.
Guardar archivo actual.
Guardar como.
Crear documento nuevo vacío.
Lista básica de archivos recientes.
Edición
Editor raw de Markdown.
Soporte para:
copiar
cortar
pegar
deshacer
rehacer
seleccionar texto
Atajos de teclado estándar por plataforma.
Visualización
Vista raw.
Vista renderizada.
Vista dividida: editor + preview lado a lado.
Actualización de preview en tiempo real con pequeño retraso controlado.
Búsqueda
Buscar texto dentro del documento.
Navegar entre coincidencias siguiente/anterior.
Resaltar coincidencias.
Opción de distinguir mayúsculas/minúsculas.
Estado del documento
Detección de cambios no guardados.
Indicador visual de documento modificado.
Confirmación al cerrar si hay cambios sin guardar.
Interfaz
Tema claro y oscuro.
Diseño limpio con enfoque en lectura/escritura.
Panel principal con modos:
solo editor
solo preview
editor + preview
8.2 Funcionalidades deseables para V1.1
reemplazar texto
índice de encabezados
exportar a HTML
exportar a PDF
scroll sincronizado entre editor y preview
ajuste de tamaño de fuente
apertura de enlaces externos desde preview
soporte básico de imágenes locales
8.3 Funcionalidades para versiones futuras
pestañas múltiples
preferencias avanzadas
modo enfoque
atajos configurables
vista de estructura del documento
estadísticas del documento
autoguardado opcional
recuperación de sesión
soporte parcial de frontmatter YAML
plantillas
9. Requisitos funcionales
9.1 Archivos
RF-01 Abrir archivo
El usuario podrá abrir un archivo .md desde el sistema de archivos.

Criterios:

Debe aceptar archivos .md, .markdown y opcionalmente .txt.
Si el archivo no puede leerse, se mostrará un mensaje de error claro.
RF-02 Drag & drop
El usuario podrá arrastrar un archivo Markdown a la ventana para abrirlo.

RF-03 Guardar
El usuario podrá guardar el documento actual en su ruta existente.

RF-04 Guardar como
El usuario podrá guardar el documento con otro nombre o en otra ubicación.

RF-05 Nuevo documento
El usuario podrá crear un documento nuevo vacío.

RF-06 Archivos recientes
La app mostrará una lista de archivos abiertos recientemente.

9.2 Edición
RF-07 Editor raw
La app ofrecerá un área editable con el contenido Markdown en texto plano.

RF-08 Operaciones básicas
El editor soportará:

copiar
cortar
pegar
deshacer
rehacer
seleccionar todo
RF-09 Atajos
La app respetará los atajos estándar del sistema:

Cmd/Ctrl + O abrir
Cmd/Ctrl + S guardar
Cmd/Ctrl + Shift + S guardar como
Cmd/Ctrl + F buscar
Cmd/Ctrl + Z deshacer
Cmd/Ctrl + Shift + Z o Ctrl + Y rehacer
Cmd/Ctrl + N nuevo
9.3 Vista previa
RF-10 Renderizado Markdown
La app renderizará el contenido Markdown a una vista legible.

Soporte mínimo:

encabezados
párrafos
listas
negrita/cursiva
enlaces
bloques de código
citas
tablas básicas si la librería lo permite
RF-11 Modos de visualización
La app ofrecerá:

solo editor
solo preview
editor + preview
RF-12 Preview en tiempo real
La preview se actualizará automáticamente tras cambios en el documento.

9.4 Búsqueda
RF-13 Buscar en documento
El usuario podrá buscar texto dentro del contenido del documento actual.

RF-14 Navegación
El usuario podrá moverse entre coincidencias:

siguiente
anterior
RF-15 Resaltado
La coincidencia actual y el resto de coincidencias deberán resaltarse visualmente.

RF-16 Opción de mayúsculas/minúsculas
La búsqueda podrá ser sensible o no a mayúsculas.

9.5 Estado y seguridad de cambios
RF-17 Detección de documento modificado
La app detectará si el contenido actual difiere del último estado guardado.

RF-18 Confirmación al cerrar
Si existen cambios no guardados, la app preguntará:

guardar
descartar
cancelar
RF-19 Confirmación al abrir otro archivo
Si el documento actual tiene cambios no guardados, la app pedirá confirmación antes de reemplazarlo.

10. Requisitos no funcionales
RNF-01 Rendimiento
Tiempo de arranque percibido: rápido.
Apertura fluida de documentos pequeños y medianos.
La edición no debe presentar lag visible en documentos típicos.
Objetivo orientativo:

documentos de hasta 1–5 MB deben seguir siendo utilizables
RNF-02 Usabilidad
Interfaz clara, sin saturación visual.
El usuario debe entender el flujo principal sin tutorial.
Las funciones básicas deben ser accesibles por menú y atajo.
RNF-03 Estabilidad
La app no debe perder datos ante acciones normales.
Debe manejar errores de lectura/escritura con mensajes claros.
RNF-04 Compatibilidad
macOS: versión moderna soportada por el framework elegido
Windows: versión moderna soportada por el framework elegido
RNF-05 Seguridad
El renderizado HTML derivado de Markdown debe tratarse con sanitización razonable.
La app no ejecutará scripts embebidos del archivo Markdown.
RNF-06 Privacidad
El producto funcionará completamente local.
No enviará archivos del usuario a servidores externos en el MVP.
RNF-07 Accesibilidad
Navegación básica por teclado.
Contraste suficiente en temas claro/oscuro.
Tamaños de texto legibles.
11. UX / UI
11.1 Principios de diseño
simplicidad
velocidad
claridad
bajo ruido visual
foco en contenido
11.2 Estructura de pantalla propuesta
Barra superior / menú
Archivo
Nuevo
Abrir
Guardar
Guardar como
Recientes
Salir
Editar
Deshacer
Rehacer
Cortar
Copiar
Pegar
Buscar
Ver
Solo editor
Solo preview
Dividido
Tema claro/oscuro
Área principal
Según modo seleccionado:

editor raw
preview
o ambos en columnas
Barra inferior opcional
nombre de archivo
estado guardado/no guardado
número de palabras o líneas en versión futura
11.3 Comportamientos UX clave
Si el usuario escribe, la preview se actualiza sin bloquear.
Si intenta cerrar con cambios, se le protege de pérdida accidental.
Si abre un archivo no válido, recibe un error entendible.
Si el archivo es muy grande, la app debe seguir siendo funcional, aunque algunas mejoras puedan degradarse.
12. Historias de usuario
HU-01
Como usuario, quiero abrir un archivo Markdown desde mi ordenador para leerlo o editarlo.

HU-02
Como usuario, quiero ver el Markdown renderizado para comprobar cómo quedará el documento final.

HU-03
Como usuario, quiero alternar entre raw y preview para trabajar más cómodamente.

HU-04
Como usuario, quiero editar el texto del documento para actualizar su contenido.

HU-05
Como usuario, quiero buscar palabras o frases dentro del documento para encontrar información rápido.

HU-06
Como usuario, quiero guardar mis cambios para no perder trabajo.

HU-07
Como usuario, quiero recibir una advertencia si voy a cerrar un documento no guardado.

HU-08
Como usuario, quiero arrastrar un archivo a la ventana para abrirlo de forma rápida.

13. Criterios de aceptación del MVP
El MVP se considerará listo cuando:

La app abra archivos .md correctamente.
El usuario pueda editar el contenido raw.
La preview renderizada refleje cambios recientes.
El usuario pueda guardar y guardar como.
La búsqueda funcione con navegación entre resultados.
La app detecte cambios no guardados y proteja al usuario.
La app funcione en macOS y Windows.
La experiencia sea estable en documentos normales de trabajo.
El tema claro/oscuro esté disponible.
El flujo principal pueda realizarse sin errores bloqueantes.
14. Prioridades
P0 — Imprescindible
abrir
nuevo
guardar
guardar como
editor raw
preview renderizada
modos de vista
búsqueda
cambios no guardados
atajos básicos
tema oscuro/claro
P1 — Muy recomendable
drag & drop
recientes
reemplazar
índice de encabezados
exportar HTML
P2 — Futuro
exportar PDF
scroll sincronizado
pestañas múltiples
preferencias avanzadas
estadísticas de documento
15. Supuestos de producto
El usuario trabajará principalmente con archivos locales.
La mayoría de documentos serán de tamaño pequeño o medio.
El usuario no necesita colaboración ni nube en una primera etapa.
La app prioriza rapidez y simplicidad frente a extensibilidad.
16. Riesgos
Riesgo 1: Scope creep
Añadir demasiadas funciones puede convertir un editor simple en una suite compleja.

Mitigación:

fijar MVP estricto
priorización P0/P1/P2
no añadir plugins ni sincronización al inicio
Riesgo 2: Experiencia pobre de edición
Un editor demasiado básico puede sentirse limitado.

Mitigación:

usar un componente de edición robusto
garantizar atajos, undo/redo y búsqueda cómodos
Riesgo 3: Problemas de renderizado
Distintas variantes de Markdown pueden generar expectativas distintas.

Mitigación:

declarar explícitamente el alcance del soporte Markdown
usar una librería conocida y estable
Riesgo 4: Distribución en macOS
Distribuir a terceros sin firma/notarización puede generar fricción.

Mitigación:

diferenciar desarrollo interno de distribución pública
planificar firma y notarización si se lanza públicamente
17. Métricas de éxito
Métricas de uso
número de aperturas de archivo por sesión
porcentaje de sesiones con edición
porcentaje de sesiones con guardado exitoso
uso de vista dividida vs solo editor vs solo preview
Métricas de calidad
tasa de fallos al abrir archivos
tasa de errores de guardado
número de cierres con cambios no guardados
tiempo medio de arranque
tasa de crashes
Métricas cualitativas
percepción de rapidez
facilidad de uso
claridad de la interfaz
utilidad de la preview
18. Roadmap sugerido
Fase 1 — MVP
nuevo
abrir
guardar
guardar como
editor raw
preview
búsqueda
cambios no guardados
tema claro/oscuro
drag & drop
Fase 2 — Mejora de productividad
reemplazar
índice de encabezados
recientes
exportar HTML
soporte básico de imágenes
Fase 3 — Pulido
exportar PDF
scroll sincronizado
preferencias
pestañas
autoguardado opcional
19. Recomendación técnica de alto nivel
Sin entrar aún en especificación de arquitectura, el producto encaja bien con:

app desktop multiplataforma
motor de render Markdown
editor de texto con soporte de búsqueda y atajos
capa local de acceso a archivos
Stack razonable:

Tauri o Electron
editor tipo CodeMirror
renderizador tipo markdown-it
Razones:

rapidez para construir MVP
soporte bueno para macOS y Windows
facilidad para trabajar con archivos locales
20. Definición de “hecho”
Una funcionalidad se considerará terminada cuando:

cumpla criterios de aceptación
funcione en macOS y Windows
tenga comportamiento consistente por teclado y por menú
no rompa el flujo principal
maneje errores básicos de forma comprensible
esté validada manualmente con archivos reales
