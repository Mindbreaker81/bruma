# Mejoras de apariencia - Frontend Bruma

## Prioridad alta

### 1. Toolbar sobrecargada

El header tiene demasiados iconos apiñados sin separacion visual entre grupos funcionales (archivos, edicion, vista, zoom, exportar). No hay dividers ni agrupacion logica.

**Sugerencia**: Agrupar iconos con separadores visuales (`Divider` o `Separator` de Radix) entre secciones: Archivo | Edicion | Vista | Zoom | Exportar. Considerar colapsar funciones secundarias en un menu desplegable.

### 2. Sin empty state / welcome screen

Cuando no hay documento abierto, el editor simplemente esta vacio. Falta un onboarding visual o pantalla de bienvenida con acciones sugeridas.

**Sugerencia**: Mostrar una pantalla de bienvenida con acciones rapidas: "Nuevo documento", "Abrir archivo", "Abrir reciente", y atajos de teclado principales.

### 3. Sin transiciones ni animaciones

Tailwind animate esta instalado pero no se utiliza. Cambios de tema, apertura de paneles, y transiciones de vista no tienen animaciones.

**Sugerencia**: Animar el toggle de TOC, transiciones suaves entre modos de vista (editor/split/preview), y fade-in/out en dialogs.

## Prioridad media

### 4. App.tsx monolitico (~48KB, ~1200 lineas)

Todo el UI de la app principal esta en un solo componente gigante. Dificulta iterar en diseno y mantenimiento.

**Sugerencia**: Extraer secciones en componentes dedicados: `<Toolbar />`, `<StatusBar />`, `<EditorArea />`, `<ViewModeSelector />`, `<ZoomControls />`, `<DocumentActions />`.

### 5. Preview sin estilos de scrollbar

El scroll del preview usa el scrollbar por defecto del navegador, que se ve crudo en una app de escritorio.

**Sugerencia**: Usar `scrollbar-width: thin` + `scrollbar-color` con CSS custom para integrar con el tema. Alternativamente, un scrollbar overlay tipo macOS.

### 6. TabBar basica

Las pestañas son funcionales pero visualmente planas — sin indicadores de hover elaborados, sin animaciones de cierre, sin contexto visual de tipo de archivo.

**Sugerencia**: Añadir icono de archivo `.md`, animacion de cierre (fade out), borde inferior activo con color primary, y feedback visual en drag & drop.

### 7. Search panel flotante

El panel de busqueda esta posicionado con `absolute` sobre el editor.

**Sugerencia**: Integrar como panel fijo arriba del editor (como VS Code) con transicion de apertura, en lugar de overlay absoluto.

## Prioridad baja

### 8. Sin sidebar / activity bar

Apps de escritorio modernas tipicamente tienen una barra lateral con iconos para navegacion. La TOC actual es un aside basico sin transiciones.

**Sugerencia**: Evaluar si una activity bar vertical (iconos: archivos, buscar, TOC, ajustes) aportaria valor, o si el layout actual es suficiente para un editor minimalista.

### 9. ✅ Status bar — RESUELTO

StatusBar.tsx:34-78 ya muestra iconos (Type, Languages, MoonStar, CheckCheck, CircleDot) junto a cada métrica. Pendiente de futuro: icono animado para autosave activo (ver punto 5 de DESIGN_REVIEW.md, sin priorizar).

### 10. Event listeners duplicados

Hay dos `useEffect` casi identicos para zoom con keyboard (uno para Tauri y otro para web) que registran ambos en `window` — causa handlers duplicados en Tauri.

**Sugerencia**: Unificar en un solo efecto que use `isTauriRuntime()` para decidir si incluir `Shift+M` (focus mode, solo Tauri) o no.
