import { describe, expect, it } from 'vitest';

import {
  getShortcutById,
  resolveShortcut,
  SHORTCUT_GROUPS,
} from './shortcutsCatalog';

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

  it('exposes the editing actions added by the clipboard plan', () => {
    const edit = SHORTCUT_GROUPS.find((group) => group.id === 'edit');
    const ids = edit?.items.map((item) => item.id) ?? [];

    for (const id of [
      'edit.undo',
      'edit.redo',
      'edit.cut',
      'edit.copy',
      'edit.paste',
      'edit.selectAll',
      'edit.replace',
    ]) {
      expect(ids).toContain(id);
    }
  });

  it('declares the Windows redo alternative and resolves it off Apple', () => {
    const redo = getShortcutById('edit.redo');
    expect(redo?.shortcut).toBe('Mod-Shift-Z');
    expect(redo?.shortcutWindows).toBe('Mod-Y');
    // Tests run in jsdom (non-Apple platform).
    if (redo) {
      expect(resolveShortcut(redo)).toBe('Mod-Y');
    }
  });

  it('has no duplicate shortcuts within a group', () => {
    for (const group of SHORTCUT_GROUPS) {
      const seen = new Set<string>();
      for (const item of group.items) {
        for (const shortcut of [item.shortcut, item.shortcutWindows]) {
          if (!shortcut) continue;
          expect(seen.has(shortcut)).toBe(false);
          seen.add(shortcut);
        }
      }
    }
  });
});
