import { HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

/**
 * Realce de sintaxis para Markdown, sobrio y coherente con los tokens de tema
 * de Bruma. Un único `HighlightStyle` sirve para tema claro y oscuro porque los
 * colores usan variables CSS que ya cambian con el tema.
 */
export const brumaHighlightStyle = HighlightStyle.define([
  // Encabezados: mayor peso y tamaño escalonado.
  { tag: t.heading1, fontSize: '1.4em', fontWeight: '600', color: 'hsl(var(--foreground))' },
  { tag: t.heading2, fontSize: '1.25em', fontWeight: '600', color: 'hsl(var(--foreground))' },
  { tag: t.heading3, fontSize: '1.1em', fontWeight: '600', color: 'hsl(var(--foreground))' },
  { tag: [t.heading4, t.heading5, t.heading6], fontWeight: '600', color: 'hsl(var(--foreground))' },

  // Énfasis.
  { tag: t.strong, fontWeight: '700' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },

  // Código inline/bloque: familia monoespaciada.
  {
    tag: [t.monospace, t.contentSeparator],
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },

  // Enlaces: color de acento + subrayado.
  { tag: [t.link, t.url], color: 'hsl(var(--primary))', textDecoration: 'underline' },

  // Citas: color atenuado.
  { tag: t.quote, color: 'hsl(var(--muted-foreground))' },

  // Marcadores (#, *, `, -, etc.): atenuados sin ocultarlos.
  {
    tag: [t.processingInstruction, t.meta, t.list],
    color: 'hsl(var(--muted-foreground))',
  },
]);
