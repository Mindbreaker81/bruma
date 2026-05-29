import { describe, expect, it } from 'vitest';

import { getShortcutById, SHORTCUT_GROUPS } from './shortcutsCatalog';

describe('shortcutsCatalog', () => {
  it('includes expected top-level shortcut groups', () => {
    expect(SHORTCUT_GROUPS.map((group) => group.id)).toEqual([
      'file',
      'edit',
      'view',
      'format',
      'zoom',
    ]);
  });

  it('resolves known shortcuts by id', () => {
    expect(getShortcutById('file.save')?.shortcut).toBe('Mod-S');
    expect(getShortcutById('view.toggleTheme')?.shortcut).toBe('Mod-Shift-T');
    expect(getShortcutById('zoom.reset')?.shortcut).toBe('Mod-0');
  });

  it('contains formatting shortcuts exposed by the editor', () => {
    expect(getShortcutById('format.bold')?.shortcut).toBe('Mod-b');
    expect(getShortcutById('format.link')?.shortcut).toBe('Mod-k');
  });
});
