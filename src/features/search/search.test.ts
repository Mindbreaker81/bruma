import { describe, expect, it } from 'vitest';

import {
  findSearchMatches,
  getNextSearchIndex,
  getPreviousSearchIndex,
  normalizeSearchIndex,
  replaceAllMatches,
  replaceMatchAt,
} from './search';

describe('search helpers', () => {
  it('finds case-insensitive matches by default', () => {
    expect(findSearchMatches('Bruma bruma BRUMA', 'bruma', false)).toEqual([
      { from: 0, to: 5 },
      { from: 6, to: 11 },
      { from: 12, to: 17 },
    ]);
  });

  it('honors case-sensitive search', () => {
    expect(findSearchMatches('Bruma bruma', 'bruma', true)).toEqual([
      { from: 6, to: 11 },
    ]);
  });

  it('normalizes active index for navigation', () => {
    expect(normalizeSearchIndex(3, 3)).toBe(0);
    expect(getNextSearchIndex(2, 3)).toBe(0);
    expect(getPreviousSearchIndex(0, 3)).toBe(2);
    expect(normalizeSearchIndex(4, 0)).toBe(0);
  });

  it('replaces only the active match', () => {
    const matches = findSearchMatches('foo foo foo', 'foo', false);
    const result = replaceMatchAt('foo foo foo', matches, 1, 'BAR');
    expect(result.content).toBe('foo BAR foo');
    expect(result.replacements).toBe(1);
    expect(result.cursor).toBe(7);
  });

  it('replaces all matches at once', () => {
    const matches = findSearchMatches('a-a-a', 'a', false);
    const result = replaceAllMatches('a-a-a', matches, 'X');
    expect(result.content).toBe('X-X-X');
    expect(result.replacements).toBe(3);
  });

  it('returns no-op when there are no matches', () => {
    const matches = findSearchMatches('nada', 'xx', false);
    expect(replaceMatchAt('nada', matches, 0, 'y').content).toBe('nada');
    expect(replaceAllMatches('nada', matches, 'y').replacements).toBe(0);
  });
});
