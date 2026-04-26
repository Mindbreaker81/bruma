import type { LanguagePreference } from '../features/settings/language';
import type { ThemePreference } from '../features/settings/theme';
import type { ViewMode } from '../features/settings/view';
import { FONT_SCALE_DEFAULT, clampFontScale } from '../features/settings/zoom';

export const CONFIG_VERSION = 4;
const CONFIG_STORAGE_KEY = 'bruma.config';

export type AppConfig = {
  version: number;
  theme: ThemePreference;
  language: LanguagePreference;
  viewMode: ViewMode;
  recentFiles: string[];
  fontScale: number;
  focusMode: boolean;
  tocOpen: boolean;
  showFrontmatter: boolean;
};

export const DEFAULT_CONFIG: AppConfig = {
  version: CONFIG_VERSION,
  theme: 'system',
  language: 'system',
  viewMode: 'editor',
  recentFiles: [],
  fontScale: FONT_SCALE_DEFAULT,
  focusMode: false,
  tocOpen: false,
  showFrontmatter: true,
};

type PartialConfig = Partial<AppConfig> & {
  version?: number;
};

export function migrateConfig(input: unknown): AppConfig {
  if (!input || typeof input !== 'object') {
    return DEFAULT_CONFIG;
  }

  const config = input as PartialConfig;
  const theme =
    config.theme === 'light' ||
    config.theme === 'dark' ||
    config.theme === 'system'
      ? config.theme
      : DEFAULT_CONFIG.theme;
  const viewMode =
    config.viewMode === 'editor' ||
    config.viewMode === 'preview' ||
    config.viewMode === 'split'
      ? config.viewMode
      : DEFAULT_CONFIG.viewMode;
  const language =
    config.language === 'system' ||
    config.language === 'es' ||
    config.language === 'en'
      ? config.language
      : DEFAULT_CONFIG.language;
  const recentFiles = Array.isArray(config.recentFiles)
    ? config.recentFiles.filter(
        (path): path is string => typeof path === 'string'
      )
    : DEFAULT_CONFIG.recentFiles;
  const fontScale =
    typeof config.fontScale === 'number'
      ? clampFontScale(config.fontScale)
      : DEFAULT_CONFIG.fontScale;
  const focusMode =
    typeof config.focusMode === 'boolean'
      ? config.focusMode
      : DEFAULT_CONFIG.focusMode;
  const tocOpen =
    typeof config.tocOpen === 'boolean'
      ? config.tocOpen
      : DEFAULT_CONFIG.tocOpen;
  const showFrontmatter =
    typeof config.showFrontmatter === 'boolean'
      ? config.showFrontmatter
      : DEFAULT_CONFIG.showFrontmatter;

  return {
    version: CONFIG_VERSION,
    theme,
    language,
    viewMode,
    recentFiles: recentFiles.slice(0, 10),
    fontScale,
    focusMode,
    tocOpen,
    showFrontmatter,
  };
}

export function readConfig(storage: Storage = window.localStorage): AppConfig {
  const stored = storage.getItem(CONFIG_STORAGE_KEY);

  if (!stored) {
    return DEFAULT_CONFIG;
  }

  try {
    return migrateConfig(JSON.parse(stored));
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function writeConfig(
  config: AppConfig,
  storage: Storage = window.localStorage
): void {
  storage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(migrateConfig(config)));
}

export function patchConfig(
  patch: Partial<Omit<AppConfig, 'version'>>,
  storage: Storage = window.localStorage
): AppConfig {
  const nextConfig = migrateConfig({
    ...readConfig(storage),
    ...patch,
  });

  writeConfig(nextConfig, storage);

  return nextConfig;
}
