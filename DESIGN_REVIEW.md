# Bruma — Revisión de diseño del frontend

> Documento de trabajo dirigido al desarrollador que vaya a implementar las mejoras.
> Complementa (no sustituye) `FRONTEND_IMPROVEMENTS.md`. Cada hallazgo incluye archivo, línea, qué cambiar, por qué, y esfuerzo estimado (S = <1h, M = ~1 día, L = >1 día).
>
> Stack revisado: React 18 + TypeScript + Vite + Tailwind 3 + shadcn/ui (style "new-york") + Radix + Zustand 5 + i18next + Tauri 2 + CodeMirror 6 + sonner.

---

## Estado de implementación (2026-05-01)

Trabajo en curso en la rama `claude/security-audit-design-review-csbqz`. Cada ítem del checklist se commitea por separado.

**Hecho (12/26 ítems no cubiertos por otros):**

| ID | Commit (SHA corto) | Resumen |
|----|---------------------|---------|
| QW1 | `8292e20` | Inter via `@fontsource-variable/inter`, favicon, `theme-color` y `meta description` en `index.html` |
| QW2 | `90b87f3` | OG tags + Twitter card + canonical + `og-image.svg` 1200×630 en landing |
| QW3 | `c73ed92` | `inert`/`aria-hidden` en el editor cuando Welcome está visible |
| QW4 | `f94b54a` | `@media (prefers-reduced-motion: reduce)` global |
| QW5 / A7 | `1ef027f` | `transition: background-color/color 200ms ease` en `body` |
| A1 | `0b85c8b` | Eliminadas variables `--color-*` duplicadas; consumidores migrados a tokens shadcn HSL |
| A4 | `7002f42` | Toolbar con scroll horizontal en `<xl`, `flex-wrap` solo a partir de `xl` |
| A8 | `07360b4` | Badge tagline: `text-emerald-50` sobre `bg-emerald-400/15` en dark (≥AA) |
| M1 | `522e6ab` | `IconButton` y `ToolbarGroup` movidos a `src/components/ui/icon-button.tsx` |
| M4 | `4466c94` | Keys `preview.label` y `toc.label` añadidas a es/en y usadas en `aria-label` |
| M11 | `37b5cbb` | `<p>` anidados eliminados dentro de `<DialogDescription>` en About |

Tras cada cambio: `pnpm test` (102/102 ✓), `pnpm lint` (0 warnings ✓), `pnpm build` (✓).

**Pendiente (orden sugerido, agrupado por riesgo):**

1. **Mecánicos / bajo riesgo:** M12, M10, M8, M6, M7, B1, B3, B4, B5, B8, B9, B10.
2. **Refactors medianos / requieren añadir primitivas shadcn:** M3 (Dialog), M2 (Checkbox/Select/Slider), M13 (Tabs).
3. **Estructurales / requieren QA visual:** A5 (extraer Toolbar/AppShell de App.tsx), A6 (`useShallow` en stores Zustand).
4. **Requieren setup manual antes de implementar:** B6 (baseline de snapshots Playwright), B7 (tema CodeMirror — subjetivo).

Para retomar: marcar cada checkbox del bloque siguiente al completarlo, hacer commit con mensaje `<tipo>(<id>): ...` (commitlint exige subject lowercase) y verificar lint/test/build.

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
- [x] **A4** — Toolbar overflow horizontal en pantallas estrechas
- [ ] **A5** — Extraer Toolbar/AppShell de `App.tsx` ⚠ requiere QA visual
- [ ] **A6** — `useShallow` en selectores Zustand ⚠ requiere QA visual
- [x] **A7** — Cubierto por QW5
- [x] **A8** — Contraste del badge "tagline"

### Prioridad media
- [x] **M1** — `IconButton`/`ToolbarGroup` a `components/ui/`
- [ ] **M2** — `PreferencesDialog`: shadcn Checkbox/Select/Slider
- [ ] **M3** — `ShortcutsDialog` a shadcn `<Dialog>`
- [x] **M4** — i18n en aria-labels de Preview/TOC
- [x] **M5** — Cubierto por QW2
- [ ] **M6** — CTA download con detección OS en landing
- [ ] **M7** — Self-host Inter en landing
- [ ] **M8** — Overlay decorativo opt-in / `focusMode`
- [x] **M9** — Cubierto por QW4
- [ ] **M10** — Tokens semánticos de z-index
- [x] **M11** — `<DialogDescription>` con `<p>` anidados (About)
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

## Recetas paso a paso para los pendientes

> Esta sección está pensada para que cualquier desarrollador (incluso poco familiarizado con el repo) pueda completar los ítems pendientes sin equivocarse. Cada receta indica archivos exactos, código a aplicar y cómo verificar.
>
> **Reglas comunes para todas las recetas:**
> 1. Trabaja en la rama `claude/security-audit-design-review-csbqz` (o crea una nueva desde ella).
> 2. Antes de empezar, asegúrate de que `pnpm install` está al día y `pnpm test`, `pnpm lint`, `pnpm build` pasan en limpio.
> 3. Después de cada receta corre los **tres** comandos:
>    ```sh
>    pnpm lint && pnpm test && pnpm build
>    ```
>    Si alguno falla: arregla antes de commitear; nunca uses `--no-verify`.
> 4. **commitlint** exige que el subject del commit empiece en minúscula y siga `tipo(scope): texto`. Si tu commit es rechazado por sentence-case, baja la primera letra del subject.
> 5. Marca el checkbox correspondiente en el bloque "Checklist de implementación" arriba en el mismo commit.
> 6. Un ítem = un commit (excepto los marcados como "puede unirse con ...").

---

### Receta M12 — Recent empty state focusable

**Esfuerzo:** S · **Riesgo:** muy bajo

**Objetivo:** cuando no hay archivos recientes, el menú desplegable Recent debe contener un item disabled en lugar de un `<div>` no-focusable, para que Radix DropdownMenu no caiga el foco en `body` al abrir con teclado.

**Archivo a tocar:** `src/App.tsx` (línea ~1136-1140 — busca `recent.empty`).

