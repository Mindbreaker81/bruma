import { describe, expect, it } from 'vitest';

import { getNextThemePreference, resolveThemePreference } from './theme';

describe('theme helpers', () => {
  it('resolves system preference from media state', () => {
    expect(resolveThemePreference('system', true)).toBe('dark');
    expect(resolveThemePreference('system', false)).toBe('light');
  });

  it('cycles through light, dark and system', () => {
    expect(getNextThemePreference('light')).toBe('dark');
    expect(getNextThemePreference('dark')).toBe('system');
    expect(getNextThemePreference('system')).toBe('light');
  });
});
