import { describe, expect, it } from 'vitest';

import { parseHeadings, slugify } from './toc';

describe('toc', () => {
  it('parses ATX headings with line numbers', () => {
    const source = ['# Top', '', 'Body', '## Sub', '### Deep'].join('\n');
    const entries = parseHeadings(source);
    expect(entries).toEqual([
      { level: 1, text: 'Top', line: 0, slug: 'top' },
      { level: 2, text: 'Sub', line: 3, slug: 'sub' },
      { level: 3, text: 'Deep', line: 4, slug: 'deep' },
    ]);
  });

  it('ignores headings inside fenced code blocks', () => {
    const source = [
      '# Real',
      '```',
      '# Fake heading',
      '```',
      '## Real two',
    ].join('\n');
    const entries = parseHeadings(source);
    expect(entries.map((entry) => entry.text)).toEqual(['Real', 'Real two']);
  });

  it('disambiguates duplicate slugs', () => {
    const source = ['# Notas', '## Detalles', '## Detalles'].join('\n');
    const entries = parseHeadings(source);
    expect(entries.map((entry) => entry.slug)).toEqual([
      'notas',
      'detalles',
      'detalles-1',
    ]);
  });

  it('slugifies accents and punctuation', () => {
    expect(slugify('Café & Té')).toBe('cafe-te');
    expect(slugify('Año 2025: balance')).toBe('ano-2025-balance');
  });

  it('returns empty list when there are no headings', () => {
    expect(parseHeadings('Solo texto plano.\nOtra línea.')).toEqual([]);
  });
});