**Pasos:**

1. Localiza el bloque actual:
   ```tsx
   ) : (
     <div className="px-2 py-1.5 text-sm text-muted-foreground">
       {t('recent.empty')}
     </div>
   )}
   ```
2. Reemplázalo por:
   ```tsx
   ) : (
     <DropdownMenuItem disabled>
       {t('recent.empty')}
     </DropdownMenuItem>
   )}
   ```
3. Verifica que `DropdownMenuItem` ya está importado en App.tsx (líneas 45-67 de imports). Si no, añade `DropdownMenuItem` al import existente desde `'./components/ui/dropdown-menu'`.

**Verificación:** `pnpm lint && pnpm test && pnpm build`. Manual (opcional, en `pnpm dev`): abre File → Recent sin tener archivos abiertos antes; el placeholder ahora se ve "atenuado" pero el foco permanece dentro del menú al pulsar Tab.

**Commit:**
```
fix(m12): item disabled en lugar de div no focusable en Recent vacio
```

---

### Receta M10 — Tokens semánticos de z-index

**Esfuerzo:** S · **Riesgo:** muy bajo (cambio cosmético)

**Objetivo:** Centralizar la escala de z-index en variables CSS para evitar colisiones futuras.

**Archivos a tocar:**
- `src/styles/main.css` (declarar variables)
- `src/App.tsx`, `src/features/shell/WelcomeState.tsx`, `src/features/search/SearchPanel.tsx`, `src/features/settings/ShortcutsDialog.tsx` (usar variables)

**Pasos:**

1. En `src/styles/main.css`, dentro del bloque `:root` (línea ~5), añade al final:
   ```css
   /* Z-index scale (M10) */
   --z-base: 0;
   --z-shell: 10;
   --z-overlay: 20;
   --z-modal: 50;
   --z-toast: 60;
   ```
2. En `tailwind.config.ts`, dentro de `theme.extend`, añade:
   ```ts
   zIndex: {
     base: 'var(--z-base)',
     shell: 'var(--z-shell)',
     overlay: 'var(--z-overlay)',
     modal: 'var(--z-modal)',
     toast: 'var(--z-toast)',
   },
   ```
3. Reemplaza ocurrencias en TSX:
   - `z-10` que sea de header/section → `z-shell`
   - `z-20` que sea overlay (Welcome, ShortcutsDialog, SearchPanel) → `z-overlay`
   - `z-50` que pertenezca al focus-mode-button (App.tsx ~1284) → `z-overlay` (no es modal)
   - **NO toques** los `z-50` que vienen de los componentes shadcn de Dialog/AlertDialog (están en `src/components/ui/`).

   Comando de búsqueda:
   ```sh
   grep -rn "z-10\|z-20\|z-50" src/App.tsx src/features
   ```
   Itera caso por caso, no uses replace-all.

**Verificación:** `pnpm lint && pnpm test && pnpm build`. Visual: abre cada modal (About, Preferences, Shortcuts, External link) y confirma que ningún overlay queda detrás del contenido.

**Commit:**
```
refactor(m10): tokens semanticos de z-index en main.css y tailwind
```

---

### Receta M8 — Overlay decorativo opt-in / `focusMode`

**Esfuerzo:** S · **Riesgo:** bajo

**Objetivo:** El grid pattern decorativo de fondo (`bruma-shell::after`) compite con el texto en sesiones largas. Solución mínima: que se desactive automáticamente en focus-mode.

**Archivos a tocar:**
- `src/styles/main.css` (regla ~112)
- `src/App.tsx` (al `<main>`/`<div>` que tiene clase `bruma-shell`, añadir `data-focus`)

**Pasos:**

1. En `src/App.tsx`, busca el contenedor que aplica la clase `bruma-shell` (es el wrapper más exterior del shell, contiene el `::after` decorativo). Añade un atributo `data-focus`:
   ```tsx
   <div className="bruma-shell ..." data-focus={focusMode ? 'on' : 'off'}>
   ```
2. En `src/styles/main.css`, modifica la regla del overlay (línea ~112):
   ```css
   .bruma-shell::after {
     content: '';
     /* … resto igual … */
     opacity: 0.2;
     transition: opacity 200ms ease;
   }

   .bruma-shell[data-focus='on']::after {
     opacity: 0;
   }
   ```

**Verificación:** `pnpm lint && pnpm test && pnpm build`. Manual: activa focus-mode (`Mod+Shift+M`) y comprueba que el grid se desvanece.

**Commit:**
```
feat(m8): oculta overlay decorativo en focus-mode
```

---

### Receta M6 — CTA download con detección de OS en la landing

**Esfuerzo:** M · **Riesgo:** bajo (es JS de cliente, sin afectar build)

**Objetivo:** En la landing, mostrar un botón "Descargar para macOS / Windows / Linux" que apunte directo al asset adecuado de la última release.

**Archivos a tocar:**
- `landing/src/template.html` (sustituir el bloque `hero__actions`)
- `landing/src/app.js` (añadir lógica)

**Pasos:**

1. En `landing/src/template.html` reemplaza el bloque `<div class="hero__actions">` (líneas ~44-67) por:
   ```html
   <div class="hero__actions">
     <a
       class="btn btn--primary"
       id="download-cta"
       href="https://github.com/Mindbreaker81/bruma/releases"
       rel="noopener noreferrer"
       target="_blank"
       data-default-label="Descargas"
     >Descargas</a>
     <a
       class="btn btn--secondary"
       href="https://github.com/Mindbreaker81/bruma"
       rel="noopener noreferrer"
       target="_blank"
     >Repositorio en GitHub</a>
     <button type="button" class="btn btn--ghost" id="theme-toggle" aria-pressed="false">Tema</button>
   </div>
   ```

