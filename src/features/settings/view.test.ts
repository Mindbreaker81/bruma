import { describe, expect, it } from 'vitest';

import { getNextViewMode } from './view';

describe('view helpers', () => {
  it('cycles through editor, split and preview', () => {
    expect(getNextViewMode('editor')).toBe('split');
    expect(getNextViewMode('split')).toBe('preview');
    expect(getNextViewMode('preview')).toBe('editor');
  });
});
