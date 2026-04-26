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
import {
  FONT_SCALE_DEFAULT,
  clampFontScale,
  decreaseFontScale,
  increaseFontScale,
} from './zoom';

type ThemeState = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  languagePreference: LanguagePreference;
  resolvedLanguage: ResolvedLanguage;
  viewMode: ViewMode;
  fontScale: number;
  focusMode: boolean;
  tocOpen: boolean;
  autosaveEnabled: boolean;
  autosaveDelayMs: number;
  editorFontFamily: string;
  editorTabSize: number;
  editorShowGutter: boolean;
  editorWrap: boolean;
  previewMaxWidth: number;
  previewShowToc: boolean;
  setPreference: (preference: ThemePreference) => void;
  cycleTheme: () => void;
  setLanguage: (language: LanguagePreference) => void;
  cycleLanguage: () => void;
  setViewMode: (viewMode: ViewMode) => void;
  cycleViewMode: () => void;
  setFontScale: (scale: number) => void;
  increaseFontScale: () => void;
  decreaseFontScale: () => void;
  resetFontScale: () => void;
  toggleFocusMode: () => void;
  setFocusMode: (focusMode: boolean) => void;
  toggleToc: () => void;
  setTocOpen: (open: boolean) => void;
  showFrontmatter: boolean;
  toggleShowFrontmatter: () => void;
  setShowFrontmatter: (show: boolean) => void;
  setAutosaveEnabled: (enabled: boolean) => void;
  setAutosaveDelayMs: (delayMs: number) => void;
  setEditorFontFamily: (family: string) => void;
  setEditorTabSize: (size: number) => void;
  setEditorShowGutter: (show: boolean) => void;
  setEditorWrap: (wrap: boolean) => void;
  setPreviewMaxWidth: (width: number) => void;
  setPreviewShowToc: (show: boolean) => void;
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

function applyFontScale(scale: number): number {
  const clamped = clampFontScale(scale);
  document.documentElement.style.setProperty(
    '--bruma-font-scale',
    String(clamped)
  );
  patchConfig({ fontScale: clamped });
  return clamped;
}

function applyFocusMode(active: boolean): boolean {
  document.documentElement.dataset.focusMode = active ? 'on' : 'off';
  patchConfig({ focusMode: active });
  return active;
}

function applyTocOpen(open: boolean): boolean {
  patchConfig({ tocOpen: open });
  return open;
}

function applyShowFrontmatter(show: boolean): boolean {
  patchConfig({ showFrontmatter: show });
  return show;
}

function applyAutosaveEnabled(enabled: boolean): boolean {
  patchConfig({ autosaveEnabled: enabled });
  return enabled;
}

function applyAutosaveDelayMs(delayMs: number): number {
  const clamped = Math.min(Math.max(delayMs, 500), 30000);
  patchConfig({ autosaveDelayMs: clamped });
  return clamped;
}

function applyEditorFontFamily(family: string): string {
  patchConfig({ editorFontFamily: family });
  return family;
}

function applyEditorTabSize(size: number): number {
  const clamped = Math.min(Math.max(size, 1), 16);
  patchConfig({ editorTabSize: clamped });
  return clamped;
}

function applyEditorShowGutter(show: boolean): boolean {
  patchConfig({ editorShowGutter: show });
  return show;
}

function applyEditorWrap(wrap: boolean): boolean {
  patchConfig({ editorWrap: wrap });
  return wrap;
}

function applyPreviewMaxWidth(width: number): number {
  const clamped = Math.min(Math.max(width, 20), 200);
  patchConfig({ previewMaxWidth: clamped });
  return clamped;
}

function applyPreviewShowToc(show: boolean): boolean {
  patchConfig({ previewShowToc: show });
  return show;
}

const initialConfig = readConfig();
const initialPreference = readStoredPreference();
const initialLanguage = readStoredLanguage();
const initialViewMode = readStoredViewMode();

export const useThemeStore = create<ThemeState>((set, get) => ({
  preference: initialPreference,
  resolvedTheme: applyTheme(initialPreference),
  languagePreference: initialLanguage,
  resolvedLanguage: applyLanguage(initialLanguage),
  viewMode: initialViewMode,
  fontScale: applyFontScale(initialConfig.fontScale ?? FONT_SCALE_DEFAULT),
  focusMode: applyFocusMode(initialConfig.focusMode ?? false),
  tocOpen: initialConfig.tocOpen ?? false,
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
  setFontScale: (scale) => set(() => ({ fontScale: applyFontScale(scale) })),
  increaseFontScale: () =>
    set(() => ({
      fontScale: applyFontScale(increaseFontScale(get().fontScale)),
    })),
  decreaseFontScale: () =>
    set(() => ({
      fontScale: applyFontScale(decreaseFontScale(get().fontScale)),
    })),
  resetFontScale: () =>
    set(() => ({ fontScale: applyFontScale(FONT_SCALE_DEFAULT) })),
  toggleFocusMode: () =>
    set(() => ({ focusMode: applyFocusMode(!get().focusMode) })),
  setFocusMode: (focusMode) =>
    set(() => ({ focusMode: applyFocusMode(focusMode) })),
  toggleToc: () => set(() => ({ tocOpen: applyTocOpen(!get().tocOpen) })),
  setTocOpen: (open) => set(() => ({ tocOpen: applyTocOpen(open) })),
  showFrontmatter: applyShowFrontmatter(initialConfig.showFrontmatter ?? true),
  toggleShowFrontmatter: () =>
    set(() => ({
      showFrontmatter: applyShowFrontmatter(!get().showFrontmatter),
    })),
  setShowFrontmatter: (show) =>
    set(() => ({ showFrontmatter: applyShowFrontmatter(show) })),
  autosaveEnabled: initialConfig.autosaveEnabled ?? true,
  autosaveDelayMs: initialConfig.autosaveDelayMs ?? 2000,
  editorFontFamily: initialConfig.editorFontFamily ?? 'sans',
  editorTabSize: initialConfig.editorTabSize ?? 4,
  editorShowGutter: initialConfig.editorShowGutter ?? false,
  editorWrap: initialConfig.editorWrap ?? true,
  previewMaxWidth: initialConfig.previewMaxWidth ?? 65,
  previewShowToc: initialConfig.previewShowToc ?? false,
  setAutosaveEnabled: (enabled) =>
    set(() => ({ autosaveEnabled: applyAutosaveEnabled(enabled) })),
  setAutosaveDelayMs: (delayMs) =>
    set(() => ({ autosaveDelayMs: applyAutosaveDelayMs(delayMs) })),
  setEditorFontFamily: (family) =>
    set(() => ({ editorFontFamily: applyEditorFontFamily(family) })),
  setEditorTabSize: (size) =>
    set(() => ({ editorTabSize: applyEditorTabSize(size) })),
  setEditorShowGutter: (show) =>
    set(() => ({ editorShowGutter: applyEditorShowGutter(show) })),
  setEditorWrap: (wrap) => set(() => ({ editorWrap: applyEditorWrap(wrap) })),
  setPreviewMaxWidth: (width) =>
    set(() => ({ previewMaxWidth: applyPreviewMaxWidth(width) })),
  setPreviewShowToc: (show) =>
    set(() => ({ previewShowToc: applyPreviewShowToc(show) })),
}));
