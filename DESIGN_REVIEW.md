# Bruma — Revisión de diseño del frontend

> Documento de trabajo dirigido al desarrollador que vaya a implementar las mejoras.
> Complementa (no sustituye) `FRONTEND_IMPROVEMENTS.md`. Cada hallazgo incluye archivo, línea, qué cambiar, por qué, y esfuerzo estimado (S = <1h, M = ~1 día, L = >1 día).
>
> Stack revisado: React 18 + TypeScript + Vite + Tailwind 3 + shadcn/ui (style "new-york") + Radix + Zustand 5 + i18next + Tauri 2 + CodeMirror 6 + sonner.

---

## Checklist de implementación

Marcar al completar. Cada ítem se commitea por separado para facilitar review/revert.

### Top 5 quick wins
- [x] **QW1** — `index.html`: theme-color, favicon y carga real de Inter (o quitarla)
- [x] **QW2** — Landing: OG tags + Twitter card + canonical
- [x] **QW3** — Welcome con `inert/aria-hidden` o no montar Editor debajo
- [x] **QW4** — `prefers-reduced-motion` global en `main.css`
- [x] **QW5** — `transition-colors duration-200` global (cubre A7)

### Prioridad alta
- [x] **A1** — Unificar tokens de color (HSL shadcn vs RGB `--color-*`)
- [x] **A2** — Cubierto por QW1
- [x] **A3** — Cubierto por QW3
- [ ] **A4** — Toolbar overflow horizontal en pantallas estrechas
- [ ] **A5** — Extraer Toolbar/AppShell de `App.tsx` ⚠ requiere QA visual
- [ ] **A6** — `useShallow` en selectores Zustand ⚠ requiere QA visual
- [x] **A7** — Cubierto por QW5
- [ ] **A8** — Contraste del badge "tagline"

### Prioridad media
- [ ] **M1** — `IconButton`/`ToolbarGroup` a `components/ui/`
- [ ] **M2** — `PreferencesDialog`: shadcn Checkbox/Select/Slider
- [ ] **M3** — `ShortcutsDialog` a shadcn `<Dialog>`
- [ ] **M4** — i18n en aria-labels de Preview/TOC
- [x] **M5** — Cubierto por QW2
- [ ] **M6** — CTA download con detección OS en landing
- [ ] **M7** — Self-host Inter en landing
- [ ] **M8** — Overlay decorativo opt-in / `focusMode`
- [x] **M9** — Cubierto por QW4
- [ ] **M10** — Tokens semánticos de z-index
- [ ] **M11** — `<DialogDescription>` con `<p>` anidados (About)
- [ ] **M12** — Recent empty state focusable
- [ ] **M13** — View-mode bar con Radix Tabs

### Prioridad baja / nice-to-have
- [ ] **B1** — Lucide imports canónicos (verificar bundle)
- [x] **B2** — Cubierto por QW1
- [ ] **B3** — `<kbd>` con shortcuts en Welcome
- [ ] **B4** — Actualizar `FRONTEND_IMPROVEMENTS.md` (punto 9 obsoleto)
- [ ] **B5** — ErrorBoundary en root
- [ ] **B6** — Tests de regresión visual (Playwright snapshots) ⚠ requiere baseline
- [ ] **B7** — Tema CodeMirror coherente con marca ⚠ requiere QA visual
- [ ] **B8** — Drag-over feedback en TabBar
- [ ] **B9** — Botón de zoom con icono visible
- [ ] **B10** — Fallback "desktop only" en `<md` para la app web

---

## Índice

