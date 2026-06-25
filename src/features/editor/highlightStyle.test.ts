import { HighlightStyle } from '@codemirror/language';
import { Tag, tags as t } from '@lezer/highlight';
import { describe, expect, it } from 'vitest';

import { brumaHighlightStyle } from './highlightStyle';

function specFor(tag: Tag | readonly Tag[]): unknown | undefined {
  return brumaHighlightStyle.specs.find((spec) => {
    const specTag = (spec as { tag: Tag | readonly Tag[] }).tag;
    return Array.isArray(specTag)
      ? specTag.includes(tag as Tag)
      : specTag === tag;
  });
}

describe('brumaHighlightStyle', () => {
  it('is a valid HighlightStyle instance', () => {
    expect(brumaHighlightStyle).toBeInstanceOf(HighlightStyle);
  });

  it('defines a non-empty set of highlighting rules', () => {
    expect(brumaHighlightStyle.specs.length).toBeGreaterThan(0);
  });

  it('styles heading1 with bold weight and larger font', () => {
    const spec = specFor(t.heading1) as {
      fontWeight?: string;
      fontSize?: string;
    } | undefined;
    expect(spec).toBeDefined();
    expect(spec?.fontWeight).toBe('600');
    expect(spec?.fontSize).toBe('1.4em');
  });

  it('styles monospace tags with a monospace family', () => {
    const spec = specFor(t.monospace) as { fontFamily?: string } | undefined;
    expect(spec).toBeDefined();
    expect(spec?.fontFamily).toContain('monospace');
  });

  it('styles link tags with the primary accent color and underline', () => {
    const spec = specFor(t.link) as {
      color?: string;
      textDecoration?: string;
    } | undefined;
    expect(spec).toBeDefined();
    expect(spec?.color).toBe('hsl(var(--primary))');
    expect(spec?.textDecoration).toBe('underline');
  });

  it('attenuates markdown markers via muted-foreground', () => {
    const spec = specFor(t.processingInstruction) as {
      color?: string;
    } | undefined;
    expect(spec).toBeDefined();
    expect(spec?.color).toBe('hsl(var(--muted-foreground))');
  });

  it('styles emphasis as italic', () => {
    const spec = specFor(t.emphasis) as { fontStyle?: string } | undefined;
    expect(spec).toBeDefined();
    expect(spec?.fontStyle).toBe('italic');
  });

  it('styles strong as bold', () => {
    const spec = specFor(t.strong) as { fontWeight?: string } | undefined;
    expect(spec).toBeDefined();
    expect(spec?.fontWeight).toBe('700');
  });
});
