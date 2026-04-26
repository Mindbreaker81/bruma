import { describe, expect, it } from 'vitest';

import { addRecentFile, removeRecentFile } from './recent';

describe('recent files', () => {
  it('adds files uniquely at the top', () => {
    expect(addRecentFile('/tmp/a.md', ['/tmp/b.md', '/tmp/a.md'])).toEqual([
      '/tmp/a.md',
      '/tmp/b.md',
    ]);
  });

  it('limits recent files to ten entries', () => {
    const recentFiles = Array.from({ length: 12 }, (_, index) => `${index}.md`);

    expect(addRecentFile('new.md', recentFiles)).toHaveLength(10);
  });

  it('removes invalid entries', () => {
    expect(removeRecentFile('missing.md', ['ok.md', 'missing.md'])).toEqual([
      'ok.md',
    ]);
  });
});