2. En `landing/src/app.js` añade al final del archivo:
   ```js
   (async function setupDownloadCta() {
     const cta = document.getElementById('download-cta');
     if (!cta) return;

     const ua = navigator.userAgent || '';
     let os = null;
     if (/Mac|iPhone|iPad/.test(ua)) os = 'macos';
     else if (/Windows/.test(ua)) os = 'windows';
     else if (/Linux/.test(ua)) os = 'linux';

     const labelMap = {
       macos: 'Descargar para macOS',
       windows: 'Descargar para Windows',
       linux: 'Descargar para Linux',
     };
     if (os && labelMap[os]) cta.textContent = labelMap[os];

     try {
       const res = await fetch(
         'https://api.github.com/repos/Mindbreaker81/bruma/releases/latest',
         { headers: { Accept: 'application/vnd.github+json' } }
       );
       if (!res.ok) return;
       const release = await res.json();
       const matchers = {
         macos: /\.(dmg|app\.tar\.gz)$/i,
         windows: /\.(msi|exe)$/i,
         linux: /\.(AppImage|deb|rpm)$/i,
       };
       const asset = (release.assets || []).find((a) => os && matchers[os].test(a.name));
       if (asset && asset.browser_download_url) cta.href = asset.browser_download_url;
     } catch {
       /* fallback al link de releases */
     }
   })();
   ```

3. **CSP:** revisa `vercel.json` (línea ~27). Necesitas añadir `https://api.github.com` en `connect-src`. Cambia:
   ```
   default-src 'self'; img-src 'self' data:; ...
   ```
   por:
   ```
   default-src 'self'; connect-src 'self' https://api.github.com; img-src 'self' data:; ...
   ```

**Verificación:** Build de la landing:
```sh
cd landing && npm install && npm run build
```
Abre `landing/dist/index.html` en un navegador. El CTA debería decir "Descargar para macOS/Windows/Linux" según tu OS.

**Commit:**
```
feat(m6): cta de descarga con deteccion de OS en la landing
```

---

### Receta M7 — Self-host Inter en la landing

**Esfuerzo:** S · **Riesgo:** bajo

**Objetivo:** Eliminar la dependencia de Google Fonts en la landing. Usa `@fontsource/inter` igual que la app desktop.

**Archivos a tocar:** `landing/package.json`, `landing/build.mjs`, `landing/src/template.html`, `landing/src/styles.css`, `vercel.json`.

**Pasos:**

1. Añade el paquete a `landing/package.json` en `dependencies`:
   ```json
   "@fontsource-variable/inter": "^5.2.8",
   ```

2. En `landing/build.mjs`, dentro de la función `main()`, añade después del bloque que copia los assets estáticos:
   ```js
   // Copia los archivos de la fuente Inter al dist
   const interSrc = path.join(__dirname, 'node_modules', '@fontsource-variable', 'inter', 'files');
   const interDist = path.join(distDir, 'fonts', 'inter');
   fs.mkdirSync(interDist, { recursive: true });
   for (const file of fs.readdirSync(interSrc)) {
     fs.copyFileSync(path.join(interSrc, file), path.join(interDist, file));
   }
   ```

3. En `landing/src/template.html` elimina las 4 líneas de Google Fonts (preconnects + `<link>` con `fonts.googleapis.com`).

4. En `landing/src/styles.css` añade al inicio:
   ```css
   @font-face {
     font-family: 'Inter Variable';
     font-style: normal;
     font-display: swap;
     font-weight: 100 900;
     src: url('/fonts/inter/inter-latin-wght-normal.woff2') format('woff2-variations');
   }
   ```
   y cambia el `font-family` base a:
   ```css
   font-family: 'Inter Variable', Inter, system-ui, -apple-system, 'Segoe UI', sans-serif;
   ```

5. En `vercel.json` simplifica el CSP eliminando los hosts de Google:
   - Quita `https://fonts.googleapis.com` de `style-src`.
   - Quita `https://fonts.gstatic.com` de `font-src`.

**Verificación:** `cd landing && npm install && npm run build`. Sirve `landing/dist/` con cualquier static server (`npx serve dist`) y comprueba en DevTools → Network que ya no hay requests a `fonts.googleapis.com`.

**Commit:**
```
feat(m7): self-host de Inter en la landing
```

---

### Receta M3 — `ShortcutsDialog` a shadcn `<Dialog>`

**Esfuerzo:** M · **Riesgo:** medio (refactor amplio del componente)

**Objetivo:** Reemplazar el modal ad-hoc de `ShortcutsDialog.tsx` por el componente `<Dialog>` de shadcn (que ya está en el repo y se usa en Preferences/About). Beneficios: focus trap, restore focus, Esc handling, consistencia visual.

**Archivos a tocar:** `src/features/settings/ShortcutsDialog.tsx`, `src/i18n/locales/{es,en}.json`.

**Pasos:**

1. Añade keys i18n para los strings hardcodeados en inglés. En `src/i18n/locales/es.json`, dentro del namespace `shortcuts` (línea ~85 aprox), añade:
   ```json
   "pressKeys": "Pulsa la combinacion...",
   "cancel": "Cancelar",
   "record": "Grabar",
   "reset": "Restablecer",
   "resetTooltip": "Restablecer al valor por defecto"
   ```
   En `src/i18n/locales/en.json` el equivalente:
   ```json
   "pressKeys": "Press keys...",
   "cancel": "Cancel",
   "record": "Record",
   "reset": "Reset",
   "resetTooltip": "Reset to default"
   ```

