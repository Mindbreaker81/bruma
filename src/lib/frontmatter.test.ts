import { describe, expect, it } from 'vitest';

import { parseFrontmatter, stripFrontmatter } from './frontmatter';

describe('frontmatter', () => {
  it('parses a leading YAML block and returns the body', () => {
    const source = [
      '---',
      'title: Hola',
      "tags: ['a','b']",
      '---',
      '',
      '# Cuerpo',
      '',
    ].join('\n');
    const result = parseFrontmatter(source);
    expect(result.frontmatter).toBe("title: Hola\ntags: ['a','b']");
    expect(result.body.startsWith('\n# Cuerpo')).toBe(true);
    expect(result.fields.title).toBe('Hola');
  });

  it('returns the body untouched when there is no frontmatter', () => {
    expect(parseFrontmatter('# Solo cuerpo')).toEqual({
      frontmatter: null,
      body: '# Solo cuerpo',
      fields: {},
    });
  });

  it('ignores partial fences', () => {
    expect(parseFrontmatter('---\nno fence end').frontmatter).toBeNull();
  });

  it('strips quotes from simple values', () => {
    const result = parseFrontmatter('---\nslug: "hola-mundo"\n---\n');
    expect(result.fields.slug).toBe('hola-mundo');
  });

  it('exposes a stripFrontmatter helper', () => {
    const text = '---\nx: 1\n---\nbody';
    expect(stripFrontmatter(text)).toBe('body');
  });

  it('supports CRLF source', () => {
    const text = '---\r\nx: 1\r\n---\r\nbody';
    expect(parseFrontmatter(text).body).toBe('body');
  });
});
