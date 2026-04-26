import { create } from 'zustand';

import { patchConfig, readConfig } from '../../lib/config';
import {
  type ResolvedTheme,
  type ThemePreference,
  getNextThemePreference,
  resolveThemePreference,
} from './theme';
import { type ViewMode, getNextViewMode } from './view';

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
  return readConfig().theme;
}

function readStoredViewMode(): ViewMode {
  return readConfig().viewMode;
}

function applyTheme(preference: ThemePreference): ResolvedTheme {
  const resolvedTheme = resolveThemePreference(
    preference,
    getSystemPrefersDark()
  );

  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  document.documentElement.style.colorScheme = resolvedTheme;
  patchConfig({ theme: preference });

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
      patchConfig({ viewMode });

      return { viewMode };
    }),
  cycleViewMode: () => {
    const viewMode = getNextViewMode(get().viewMode);

    patchConfig({ viewMode });
    set(() => ({ viewMode }));
  },
}));