2. Reescribe completamente `src/features/settings/ShortcutsDialog.tsx`:
   ```tsx
   import { useEffect, useMemo, useState } from 'react';
   import { useTranslation } from 'react-i18next';

   import {
     Dialog,
     DialogContent,
     DialogDescription,
     DialogFooter,
     DialogHeader,
     DialogTitle,
   } from '../../components/ui/dialog';
   import { Button } from '../../components/ui/button';
   import {
     COMMAND_REGISTRY,
     type CommandId,
     detectConflicts,
     normalizeBinding,
   } from '../../lib/shortcuts';

   type ShortcutsDialogProps = {
     open: boolean;
     onClose: () => void;
     shortcuts: Partial<Record<CommandId, string | null>>;
     onChange: (shortcuts: Partial<Record<CommandId, string | null>>) => void;
   };

   function eventToBinding(event: KeyboardEvent): string {
     const parts: string[] = [];
     if (event.metaKey || event.ctrlKey) parts.push('Mod');
     if (event.shiftKey) parts.push('Shift');
     if (event.altKey) parts.push('Alt');
     if (
       event.key &&
       !['Meta', 'Control', 'Shift', 'Alt'].includes(event.key)
     ) {
       parts.push(event.key);
     }
     return parts.join('+');
   }

   export function ShortcutsDialog({
     open,
     onClose,
     shortcuts,
     onChange,
   }: ShortcutsDialogProps) {
     const { t } = useTranslation();
     const [editingId, setEditingId] = useState<CommandId | null>(null);
     const [isCapturing, setIsCapturing] = useState(false);
     const [capturedBinding, setCapturedBinding] = useState('');
     const conflicts = useMemo(() => detectConflicts(shortcuts), [shortcuts]);

     useEffect(() => {
       if (!isCapturing || !editingId) return;
       const handleKeyDown = (event: KeyboardEvent) => {
         event.preventDefault();
         event.stopPropagation();
         if (event.key === 'Escape') {
           setIsCapturing(false);
           setCapturedBinding('');
           return;
         }
         if (event.key === 'Backspace' || event.key === 'Delete') {
           onChange({ ...shortcuts, [editingId]: null });
           setIsCapturing(false);
           setCapturedBinding('');
           setEditingId(null);
           return;
         }
         const binding = eventToBinding(event);
         setCapturedBinding(binding);
         onChange({ ...shortcuts, [editingId]: binding });
         setIsCapturing(false);
         setCapturedBinding('');
       };
       window.addEventListener('keydown', handleKeyDown);
       return () => window.removeEventListener('keydown', handleKeyDown);
     }, [isCapturing, editingId, shortcuts, onChange]);

     return (
       <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
         <DialogContent className="max-w-lg">
           <DialogHeader>
             <DialogTitle>{t('shortcuts.title')}</DialogTitle>
             <DialogDescription className="sr-only">
               {t('shortcuts.title')}
             </DialogDescription>
           </DialogHeader>

           <div className="max-h-[60vh] overflow-y-auto">
             <table className="w-full text-sm">
               <thead>
                 <tr className="border-b border-border">
                   <th className="py-2 text-left">{t('shortcuts.command')}</th>
                   <th className="py-2 text-left">{t('shortcuts.binding')}</th>
                 </tr>
               </thead>
               <tbody>
                 {Object.values(COMMAND_REGISTRY).map((cmd) => {
                   const binding = shortcuts[cmd.id] ?? cmd.defaultShortcut;
                   const conflict = binding
                     ? (conflicts.get(normalizeBinding(binding)) ?? [])
                     : [];
                   const hasConflict = conflict.length > 1;
                   return (
                     <tr key={cmd.id} className="border-b border-border">
                       <td className="py-2">{t(`shortcuts.${cmd.id}`)}</td>
                       <td className="py-2">
                         {editingId === cmd.id ? (
                           <div className="flex items-center gap-2">
                             <input
                               className="w-32 rounded border border-border bg-background px-2 py-1 text-sm"
                               autoFocus
                               value={isCapturing ? capturedBinding : (binding ?? '')}
                               onChange={(e) => {
                                 setIsCapturing(false);
                                 const val = e.target.value.trim() || null;
                                 onChange({ ...shortcuts, [cmd.id]: val });
                               }}
                               onBlur={() => {
                                 setIsCapturing(false);
                                 setEditingId(null);
                               }}
                               onKeyDown={(e) => {
                                 if (e.key === 'Enter') setEditingId(null);
                               }}
                               placeholder={isCapturing ? t('shortcuts.pressKeys') : ''}
                             />
                             <Button
                               size="sm"
                               variant="secondary"
                               type="button"
                               onClick={() => setIsCapturing(!isCapturing)}
                             >
                               {isCapturing ? t('shortcuts.cancel') : t('shortcuts.record')}
                             </Button>
                             {shortcuts[cmd.id] !== undefined && shortcuts[cmd.id] !== null && (
                               <Button
                                 size="sm"
                                 variant="destructive"
                                 type="button"
                                 title={t('shortcuts.resetTooltip')}
                                 onClick={() => {
                                   onChange({ ...shortcuts, [cmd.id]: null });
                                   setIsCapturing(false);
                                 }}
                               >
                                 {t('shortcuts.reset')}
                               </Button>
                             )}
                           </div>
                         ) : (
                           <button
                             className={`rounded px-2 py-1 text-sm ${
                               hasConflict
                                 ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
                                 : 'bg-background hover:bg-accent'
                             }`}
                             type="button"
                             onClick={() => setEditingId(cmd.id)}
                           >
                             {binding ?? t('shortcuts.unbound')}
                           </button>
                         )}
                       </td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
           </div>

           <DialogFooter>
             <Button variant="outline" onClick={onClose}>
               {t('preferences.close')}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     );
   }
   ```

3. Verifica que en `src/components/ui/dialog.tsx` existe `DialogFooter` (lo exporta shadcn por defecto). Si no, sustitúyelo por un `<div className="mt-4 flex justify-end">`.

**Verificación:** `pnpm lint && pnpm test && pnpm build`. Manual en `pnpm dev`: abre Preferences → Shortcuts. El modal ahora respeta Esc y restaura foco al cerrar.

**Commit:**
```
refactor(m3): migra ShortcutsDialog a shadcn Dialog
```

---

### Receta M2 — `PreferencesDialog`: shadcn Checkbox / Select / Slider

**Esfuerzo:** M · **Riesgo:** medio

**Objetivo:** Sustituir los `<input type="checkbox/number/range">` y `<select>` nativos por las primitivas shadcn correspondientes para coherencia visual y dark mode.

**Pre-requisitos:**

1. Instala las dependencias Radix:
   ```sh
   pnpm add @radix-ui/react-checkbox @radix-ui/react-select @radix-ui/react-slider
   ```

