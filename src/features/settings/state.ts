import { create } from 'zustand';

import {
  type ResolvedTheme,
  type ThemePreference,
  getNextThemePreference,
  resolveThemePreference,
} from './theme';

const STORAGE_KEY = 'bruma.theme';

type ThemeState = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
  cycleTheme: () => void;
};

function getSystemPrefersDark(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

function readStoredPreference(): ThemePreference {
  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }

  return 'system';
}

function applyTheme(preference: ThemePreference): ResolvedTheme {
  const resolvedTheme = resolveThemePreference(
    preference,
    getSystemPrefersDark()
  );

  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  document.documentElement.style.colorScheme = resolvedTheme;
  window.localStorage.setItem(STORAGE_KEY, preference);

  return resolvedTheme;
}

const initialPreference = readStoredPreference();

export const useThemeStore = create<ThemeState>((set, get) => ({
  preference: initialPreference,
  resolvedTheme: applyTheme(initialPreference),
  setPreference: (preference) =>
    set(() => ({
      preference,
      resolvedTheme: applyTheme(preference),
    })),
  cycleTheme: () => {
    const preference = getNextThemePreference(get().preference);

    set(() => ({
      preference,
      resolvedTheme: applyTheme(preference),
    }));
  },
}));
