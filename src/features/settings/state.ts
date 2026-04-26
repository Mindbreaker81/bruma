import { create } from 'zustand';

import {
  type ResolvedTheme,
  type ThemePreference,
  getNextThemePreference,
  resolveThemePreference,
} from './theme';
import { type ViewMode, getNextViewMode } from './view';

const THEME_STORAGE_KEY = 'bruma.theme';
const VIEW_STORAGE_KEY = 'bruma.view';

type ThemeState = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  viewMode: ViewMode;
  setPreference: (preference: ThemePreference) => void;
  cycleTheme: () => void;
  setViewMode: (viewMode: ViewMode) => void;
  cycleViewMode: () => void;
};

function getSystemPrefersDark(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

function readStoredPreference(): ThemePreference {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }

  return 'system';
}

function readStoredViewMode(): ViewMode {
  const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);

  if (stored === 'editor' || stored === 'preview' || stored === 'split') {
    return stored;
  }

  return 'editor';
}

function applyTheme(preference: ThemePreference): ResolvedTheme {
  const resolvedTheme = resolveThemePreference(
    preference,
    getSystemPrefersDark()
  );

  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  document.documentElement.style.colorScheme = resolvedTheme;
  window.localStorage.setItem(THEME_STORAGE_KEY, preference);

  return resolvedTheme;
}

const initialPreference = readStoredPreference();
const initialViewMode = readStoredViewMode();

export const useThemeStore = create<ThemeState>((set, get) => ({
  preference: initialPreference,
  resolvedTheme: applyTheme(initialPreference),
  viewMode: initialViewMode,
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
  setViewMode: (viewMode) =>
    set(() => {
      window.localStorage.setItem(VIEW_STORAGE_KEY, viewMode);

      return { viewMode };
    }),
  cycleViewMode: () => {
    const viewMode = getNextViewMode(get().viewMode);

    window.localStorage.setItem(VIEW_STORAGE_KEY, viewMode);
    set(() => ({ viewMode }));
  },
}));