2. Añade los componentes shadcn al repo. **Si tienes red e internet en la máquina:**
   ```sh
   pnpm dlx shadcn@latest add checkbox select slider
   ```
   Esto crea `src/components/ui/{checkbox,select,slider}.tsx`.

   **Si NO tienes acceso al CLI shadcn**, copia manualmente las plantillas oficiales para `style: new-york` desde https://ui.shadcn.com/docs/components a esos paths. Asegúrate de que importan `cn` desde `'@/lib/utils'`.

**Pasos de migración** (en `src/features/settings/PreferencesDialog.tsx`):

3. Importa los nuevos componentes:
   ```tsx
   import { Checkbox } from '../../components/ui/checkbox';
   import {
     Select,
     SelectContent,
     SelectItem,
     SelectTrigger,
     SelectValue,
   } from '../../components/ui/select';
   import { Slider } from '../../components/ui/slider';
   ```

4. Reemplaza cada `<input type="checkbox" checked={x} onChange={(e) => setX(e.target.checked)} />` por:
   ```tsx
   <Checkbox checked={x} onCheckedChange={(v) => setX(Boolean(v))} />
   ```

5. Reemplaza el `<select>` por:
   ```tsx
   <Select value={fontFamily} onValueChange={setFontFamily}>
     <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
     <SelectContent>
       <SelectItem value="sans">{t('preferences.fontSans')}</SelectItem>
       <SelectItem value="serif">{t('preferences.fontSerif')}</SelectItem>
       <SelectItem value="mono">{t('preferences.fontMono')}</SelectItem>
     </SelectContent>
   </Select>
   ```

6. Reemplaza cada `<input type="number">` (tabSize, etc.) por:
   ```tsx
   <input
     type="number"
     className="h-9 w-20 rounded-md border border-input bg-background px-2 text-sm"
     value={tabSize}
     onChange={(e) => setTabSize(Number(e.target.value))}
   />
   ```
   (Para number-input pulido, considera usar `Input` de shadcn si lo añades, pero un input estilizado vale.)

7. Si hay un `<input type="range">` (zoom/font size), reemplázalo por:
   ```tsx
   <Slider
     value={[fontScale]}
     min={0.6}
     max={2.0}
     step={0.05}
     onValueChange={([v]) => setFontScale(v)}
     aria-valuetext={`${Math.round(fontScale * 100)}%`}
   />
   ```

**Verificación:** `pnpm lint && pnpm test && pnpm build`. Manual: abre Preferences y prueba cada control.

**Commit:**
```
refactor(m2): migra PreferencesDialog a primitivas shadcn (checkbox/select/slider)
```

---

### Receta M13 — View-mode bar con Radix Tabs

**Esfuerzo:** M · **Riesgo:** medio

**Objetivo:** Reemplazar los 3 `<button aria-pressed>` de view-mode por un `<Tabs>` de Radix para tener navegación por flechas, Home/End y un indicator activo unificado.

**Pre-requisitos:**

1. Instala Radix tabs:
   ```sh
   pnpm add @radix-ui/react-tabs
   ```
2. Añade el componente shadcn:
   ```sh
   pnpm dlx shadcn@latest add tabs
   ```
   o copia manualmente la plantilla en `src/components/ui/tabs.tsx`.

**Pasos:**

3. En `src/App.tsx` (líneas ~1313-1328), localiza el bloque:
   ```tsx
   <div className="flex items-center gap-1">
     {VIEW_MODES.map((mode) => (
       <button … aria-pressed={viewMode === mode} …>{t(`view.mode.${mode}`)}</button>
     ))}
   </div>
   ```

4. Reemplázalo por:
   ```tsx
   <Tabs
     value={viewMode}
     onValueChange={(v) => setViewMode(v as ViewMode)}
     className="inline-flex"
   >
     <TabsList>
       {VIEW_MODES.map((mode) => (
         <TabsTrigger key={mode} value={mode}>
           {t(`view.mode.${mode}`)}
         </TabsTrigger>
       ))}
     </TabsList>
   </Tabs>
   ```
   Importa `Tabs, TabsList, TabsTrigger` desde `'./components/ui/tabs'`.

**Verificación:** `pnpm lint && pnpm test && pnpm build`. Manual: focus en uno de los tres tabs, pulsa flecha derecha/izquierda → debería navegar entre modos.

**Commit:**
```
refactor(m13): view-mode bar usa Radix Tabs
```

---

### Receta B1 — Lucide imports canónicos

**Esfuerzo:** S · **Riesgo:** bajo (verificable con `pnpm build:analyze`)

**Objetivo:** Verificar si los imports `lucide-react/dist/esm/icons/*.js` realmente reducen bundle, o si se pueden cambiar al import canónico `import { X } from 'lucide-react'`.

**Pasos:**

1. Anota el tamaño actual del bundle principal:
   ```sh
   pnpm build 2>&1 | grep "index-.*\.js"
   ```
   Anota el `gzip:` del bundle más grande.

2. Crea una rama de prueba (o stash) y aplica el cambio en un archivo, p.ej. `src/App.tsx`:
   ```tsx
   // Antes:
   import Columns2 from 'lucide-react/dist/esm/icons/columns-2.js';

   // Después:
   import { Columns2 } from 'lucide-react';
   ```
3. Vuelve a buildear y comparar.

4. Si el tamaño es **igual o menor**, aplica el cambio a TODOS los archivos:
   ```sh
   grep -rln "lucide-react/dist/esm/icons" src/
   ```
   Para cada archivo, agrupa todos los imports lucide en uno solo.

   Pista para automatizar (revisa el resultado a mano antes de ejecutar):
   ```sh
   # No hagas un find/replace ciego — los nombres pasan de PascalCase
   # archivo a PascalCase nombrado (column-2.js → Columns2). Ya están así
   # los locales import default, así que la forma rápida es aplicarlo
   # archivo por archivo con un editor.
   ```

5. Si el tamaño **aumenta**, NO apliques el cambio. Documenta el motivo con un comentario en el primer import:
   ```tsx
   // Imports per-icon de lucide para mantener bundle bajo (verificado YYYY-MM-DD).
   ```

