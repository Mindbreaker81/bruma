import { describe, expect, it } from 'vitest';

import {
  findSearchMatches,
  getNextSearchIndex,
  getPreviousSearchIndex,
  normalizeSearchIndex,
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
});
