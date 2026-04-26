import { create } from 'zustand';

import { patchConfig, readConfig } from '../../lib/config';
import {
  getNextLanguagePreference,
  type LanguagePreference,
  type ResolvedLanguage,
  resolveLanguagePreference,
} from './language';
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
  languagePreference: LanguagePreference;
  resolvedLanguage: ResolvedLanguage;
  viewMode: ViewMode;
  setPreference: (preference: ThemePreference) => void;
  cycleTheme: () => void;
  setLanguage: (language: LanguagePreference) => void;
  cycleLanguage: () => void;
  setViewMode: (viewMode: ViewMode) => void;
  cycleViewMode: () => void;
};

function getSystemPrefersDark(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

function readStoredPreference(): ThemePreference {
  return readConfig().theme;
}

function readStoredLanguage(): LanguagePreference {
  return readConfig().language;
}

function readStoredViewMode(): ViewMode {
  return readConfig().viewMode;
}

function getSystemLanguage(): string {
  return window.navigator.language || 'en';
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

function applyLanguage(preference: LanguagePreference): ResolvedLanguage {
  const resolvedLanguage = resolveLanguagePreference(
    preference,
    getSystemLanguage()
  );

  document.documentElement.lang = resolvedLanguage;
  patchConfig({ language: preference });

  return resolvedLanguage;
}

const initialPreference = readStoredPreference();
const initialLanguage = readStoredLanguage();
const initialViewMode = readStoredViewMode();

export const useThemeStore = create<ThemeState>((set, get) => ({
  preference: initialPreference,
  resolvedTheme: applyTheme(initialPreference),
  languagePreference: initialLanguage,
  resolvedLanguage: applyLanguage(initialLanguage),
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
  setLanguage: (languagePreference) =>
    set(() => ({
      languagePreference,
      resolvedLanguage: applyLanguage(languagePreference),
    })),
  cycleLanguage: () => {
    const languagePreference = getNextLanguagePreference(
      get().languagePreference
    );

    set(() => ({
      languagePreference,
      resolvedLanguage: applyLanguage(languagePreference),
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