**Verificación:** `pnpm lint && pnpm test && pnpm build`.

**Commit (si aplica):**
```
refactor(b1): imports canonicos de lucide-react
```

---

### Receta B3 — `<kbd>` con shortcuts en Welcome

**Esfuerzo:** S · **Riesgo:** muy bajo

**Objetivo:** Mostrar atajos de teclado descubribles en las 3 tarjetas del onboarding.

**Archivo:** `src/features/shell/WelcomeState.tsx` (líneas 76-110).

**Pasos:**

1. En la parte superior del archivo, importa el registry:
   ```tsx
   import { COMMAND_REGISTRY } from '../../lib/shortcuts';
   ```

2. Antes del `return`, dentro del componente, calcula:
   ```tsx
   const shortcuts = {
     newDocument: COMMAND_REGISTRY.newDocument.defaultShortcut,
     toggleSearch: COMMAND_REGISTRY.toggleSearch.defaultShortcut,
     toggleViewMode: COMMAND_REGISTRY.toggleViewMode.defaultShortcut,
   };
   ```

3. Crea un helper local (arriba del componente, fuera de él):
   ```tsx
   function Kbd({ value }: { value: string | null }) {
     if (!value) return null;
     const parts = value.replace('Mod', '⌘').split('+');
     return (
       <span className="ml-1 inline-flex items-center gap-1">
         {parts.map((p) => (
           <kbd
             key={p}
             className="rounded border border-emerald-950/10 bg-white/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground shadow-sm dark:border-white/10 dark:bg-white/10"
           >
             {p}
           </kbd>
         ))}
       </span>
     );
   }
   ```

4. En cada una de las 3 tarjetas, añade un `<Kbd>` al final del párrafo descriptivo:
   - Tarjeta Shortcuts: `<Kbd value={shortcuts.newDocument} />`
   - Tarjeta Search: `<Kbd value={shortcuts.toggleSearch} />`
   - Tarjeta Preview: `<Kbd value={shortcuts.toggleViewMode} />`

**Verificación:** `pnpm lint && pnpm test && pnpm build`. Manual: abre la app sin documento previo y revisa que las tarjetas muestran las teclas.

**Commit:**
```
feat(b3): muestra atajos de teclado en las tarjetas de Welcome
```

---

### Receta B4 — Actualizar `FRONTEND_IMPROVEMENTS.md`

**Esfuerzo:** S · **Riesgo:** ninguno

**Objetivo:** El punto 9 ("Status bar básica") está obsoleto: ya tiene iconos.

**Archivo:** `FRONTEND_IMPROVEMENTS.md`.

**Pasos:**

1. Localiza el punto "### 9. Status bar basica".
2. Reemplaza su contenido por:
   ```md
   ### 9. ✅ Status bar — RESUELTO

   `StatusBar.tsx:34-78` ya muestra iconos (`Type`, `Languages`, `MoonStar`, `CheckCheck`, `CircleDot`) junto a cada métrica. Pendiente de futuro: icono animado para autosave activo (ver punto 5 de DESIGN_REVIEW.md, sin priorizar).
   ```

**Verificación:** `pnpm lint && pnpm test`.

**Commit:**
```
docs(b4): marca punto 9 de FRONTEND_IMPROVEMENTS como resuelto
```

---

### Receta B5 — ErrorBoundary en root

**Esfuerzo:** S · **Riesgo:** bajo

**Objetivo:** Que una excepción de render no mate la app entera; en su lugar, mostrar pantalla degradada con botón Reload.

**Archivos:** crear `src/components/ErrorBoundary.tsx`, modificar `src/main.tsx`.

**Pasos:**

1. Crea `src/components/ErrorBoundary.tsx`:
   ```tsx
   import { Component, type ErrorInfo, type ReactNode } from 'react';

   type Props = { children: ReactNode };
   type State = { error: Error | null };

   export class ErrorBoundary extends Component<Props, State> {
     state: State = { error: null };

     static getDerivedStateFromError(error: Error): State {
       return { error };
     }

     componentDidCatch(error: Error, info: ErrorInfo): void {
       // Local-first: solo console, sin telemetria
       // eslint-disable-next-line no-console
       console.error('[ErrorBoundary]', error, info);
     }

     render(): ReactNode {
       if (this.state.error) {
         return (
           <div className="grid min-h-dvh place-items-center bg-background p-6 text-foreground">
             <div className="max-w-md text-center">
               <h1 className="text-xl font-semibold">Algo se rompio</h1>
               <p className="mt-2 text-sm text-muted-foreground">
                 La aplicacion encontro un error inesperado. Recarga para
                 reintentar.
               </p>
               <pre className="mt-4 max-h-40 overflow-auto rounded bg-muted p-2 text-left text-xs">
                 {this.state.error.message}
               </pre>
               <button
                 type="button"
                 className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                 onClick={() => window.location.reload()}
               >
                 Recargar
               </button>
             </div>
           </div>
         );
       }
       return this.props.children;
     }
   }
   ```

2. En `src/main.tsx` envuelve `<App />`:
   ```tsx
   import { ErrorBoundary } from './components/ErrorBoundary';

   ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
     <React.StrictMode>
       <ErrorBoundary>
         <App />
       </ErrorBoundary>
       <Toaster />
     </React.StrictMode>
   );
   ```

3. (Opcional) Añade un test que renderice un componente que tira: `tests/error-boundary.test.tsx`. Mantén el test simple, no lo dejes tirado si no añade valor obvio.

**Verificación:** `pnpm lint && pnpm test && pnpm build`.

**Commit:**
```
feat(b5): error boundary en root para errores de render
```

---

### Receta B8 — Drag-over feedback en TabBar

**Esfuerzo:** S · **Riesgo:** bajo

**Objetivo:** Cuando arrastras una pestaña sobre otra, mostrar dónde caerá.

**Archivo:** `src/features/files/TabBar.tsx`.

**Pasos:**

1. Cambia el `useRef<number | null>(null)` por `useState`:
   ```tsx
   const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
   const draggedTabId = useRef<string | null>(null);
   ```
