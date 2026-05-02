import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  detectConflicts,
  formatBindingForDisplay,
  matchBinding,
  normalizeBinding,
} from './shortcuts';

describe('normalizeBinding', () => {
  it('converts meta/ctrl/cmd to mod', () => {
    expect(normalizeBinding('Ctrl+S')).toBe('mod+s');
    expect(normalizeBinding('Meta+T')).toBe('mod+t');
    expect(normalizeBinding('cmd+a')).toBe('mod+a');
  });

  it('handles spaces as plus separators', () => {
    expect(normalizeBinding('Mod Shift N')).toBe('mod+shift+n');
  });
});

describe('matchBinding', () => {
  it('matches a simple mod+key binding', () => {
    const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 's' });
    expect(matchBinding(event, 'mod+s')).toBe(true);
  });

  it('matches meta as mod', () => {
    const event = new KeyboardEvent('keydown', { metaKey: true, key: 't' });
    expect(matchBinding(event, 'mod+t')).toBe(true);
  });

  it('does not match when modifier differs', () => {
    const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 's' });
    expect(matchBinding(event, 'shift+s')).toBe(false);
  });

  it('does not match when key differs', () => {
    const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'a' });
    expect(matchBinding(event, 'mod+s')).toBe(false);
  });

  it('returns false for empty binding', () => {
    const event = new KeyboardEvent('keydown', { key: 'a' });
    expect(matchBinding(event, '')).toBe(false);
  });
});

describe('detectConflicts', () => {
  it('detects conflicting bindings', () => {
    const conflicts = detectConflicts({
      saveDocument: 'mod+s',
      exportHtml: 'mod+s',
      openDocument: 'mod+o',
      toggleSearch: null,
    } as Record<string, string | null>);

    expect(conflicts.get('mod+s')).toEqual(['saveDocument', 'exportHtml']);
    expect(conflicts.get('mod+o')).toEqual(['openDocument']);
    expect(conflicts.has('null')).toBe(false);
  });
});

describe('formatBindingForDisplay', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns empty string for null', () => {
    expect(formatBindingForDisplay(null)).toBe('');
  });

  it('formats with Ctrl on non-macOS (Windows)', () => {
    vi.stubGlobal('navigator', {
      platform: 'Win32',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0)',
    });
    expect(formatBindingForDisplay('Mod+s')).toBe('Ctrl+S');
    expect(formatBindingForDisplay('Mod+Shift+s')).toBe('Ctrl+Shift+S');
    expect(formatBindingForDisplay('Mod+Alt+t')).toBe('Ctrl+Alt+T');
    expect(formatBindingForDisplay('Mod+,')).toBe('Ctrl+,');
  });

  it('formats with Ctrl on non-macOS (Linux)', () => {
    vi.stubGlobal('navigator', {
      platform: 'Linux x86_64',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
    });
    expect(formatBindingForDisplay('Mod+s')).toBe('Ctrl+S');
    expect(formatBindingForDisplay('Mod+Shift+Tab')).toBe('Ctrl+Shift+Tab');
  });

  it('formats with symbols on macOS', () => {
    vi.stubGlobal('navigator', {
      platform: 'MacIntel',
      userAgent: 'Mozilla/5.0 (Macintosh)',
    });
    expect(formatBindingForDisplay('Mod+s')).toBe('⌘S');
    expect(formatBindingForDisplay('Mod+Shift+s')).toBe('⌘⇧S');
    expect(formatBindingForDisplay('Mod+Alt+t')).toBe('⌘⌥T');
    expect(formatBindingForDisplay('Mod+,')).toBe('⌘,');
  });
});
