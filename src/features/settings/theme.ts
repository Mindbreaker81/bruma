export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export function resolveThemePreference(
  preference: ThemePreference,
  systemPrefersDark: boolean
): ResolvedTheme {
  if (preference === 'system') {
    return systemPrefersDark ? 'dark' : 'light';
  }

  return preference;
}

export function getNextThemePreference(
  preference: ThemePreference
): ThemePreference {
  if (preference === 'light') {
    return 'dark';
  }

  if (preference === 'dark') {
    return 'system';
  }

  return 'light';
}