2. En `handleDragOver` reemplaza la asignación `dragOverIndex.current = index` por `setDragOverIndex(index)`.
3. En `handleDrop` añade `setDragOverIndex(null)` al final.
4. Añade un `onDragLeave` al wrapper o un `onDragEnd` que limpie:
   ```tsx
   onDragEnd={() => setDragOverIndex(null)}
   ```
5. En el render del `<div>` por pestaña, añade clase condicional:
   ```tsx
   className={`group relative flex shrink-0 items-center gap-1.5 rounded-2xl px-3 py-2 transition ${
     active ? '...' : '...'
   } ${
     dragOverIndex === tabs.indexOf(tab) ? 'border-l-2 border-primary' : ''
   }`}
   ```

**Verificación:** `pnpm lint && pnpm test && pnpm build`. Manual: arrastra una pestaña, deberías ver un borde primary en la posición destino.

**Commit:**
```
feat(b8): feedback visual de drag-over en TabBar
```

---

### Receta B9 — Botón de zoom con icono visible

**Esfuerzo:** S · **Riesgo:** muy bajo

**Objetivo:** El botón "100%" actual oculta su acción de reset. Mostrar un icono cuando el scale ≠ 1 para que sea descubrible.

**Archivo:** `src/App.tsx` (líneas ~1228-1240).

**Pasos:**

1. Importa el icono:
   ```tsx
   import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw.js';
   ```
   (o usa `import { RotateCcw } from 'lucide-react'` si ya hiciste B1).

2. Modifica el bloque del botón de zoom:
   ```tsx
   <Tooltip>
     <TooltipTrigger asChild>
       <Button
         variant={fontScale === 1 ? 'ghost' : 'outline'}
         size="sm"
         onClick={resetFontScaleStore}
         className="h-9 min-w-14 rounded-full px-3 text-xs font-semibold tabular-nums"
       >
         {fontScale !== 1 && (
           <RotateCcw className="mr-1 size-3" aria-hidden />
         )}
         {Math.round(fontScale * 100)}%
       </Button>
     </TooltipTrigger>
     <TooltipContent>{t('zoom.reset')}</TooltipContent>
   </Tooltip>
   ```

**Verificación:** `pnpm lint && pnpm test && pnpm build`. Manual: cambia el zoom y comprueba que aparece el icono de reset.

**Commit:**
```
feat(b9): icono de reset visible cuando el zoom no esta a 100%
```

---

### Receta B10 — Fallback "desktop only" en `<md` para la app web

**Esfuerzo:** S · **Riesgo:** bajo

**Objetivo:** Si alguien abre `bruma-sigma.vercel.app` en móvil, mostrar mensaje en lugar de la UI rota. Solo aplica fuera de Tauri.

**Archivos:** `src/App.tsx` (cabeza del componente App), `src/i18n/locales/{es,en}.json`.

**Pasos:**

1. Añade keys i18n. En `es.json`:
   ```json
   "mobileFallback": {
     "title": "Bruma esta optimizado para escritorio",
     "body": "Para una experiencia completa, abre Bruma en una ventana mas ancha o instala la aplicacion de escritorio."
   }
   ```
   En `en.json` el equivalente.

2. En `src/App.tsx`, dentro del componente `App`, antes del `return` principal, añade:
   ```tsx
   const isTauri =
     typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
   const [isNarrow, setIsNarrow] = useState(
     typeof window !== 'undefined' && window.innerWidth < 768
   );
   useEffect(() => {
     if (isTauri) return;
     const onResize = () => setIsNarrow(window.innerWidth < 768);
     window.addEventListener('resize', onResize);
     return () => window.removeEventListener('resize', onResize);
   }, [isTauri]);

   if (!isTauri && isNarrow) {
     return (
       <div className="grid min-h-dvh place-items-center bg-background p-6 text-foreground">
         <div className="max-w-sm text-center">
           <h1 className="text-lg font-semibold">{t('mobileFallback.title')}</h1>
           <p className="mt-2 text-sm text-muted-foreground">
             {t('mobileFallback.body')}
           </p>
         </div>
       </div>
     );
   }
   ```

**Verificación:** `pnpm lint && pnpm test && pnpm build`. Manual con `pnpm preview`: redimensiona la ventana a <768px → debe mostrar el fallback.

**Commit:**
```
feat(b10): fallback desktop-only en la app servida por web
```

---

### Receta A5 — Extraer Toolbar / AppShell de `App.tsx` ⚠ requiere QA visual

**Esfuerzo:** L · **Riesgo:** alto (no implementar sin poder probar la UI)

**Objetivo:** Romper el monolito de `App.tsx` (1638 líneas) en subcomponentes para que sea mantenible.

**Pre-requisito:** acceso a `pnpm tauri dev` o al menos `pnpm dev` en navegador para validar visualmente.

**Estrategia incremental** (no hagas todo en un commit; uno por extracción):

1. **Commit 1 — extraer ViewModeBar:**
   - Crea `src/features/shell/ViewModeBar.tsx`.
   - Mueve el bloque del view-mode bar (App.tsx ~1310-1340) ahí, recibiendo `viewMode`, `setViewMode`, `showFrontmatter`, `setShowFrontmatter` como props.

2. **Commit 2 — extraer cinco subcomponentes de Toolbar:**
   - `src/features/shell/toolbar/ToolbarFile.tsx` → grupo File.
   - `src/features/shell/toolbar/ToolbarWrite.tsx` → grupo Edit.
   - `src/features/shell/toolbar/ToolbarView.tsx` → grupo View.
   - `src/features/shell/toolbar/ToolbarZoom.tsx` → grupo Zoom.
   - `src/features/shell/toolbar/ToolbarExport.tsx` → grupo Export.
   - Cada uno recibe los handlers/state que necesita como props.

3. **Commit 3 — extraer hook `useTauriMenuBridge`:**
   - Mueve los `useEffect` de `listenToMenuActions` y `listenToRecentOpen` a `src/hooks/useTauriMenuBridge.ts`.
   - Llamada en App: `useTauriMenuBridge({ handlers, setIsRecentMenuOpen })`.