1. [Impresión general](#impresión-general)
2. [Lo que ya está bien](#lo-que-ya-está-bien)
3. [Top 5 quick wins](#top-5-quick-wins)
4. [Hallazgos de prioridad alta](#hallazgos-de-prioridad-alta)
5. [Hallazgos de prioridad media](#hallazgos-de-prioridad-media)
6. [Hallazgos de prioridad baja / nice-to-have](#hallazgos-de-prioridad-baja--nice-to-have)
7. [Notas sobre `FRONTEND_IMPROVEMENTS.md`](#notas-sobre-frontend_improvementsmd)
8. [Archivos clave referenciados](#archivos-clave-referenciados)

---

## Impresión general

Bruma tiene una base técnica sólida (shadcn/ui sobre Radix, Zustand, i18next, Tauri, code splitting con `lazy`), una marca con personalidad clara (verde esmeralda + niebla, bilingüe), y atención real a a11y básica.

Sin embargo, la capa visual está atrapada entre **dos sistemas de tokens paralelos** (HSL de shadcn + custom RGB `--color-*`), un `App.tsx` de **1638 líneas** que centraliza toda la UI y el estado, y un `index.html` esquelético sin meta SEO que es el primer gran punto de pérdida. El estilo "glass + gradient" es coherente pero está aplicado de forma artesanal y repetida — la oportunidad principal es **consolidar el sistema de tokens y extraer la toolbar/shell** sin perder la voz de marca.

---

## Lo que ya está bien

- shadcn/ui correctamente instalado (alias `@/components/ui`, `style: new-york`, lucide como icon library).
- Tokens de color base completos en HSL para light/dark, con `[data-theme="dark"]` y `darkMode: ['class', '...']` — la conmutación funciona.
- Code splitting agresivo con `lazy()` para Editor, Preview, Search, Dialogs, Templates.
- i18n real con detección de sistema y dos locales (`es`/`en`); `documentElement.lang` se sincroniza.
- Toaster (sonner) integrado y con tema reactivo.
- A11y básica decente: `aria-pressed`, `aria-label`, `aria-selected` en tabs, `role="tablist"`/`"tab"`, `sr-only` en `IconButton`, `skip-link` en landing.
- Print stylesheet en `src/styles/main.css:287` para exportar a PDF — detalle pulido.
- CodeMirror configurado con compartments, scroll-sync custom, focus mode, autosave.
- Markdown sanitizado con DOMPurify + allowlist + hook anti `javascript:`/`vbscript:` (`src/lib/markdown.ts:113-128`).

---

## Top 5 quick wins

Lista priorizada para empezar — máximo impacto / mínimo esfuerzo.

| # | Cambio | Archivo | Esfuerzo | Impacto |
|---|--------|---------|----------|---------|
| 1 | Añadir `theme-color`, favicon y carga real de Inter (o quitarla del stack) | `index.html` | 30 min | A2 — la cascada hoy "miente" |
| 2 | OG tags + Twitter card + canonical en landing | `landing/src/template.html` | 30 min | M5 — links compartibles dejan de verse pelados |
| 3 | Welcome con `inert/aria-hidden` o no montar Editor debajo | `src/features/shell/WelcomeState.tsx:36` | 30 min | A3 — accesibilidad y carga inicial |
| 4 | `prefers-reduced-motion` global | `src/styles/main.css` | 10 min | M9 — cumplimiento WCAG 2.3.3 con una regla |
| 5 | Animar transición de tema y view-mode con `transition-colors duration-200` | `src/styles/main.css` + body | 1 h | A7 — convierte la app de "rígida" a "pulida" |

---

## Hallazgos de prioridad alta

Cosas que afectan UX claramente o son fáciles de arreglar con alto impacto.

### A1 — Dos sistemas de tokens de color en paralelo

**Esfuerzo:** M

**Qué:** `tailwind.config.ts` declara `--background`, `--foreground`, `--primary`, etc. en HSL (estilo shadcn), pero `src/styles/main.css:5-81` añade un segundo set `--color-bg`, `--color-surface`, `--color-panel`, `--color-text`, `--color-muted`, `--color-border`, `--color-control-hover` en RGB que se usan en `.bruma-editor`, `.bruma-preview`, y directamente en `src/features/settings/ShortcutsDialog.tsx:83-180`.

**Por qué:** Rompe la coherencia (cualquier cambio futuro requiere editarlo en dos sitios) y los colores están "casi iguales" pero no idénticos. Por ejemplo: en dark `--background` HSL `240 10% 3.9%` ≈ `#0a0a0c` mientras `--color-bg` es `24 24 27` = `#18181b`. También hace imposible tematizar la marca sin tocar dos sistemas.

**Acción:**
1. Deprecar todas las variables `--color-*`.
2. Expresar los matices de superficie como `card`/`muted`/`secondary`/`accent` de shadcn, o añadir tokens semánticos shadcn-style en HSL: `--surface`, `--panel`, `--control-hover`.
3. Migrar consumidores a `bg-card`, `bg-muted`, etc.
4. Actualizar `ShortcutsDialog.tsx` (ver M3) que es el mayor consumidor.

---

### A2 — `index.html` raíz sin metadatos y fuente Inter inexistente

**Esfuerzo:** S

**Qué:** `index.html` (raíz, NO la landing) solo declara `<title>Bruma</title>`. Falta:
- `<meta name="description">`
- `<meta name="theme-color">` (relevante para WebView2/iOS)
- preconnect/link para Inter — `tailwind.config.ts:10` la declara como primera fuente, pero **no se carga en ningún `<link>`**.
- favicon

El comentario `font-family: 'Aptos', 'Segoe UI Variable', Inter, …` en `src/styles/main.css:39` confirma que **Inter nunca llega** porque no está embebida ni linkeada. La app usa Aptos/system en lugar de su brand font declarada.

**Acción:** O bien:
- (a) Cargar Inter localmente: `pnpm add @fontsource-variable/inter` y `import '@fontsource-variable/inter';` en `src/main.tsx`. Tauri es offline-first, evita CDN.
- (b) Quitar Inter del stack en `tailwind.config.ts` para no mentir.

Y siempre: añadir favicon (puedes reutilizar `landing/src/icon.svg`) + `<meta name="theme-color" content="#047857">`.

---

### A3 — Welcome se monta encima del editor con `position: absolute z-20`

**Esfuerzo:** S

**Qué:** `src/features/shell/WelcomeState.tsx:36` usa `absolute inset-0 z-20 bg-background/90 backdrop-blur-sm` sobre el `MarkdownEditor` que sí está montado debajo. El editor recibe focus, los hotkeys siguen vivos, y al teclear `setWelcomeDismissed(true)` se dispara desde `App.tsx:1459`.

**Por qué:**
- Confunde a screen readers (dos textbox simultáneos, uno tapado).
- Reflows innecesarios.
- Carga CodeMirror aunque el usuario aún no escribe.

**Acción:** Condicionar el render del `MarkdownEditor` a `!showWelcomeState`, o como mínimo aplicar `aria-hidden="true"` y el atributo `inert` al árbol del editor mientras Welcome está visible.

---

### A4 — Toolbar reflowea en wrap y el grupo "marca" desaparece en <lg

**Esfuerzo:** M

**Qué:** `App.tsx:1077` esconde el badge `{t('app.tagline')}` con `hidden … lg:flex` y `App.tsx:1084` envuelve los `ToolbarGroup` con `flex-wrap`. En ventanas <1024px la toolbar se rompe en 2-3 filas con grupos que se separan caprichosamente, mientras grupos de 5-6 iconos enteros (`view`) llegan al límite.

**Por qué:** En una app de escritorio Tauri es habitual que el usuario reduzca la ventana; perder estructura es ruido.

**Acción:** Una vez extraída en `<Toolbar />` (ver A5), colapsar grupos secundarios (zoom, export) en un `DropdownMenu` "More" cuando el ancho disponible es estrecho. Usar `useResizeObserver` o un breakpoint Tailwind `xl:`. Alternativa más simple: forzar `overflow-x-auto` con scroll horizontal y mantener una sola fila.

---

### A5 — `App.tsx` 1638 líneas: extraer Toolbar, ViewModeBar y handlers

**Esfuerzo:** L

**Qué:** `src/App.tsx` tiene >40 selectores de `useThemeStore`, todo el árbol JSX de header, toolbar, view-mode bar, dialogs y status. `FRONTEND_IMPROVEMENTS.md` ya lo menciona, pero **complemento con rutas concretas:**

1. Extraer cinco subcomponentes de toolbar:
   - `ToolbarFile` (new, open, recent, save, save as)
   - `ToolbarWrite` (undo, redo, find, focus)
   - `ToolbarView` (toc, view modes, theme)
   - `ToolbarZoom` (zoom in, out, reset)
   - `ToolbarExport` (export pdf, html, copy)
2. Crear un `<AppShell>` que reciba slots `header / tabs / main / status`.
3. Mover los `useEffect` de `listenToMenuActions` (`App.tsx:949-1024`) y `listenToRecentOpen` (`App.tsx:1026-1045`) a un hook `useTauriMenuBridge()` en `src/hooks/`.
4. `IconButton` (`App.tsx:161-194`) y `ToolbarGroup` (`App.tsx:196-212`) deben vivir en `src/components/ui/` para reutilizarse.

**Por qué:** Además del mantenimiento, ahora cada cambio en zoom re-renderiza todo el header (ver A6).

---

### A6 — Selectores Zustand crudos sin `useShallow` → re-render en cada cambio menor

**Esfuerzo:** M

**Qué:** `App.tsx:233-296` hace ~30 `useFileStore((s) => s.field)` y ~25 `useThemeStore((s) => s.field)`. Cada actualización de cualquier field del store causa diff a nivel de componente raíz.

**Por qué:** `App.tsx` es enorme y suspende `MarkdownEditor`/`Preview` por debajo; cada keystroke pasa por aquí.

**Acción:**
- Usar `useShallow` (Zustand 5 lo provee de fábrica) con selectores agrupados por "feature":
  ```ts
  import { useShallow } from 'zustand/react/shallow';
  const { document, isDirty, displayName } = useFileStore(
    useShallow((s) => ({ document: s.document, isDirty: s.isDirty, displayName: s.displayName }))
  );
  ```
- O, mejor en combinación con A5, pasar los stores directamente a los subcomponentes extraídos para que cada uno solo se suscriba a lo suyo.

---

### A7 — `tailwindcss-animate` instalado pero apenas usado

**Esfuerzo:** S

**Qué:** `package.json` lo lista, `tailwind.config.ts:69` lo aplica, y solo aparece en `WelcomeState.tsx:36` (`animate-in fade-in`), `SearchPanel.tsx:54`, `TableOfContents.tsx:16`, y dentro de los componentes shadcn de Dialog/Tooltip. El cambio de tema es instantáneo (sin transición de colores).

**Por qué:** La app se siente "rígida" frente a competidores.

**Acción:**
- Añadir `transition-colors duration-200` en `body` y en clases globales `bg-background`/`text-foreground`.
- Animar los toggles de TOC y view-mode con `animate-in slide-in-from-left`.
- Para focus mode: `transition-[opacity,transform]`.
- Aplicar `[&_*]:transition` en el shell con cuidado (combinarlo con M9).

---

### A8 — Contraste y semántica del badge "tagline"

**Esfuerzo:** S

**Qué:** `App.tsx:1078` usa `text-emerald-800` sobre `bg-emerald-50/80` (en light) — pasa AA pero al lado del header glass se pierde. En dark `text-emerald-200` sobre `bg-emerald-500/10` es muy bajo contraste (≈3.6:1, no pasa AA para texto pequeño).

**Por qué:** Si el tagline define la marca, debe ser legible.

**Acción:** Subir a `text-emerald-100` o usar `text-foreground` con accent border. Verificar con DevTools color-contrast checker.

---

## Hallazgos de prioridad media

Mejoras de pulido y consistencia.

### M1 — `IconButton` y `ToolbarGroup` ad-hoc dentro de `App.tsx`

**Esfuerzo:** S

**Qué:** Viven inline en `App.tsx:161-212`.

**Por qué:** Rompe el patrón shadcn que llama a tener componentes reutilizables en `components/ui/`.

**Acción:** Mover a `src/components/ui/icon-button.tsx` con CVA variants:
```ts
const iconButtonVariants = cva('...', {
  variants: {
    size: { sm: '...', md: '...', icon: '...' },
    tone: { default: '...', active: '...', destructive: '...' },
  },
  defaultVariants: { size: 'md', tone: 'default' },
});
```

---

### M2 — `PreferencesDialog.tsx` mezcla form nativos crudos con shadcn

**Esfuerzo:** M

**Qué:** `src/features/settings/PreferencesDialog.tsx` usa:
- `<Switch />` shadcn en `:76` ✓
- `<input type="checkbox">` directo en `:91` ✗
- `<input type="number">` directo en `:136`, `:153`, `:167` ✗
- `<select>` directo en `:119` ✗

**Por qué:**
- Rompe coherencia visual (los `<input>` heredan estilo OS).
- Accesibilidad: `<input type="range">` sin label de valor `aria-valuetext`.
- Dark mode: los checkbox nativos no respetan tema.

**Acción:** Añadir primitivas shadcn faltantes: `Checkbox`, `Select`, `Slider`, `NumberInput` (todas Radix-based). Generar con `pnpm dlx shadcn@latest add checkbox select slider`.

---

### M3 — `ShortcutsDialog.tsx` no usa el componente Dialog de shadcn

**Esfuerzo:** M

**Qué:** `src/features/settings/ShortcutsDialog.tsx:81-196` implementa su propio `<div className="fixed inset-0 z-20 grid place-items-center bg-black/35">` con `role="dialog" aria-modal="true"` manual — sin trap de foco, sin restore focus, sin Esc handler explícito. Y usa los tokens **viejos** `--color-border/--color-bg/--color-control-hover` (problema A1).

**Por qué:**
1. Accesibilidad inferior al resto de modales.
2. Inconsistencia visual.
3. Si el usuario presiona Tab dentro del modal, puede saltar fuera al árbol bajo.

**Acción:** Portarlo a `<Dialog>` shadcn como `PreferencesDialog`. **Bonus:** es donde están strings hardcodeadas en inglés (`"Press keys..."`, `"Cancel"`, `"Record"`, `"Reset to default"` en `:146-169`) — arreglar i18n a la vez (M4).

---

### M4 — Strings hardcodeadas que escapan a i18n

**Esfuerzo:** S

**Qué:** Además de M3:
- `src/features/preview/Preview.tsx:104` usa `aria-label="Markdown preview"` literal (no `t(...)`).
- `src/features/toc/TableOfContents.tsx:17` usa `aria-label="Table of contents"`.
- Tienen translation keys (`toc.title`) para el texto visible pero no para el `aria-label`.

**Por qué:** Screen readers en español lo leerán en inglés.

**Acción:** Añadir keys `preview.label` y `toc.label` en `src/locales/{es,en}/common.json` (o donde esté la estructura) y pasarlas por `t(...)`.

---

### M5 — `landing/` sin OG image, Twitter card ni canonical

**Esfuerzo:** S

**Qué:** `landing/src/template.html:1-16` solo tiene `<title>` y `<meta description>`.

**Por qué:** El README dice que se despliega en `bruma-sigma.vercel.app` — sin OG image, cualquier link compartido en X/Slack/Discord aparece como texto pelado.

**Acción:** Añadir al `<head>`:
```html
<meta property="og:title" content="Bruma — editor Markdown local-first" />
<meta property="og:description" content="..." />
<meta property="og:image" content="/og-image.png" />
<meta property="og:url" content="https://bruma-sigma.vercel.app" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Bruma — editor Markdown local-first" />
<meta name="twitter:description" content="..." />
<meta name="twitter:image" content="/og-image.png" />
<link rel="canonical" href="https://bruma-sigma.vercel.app" />
<meta name="theme-color" content="#047857" />
```

Y generar un OG 1200×630 con el logo + tagline. Copiar el asset a `landing/src/og-image.png` y añadirlo a la lista de archivos copiados en `landing/build.mjs:88`.

---

### M6 — Hero de la landing sin CTA de descarga directa

**Esfuerzo:** M

**Qué:** `landing/src/template.html:44-58` ofrece dos links a GitHub ("Repositorio" y "Releases").

**Por qué:** El usuario que llega busca "instalar Bruma", pero tiene que navegar a Releases y descifrar nombres de artefactos.

**Acción:**
1. En `landing/src/app.js`, detectar OS via `navigator.userAgent`/`navigator.userAgentData.platform`.
2. Hacer `fetch('https://api.github.com/repos/Mindbreaker81/bruma/releases/latest')`.
3. Mostrar un CTA primario "Descargar para macOS / Windows / Linux" que apunte directo al asset adecuado.
4. Fallback al link de Releases si la detección falla o no hay asset para ese OS.

---

### M7 — Landing tipografía remota — fail closed

**Esfuerzo:** S

**Qué:** `landing/src/template.html:9-14` carga Inter desde `fonts.googleapis.com` con preconnect.

**Por qué:**
- Ralentiza First Paint y depende de un tercero.
- Mientras tanto, la app desktop **no** usa Inter (ver A2).
- El CSP de `vercel.json:27` ya requiere whitelistear `googleapis`/`gstatic`.

**Acción:** Self-host con `@fontsource/inter` (añadir como dep de `landing/`) o usar system stack sin Google Fonts. Si self-host, eliminar las entradas `googleapis`/`gstatic` del CSP en `vercel.json`.

---

### M8 — `bruma-shell::after` overlay decorativo permanente

**Esfuerzo:** S

**Qué:** `src/styles/main.css:105-116` aplica un grid pattern `linear-gradient` con `mask-image` y `background-size: 32px 32px` sobre el shell. Más los tres blobs en `App.tsx:1054-1058`.

**Por qué:** En un editor markdown enfocado en escritura, el ruido visual del fondo compite con el texto. Funciona para una landing, no para una herramienta de uso prolongado.

**Acción:** Una de:
- (a) Reducir `opacity: 0.2` → `0.06` y hacerlo opt-in via toggle en preferences ("decorative background").
- (b) Quitarlo automáticamente cuando `focusMode` está activo.

---

### M9 — `prefers-reduced-motion` no respetado

**Esfuerzo:** S

**Qué:** `src/features/tabs/TabBar.tsx:71` usa `transition`, `TableOfContents.tsx:16` usa `animate-in slide-in-from-left-2`, `WelcomeState.tsx:134` usa `hover:-translate-y-0.5`. Ningún sitio honra `@media (prefers-reduced-motion: reduce)`.

**Por qué:** WCAG 2.3.3, y usuarios con sensibilidad vestibular.

**Acción:** En `src/styles/main.css` añadir:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

### M10 — Z-index sin escala documentada

**Esfuerzo:** S

**Qué:** Aparecen `z-10` (header, section, focus button con z-50), `z-20` (welcome, shortcuts dialog), `z-50` (Dialog overlays shadcn). El `Welcome (z-20)` puede taparse con `Dialog (z-50)` — bien — pero si se abre simultáneamente Search (`z-10` en `SearchPanel.tsx:54`) sobre Welcome no se ve.

**Por qué:** Deuda implícita.

**Acción:** Declarar en `src/styles/main.css`:
```css
:root {
  --z-base: 0;
  --z-shell: 10;
  --z-overlay: 20;
  --z-modal: 50;
  --z-toast: 60;
}
```
Y referenciarlos via `style={{ zIndex: 'var(--z-overlay)' }}` o como tokens Tailwind en `tailwind.config.ts`.

---

### M11 — `<DialogDescription>` con `<p>` anidados en About

**Esfuerzo:** S

**Qué:** `App.tsx:1586-1589` mete dos `<p>` dentro de `<DialogDescription>` que renderiza un `<p>` por sí mismo (Radix).

**Por qué:** HTML inválido (`<p>` no permite hijos block, los navegadores autocierran y rompe el layout sutilmente).

**Acción:** Cambiar a `<div>` o reestructurar usando `<DialogDescription asChild>` con un `<div>`.

---

### M12 — Empty state del menú "Recent" inaccesible vía teclado

**Esfuerzo:** S

**Qué:** `App.tsx:1191-1194` renderiza `<div className="px-2 py-1.5 text-sm text-muted-foreground">{t('recent.empty')}</div>` dentro del `DropdownMenuContent`. Radix avisa cuando un Menu no tiene items focusables → al abrir con teclado el focus cae en `body`.

**Acción:** Usar `<DropdownMenuItem disabled>` con texto, o cambiar a deshabilitar el trigger cuando no hay recientes y mostrar tooltip explicativo.

---

### M13 — View-mode bar reimplementa botones tipo "tab" sin Radix Tabs

**Esfuerzo:** M

**Qué:** `App.tsx:1366-1382` hace tres `<button aria-pressed>` ad-hoc para editor/split/preview.

**Por qué:** Radix Tabs maneja flechas izq/der, Home/End, indicadores activos.

**Acción:** Instalar `@radix-ui/react-tabs` y crear `src/components/ui/tabs.tsx` con la receta shadcn estándar (`pnpm dlx shadcn@latest add tabs`).

---

## Hallazgos de prioridad baja / nice-to-have

Ideas de futuro o pulido fino.

### B1 — Imports de Lucide via `dist/esm/icons/...`

**Esfuerzo:** S

**Qué:** `App.tsx:1-18` y todos los features importan `lucide-react/dist/esm/icons/columns-2.js` etc. (43 ocurrencias). Funciona pero es frágil ante cambios internos del paquete; el import normal `import { Columns2 } from 'lucide-react'` con tree-shaking de Vite produce el mismo bundle moderno.

**Acción:** Verificar con `pnpm build:analyze` que el tamaño es igual y, si lo es, volver al import canónico para reducir mantenimiento. Si descubres que SÍ aumenta, documenta el motivo en un comentario en el primer import.

---

### B2 — Favicon real para el desktop window

**Esfuerzo:** S

**Qué:** `index.html` no declara favicon.

**Por qué:** El WebView2/WebKitGTK pintan el icon-fallback en pestañas del Inspector.

**Acción:** Añadir `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />` apuntando al asset (puedes reutilizar el de `landing/`).

---

### B3 — `WelcomeState` no muestra atajos de teclado descubribles

**Esfuerzo:** S

**Qué:** Las tres tarjetas en `WelcomeState.tsx:76-110` describen "shortcuts/search/preview" como concepto, pero no enseñan ⌘N, ⌘O, ⌘F concretos.

**Por qué:** Oportunidad de onboarding desperdiciada.

**Acción:** Añadir un `<kbd>⌘N</kbd>` en cada tarjeta, leyendo desde `COMMAND_REGISTRY` (donde sea que estén definidos los shortcuts) para que se mantengan en sync.

---

### B4 — `StatusBar` ya tiene iconos (TODO obsoleto en `FRONTEND_IMPROVEMENTS.md`)

**Esfuerzo:** S

**Qué:** `FRONTEND_IMPROVEMENTS.md` punto 9 dice que faltan iconos en StatusBar, pero `src/features/status-bar/StatusBar.tsx:34-78` ya los tiene (`Type`, `Languages`, `MoonStar`, `CheckCheck`, `CircleDot`).

**Acción:** Actualizar `FRONTEND_IMPROVEMENTS.md` para marcar el punto 9 como hecho, o eliminarlo.

---

### B5 — Sin Error Boundary

**Esfuerzo:** S

**Qué:** `src/main.tsx:9-13` monta `<App />` directo.

**Por qué:** Cualquier excepción de render mata la app entera.

**Acción:** Envolver con un ErrorBoundary que muestre estado degradado con botón "Reload" y log a console (sin telemetría — coherente con local-first). Coloca el componente en `src/components/ErrorBoundary.tsx`.

---

### B6 — Sin tests visuales / Playwright UI

**Esfuerzo:** M

**Qué:** `playwright.config.ts` existe y hay `tests/`, pero ninguna prueba de regresión visual con screenshots. Para una app que cuida tanto la apariencia es la primera línea de defensa.

**Acción:** Añadir `expect(page).toHaveScreenshot()` para Welcome, editor light/dark, y los principales dialogs (Preferences, Shortcuts, About).

---

### B7 — CodeMirror tema custom inexistente

**Esfuerzo:** M

**Qué:** `src/features/editor/MarkdownEditor.tsx` no aplica tema CodeMirror — usa colores default. La sintaxis se ve poco integrada con el resto (verde esmeralda).

**Acción:** Definir un `EditorView.theme()` basado en los CSS vars del shell para keywords, headings, código inline, blockquotes. Crear `src/features/editor/theme.ts`.

---

### B8 — Drag-over en TabBar sin feedback visual

**Esfuerzo:** S

**Qué:** `src/features/tabs/TabBar.tsx:37-51` registra `dragOverIndex.current` pero no pinta nada (no hay clase ni indicator).

**Por qué:** El usuario no sabe dónde caerá la pestaña.

**Acción:** Convertir a estado React con índice y pintar un borde animado tipo `border-l-2 border-primary` en la posición de drop.

---

### B9 — Botón "100%" del zoom — semántica débil

**Esfuerzo:** S

**Qué:** `App.tsx:1283-1294` muestra el porcentaje y al click resetea. La acción "click en label = reset" no es descubrible. El tooltip dice "Reset" pero no en el label visible.

**Acción:** Añadir un icono `RotateCcw` cuando el scale ≠ 1, o convertirlo en `<Button variant="outline">` con icono visible.

---

### B10 — Mobile/responsive: ignorado deliberadamente en la app

**Esfuerzo:** S

**Qué:** El shell tiene `flex-wrap` y `lg:` selectivos pero la TOC `w-72 shrink-0` y la toolbar grande hacen que <768px sea inusable. Es Tauri, OK — pero `bruma-sigma.vercel.app` se sirve también como demo y un visitante en móvil no podrá probarla.

**Acción:** En la app real, mostrar un fallback "Bruma está optimizado para escritorio" en `<md`. La landing ya es responsive (✓).

---

## Notas sobre `FRONTEND_IMPROVEMENTS.md`

Ese documento es válido y este lo complementa. Para evitar contradicciones:

- **Su punto 1 (Toolbar sobrecargada):** sigue válido, complementado aquí por **A4** (responsive collapse) y **A5** (extracción).
- **Su punto 2 (welcome screen):** ya implementado, pero ver **A3** y **B3** para mejorarlo.
- **Su punto 3 (transiciones):** sigue válido, ver **A7** y **M9** (combinar con `prefers-reduced-motion`).
- **Su punto 4 (App.tsx monolítico):** sigue válido, ver **A5** con rutas concretas.
- **Su punto 9 (status bar):** **OBSOLETO** — ya tiene iconos (ver **B4**).
- **Su punto 10 (event listeners duplicados):** no revisado en este informe; mantener como pendiente.

---

## Archivos clave referenciados

Para que el desarrollador encuentre rápido los puntos calientes:

| Archivo | Líneas críticas | Por qué |
|---------|-----------------|---------|
| `src/App.tsx` | 161-212, 233-296, 949-1045, 1054-1058, 1077-1084, 1191-1194, 1283-1294, 1366-1382, 1459, 1586-1589 | Componente mega-monolítico, foco principal de refactor |
| `src/styles/main.css` | 5-81, 105-116, 287 | Sistema dual de tokens, overlay decorativo, print styles |
| `tailwind.config.ts` | 10, 69 | Stack de fuentes (Inter no cargada), tailwindcss-animate |
| `index.html` | 1-12 | Metadatos vacíos |
| `src/features/shell/WelcomeState.tsx` | 36, 76-110, 134 | Overlay absolute, tarjetas onboarding |
| `src/features/settings/PreferencesDialog.tsx` | 76, 91, 119, 136, 153, 167 | Inputs nativos sin estilo shadcn |
| `src/features/settings/ShortcutsDialog.tsx` | 81-196 | Modal ad-hoc + i18n incompleta + tokens viejos |
| `src/features/tabs/TabBar.tsx` | 37-51, 71 | Drag-over sin feedback, transitions |
| `src/features/toc/TableOfContents.tsx` | 16-17 | aria-label sin i18n |
| `src/features/preview/Preview.tsx` | 104, 107 | aria-label sin i18n; `dangerouslySetInnerHTML` (correcto, ya sanitizado) |
| `src/features/search/SearchPanel.tsx` | 54 | z-index colisión potencial con Welcome |
| `landing/src/template.html` | 1-16, 9-14, 44-58 | Sin OG/canonical, Inter remota, CTA débil |
| `landing/src/app.js` | — | Lugar para añadir detección de OS (M6) |
| `src/main.tsx` | 9-13 | Sin Error Boundary |
| `src/components/ui/` | (faltan archivos) | Faltan: `tabs.tsx`, `checkbox.tsx`, `select.tsx`, `slider.tsx`, `icon-button.tsx` |

---

## Estrategia sugerida de implementación

Si vas a tackleear esto en sprints:

**Sprint 1 — Quick wins (1 día):** Top 5 quick wins arriba.

**Sprint 2 — Refactor del shell (3-5 días):** A5 + A6 + A1 + M1. Es el desbloqueador para todo lo demás.

**Sprint 3 — Pulido de diálogos y forms (2 días):** M2 + M3 + M4 + M11 + M12.

**Sprint 4 — Landing pública (1 día):** M5 + M6 + M7.

**Sprint 5 — Detalles y tests (variable):** A8, M8, M10, M13, B-series según prioridad.