4. **Commit 4 — extraer `<AppShell>`:**
   - Crea `src/features/shell/AppShell.tsx` que reciba props/slots `header`, `tabs`, `main`, `status`.
   - App pasa a ser orquestador delgado.

**Verificación CRÍTICA:** Después de cada commit:
- `pnpm test` (102/102).
- `pnpm dev` y prueba a mano: nuevo, abrir, guardar, cambiar view-mode, alternar tema, alternar TOC, focus mode.
- `pnpm tauri dev` si tienes Rust instalado.

**Riesgo principal:** los handlers se construyen con muchas dependencias del store; si extraes mal, romperás callbacks. Pasa siempre por props, no leas stores en los hijos hasta haber estabilizado.

**Si en algún paso fallan tests sin razón obvia, REVERT y abre issue antes de seguir.**

**Commits sugeridos:**
```
refactor(a5.1): extrae ViewModeBar a su propio componente
refactor(a5.2): extrae los 5 ToolbarGroup a subcomponentes
refactor(a5.3): mueve listeners de menu Tauri a useTauriMenuBridge
refactor(a5.4): introduce AppShell para alojar header/tabs/main/status
```

---

### Receta A6 — `useShallow` en selectores Zustand ⚠ requiere QA visual

**Esfuerzo:** M · **Riesgo:** alto

**Objetivo:** Reducir re-renders del componente raíz agrupando selectores con shallow comparison.

**Pre-requisito:** completa A5 antes de hacer A6 — con subcomponentes ya extraídos, A6 es trivial dentro de cada uno; sin extraer, romper selectores en el monolito puede causar bugs sutiles.

**Pasos:**

1. En cada subcomponente (post-A5), agrupa selectores:
   ```tsx
   import { useShallow } from 'zustand/react/shallow';

   const { viewMode, setViewMode, focusMode, toggleFocusMode } = useThemeStore(
     useShallow((s) => ({
       viewMode: s.viewMode,
       setViewMode: s.setViewMode,
       focusMode: s.focusMode,
       toggleFocusMode: s.toggleFocusMode,
     }))
   );
   ```

2. **Test cuidadoso:** después del cambio, escribe rápido en el editor y observa con React DevTools que el shell **no** re-renderiza por keystroke. Si lo hace, hay un selector que aún devuelve referencia nueva.

**Verificación:** `pnpm lint && pnpm test && pnpm build`. Manual con React DevTools Profiler.

**Commit:**
```
perf(a6): useShallow en selectores Zustand para evitar re-renders
```

---

### Receta B6 — Tests de regresión visual (Playwright snapshots) ⚠ requiere setup

**Esfuerzo:** M · **Riesgo:** bajo (no afecta runtime)

**Objetivo:** Capturar snapshots de pantallas clave para detectar regresiones visuales en CI.

**Pre-requisito:** El primero que ejecute esto debe generar la baseline de snapshots a mano (`--update-snapshots`), commitearlos, y a partir de ahí CI los compara.

**Pasos:**

1. Verifica que `playwright.config.ts` tiene la baseURL apuntando a `pnpm preview` o al dev server.

2. Crea `tests/visual.spec.ts`:
   ```ts
   import { expect, test } from '@playwright/test';

   test('Welcome state — light', async ({ page }) => {
     await page.goto('/');
     // Aqui ajusta para que el tema sea light explicitamente:
     await page.evaluate(() => localStorage.setItem('theme', 'light'));
     await page.reload();
     await expect(page).toHaveScreenshot('welcome-light.png', {
       maxDiffPixelRatio: 0.01,
     });
   });

   test('Welcome state — dark', async ({ page }) => {
     await page.goto('/');
     await page.evaluate(() => localStorage.setItem('theme', 'dark'));
     await page.reload();
     await expect(page).toHaveScreenshot('welcome-dark.png');
   });
   ```

3. Genera la baseline:
   ```sh
   pnpm test:e2e --update-snapshots
   ```
   Commitea los `.png` generados en `tests/visual.spec.ts-snapshots/`.

4. Añade a `.github/workflows/ci.yml` un step:
   ```yaml
   - name: Visual tests
     run: pnpm test:e2e
   ```

**Verificación:** corre `pnpm test:e2e` localmente; debe pasar contra los snapshots commiteados.

**Commit:**
```
test(b6): tests de regresion visual con Playwright snapshots
```

---

### Receta B7 — Tema CodeMirror coherente con la marca ⚠ requiere QA visual

**Esfuerzo:** M · **Riesgo:** bajo

**Objetivo:** El editor CodeMirror usa colores default. Crear un tema coherente con esmeralda + niebla.

**Pre-requisito:** familiaridad con `@codemirror/view` `EditorView.theme()`.

**Pasos:**

1. Crea `src/features/editor/theme.ts`:
   ```ts
   import { EditorView } from '@codemirror/view';

   export const brumaLightTheme = EditorView.theme(
     {
       '&': { color: 'hsl(var(--foreground))', backgroundColor: 'transparent' },
       '.cm-content': { caretColor: 'hsl(var(--primary))' },
       '.cm-cursor': { borderLeftColor: 'hsl(var(--primary))' },
       '.cm-selectionBackground': { backgroundColor: 'hsl(var(--accent))' },
       '.cm-line .ͼ1': { color: '#047857' /* keywords */ },
       // Marca headings, code, etc. — ajusta a gusto.
     },
     { dark: false }
   );

   export const brumaDarkTheme = EditorView.theme(
     {
       /* equivalente con tokens dark */
     },
     { dark: true }
   );
   ```

2. En `src/features/editor/MarkdownEditor.tsx`, importa el tema y añádelo al array de extensions de CodeMirror, condicionando por `theme === 'dark'`.

**Verificación:** `pnpm lint && pnpm test && pnpm build`. **Visual en `pnpm dev`** — ajusta selectores hasta que la sintaxis Markdown se vea integrada.

**Commit:**
```
style(b7): tema CodeMirror coherente con la marca
```

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
