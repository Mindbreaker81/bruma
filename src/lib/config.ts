import type { LanguagePreference } from '../features/settings/language';
import type { ThemePreference } from '../features/settings/theme';
import type { ViewMode } from '../features/settings/view';
import { FONT_SCALE_DEFAULT, clampFontScale } from '../features/settings/zoom';
import type { Template } from '../features/templates/templates';

export const CONFIG_VERSION = 9;
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
  autosaveEnabled: boolean;
  autosaveDelayMs: number;
  editorFontFamily: string;
  editorTabSize: number;
  editorShowGutter: boolean;
  editorWrap: boolean;
  previewMaxWidth: number;
  previewShowToc: boolean;
  splitScrollSync: boolean;
  customTemplates: Template[];
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
  autosaveEnabled: true,
  autosaveDelayMs: 2000,
  editorFontFamily: 'sans',
  editorTabSize: 4,
  editorShowGutter: false,
  editorWrap: true,
  previewMaxWidth: 65,
  previewShowToc: false,
  splitScrollSync: false,
  customTemplates: [],
};

type PartialConfig = Partial<AppConfig> & {
  version?: number;
};

function isTemplate(value: unknown): value is Template {
  if (!value || typeof value !== 'object') return false;
  const template = value as Record<string, unknown>;
  return (
    typeof template.id === 'string' &&
    typeof template.name === 'string' &&
    typeof template.content === 'string' &&
    (template.locale === undefined ||
      template.locale === 'es' ||
      template.locale === 'en') &&
    (template.isCustom === undefined || typeof template.isCustom === 'boolean')
  );
}

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
  const autosaveEnabled =
    typeof config.autosaveEnabled === 'boolean'
      ? config.autosaveEnabled
      : DEFAULT_CONFIG.autosaveEnabled;
  const autosaveDelayMs =
    typeof config.autosaveDelayMs === 'number' &&
    config.autosaveDelayMs >= 500 &&
    config.autosaveDelayMs <= 30000
      ? config.autosaveDelayMs
      : DEFAULT_CONFIG.autosaveDelayMs;
  const editorFontFamily =
    typeof config.editorFontFamily === 'string'
      ? config.editorFontFamily
      : DEFAULT_CONFIG.editorFontFamily;
  const editorTabSize =
    typeof config.editorTabSize === 'number' &&
    config.editorTabSize >= 1 &&
    config.editorTabSize <= 16
      ? config.editorTabSize
      : DEFAULT_CONFIG.editorTabSize;
  const editorShowGutter =
    typeof config.editorShowGutter === 'boolean'
      ? config.editorShowGutter
      : DEFAULT_CONFIG.editorShowGutter;
  const editorWrap =
    typeof config.editorWrap === 'boolean'
      ? config.editorWrap
      : DEFAULT_CONFIG.editorWrap;
  const previewMaxWidth =
    typeof config.previewMaxWidth === 'number' &&
    config.previewMaxWidth >= 20 &&
    config.previewMaxWidth <= 200
      ? config.previewMaxWidth
      : DEFAULT_CONFIG.previewMaxWidth;
  const previewShowToc =
    typeof config.previewShowToc === 'boolean'
      ? config.previewShowToc
      : DEFAULT_CONFIG.previewShowToc;
  const splitScrollSync =
    typeof config.splitScrollSync === 'boolean'
      ? config.splitScrollSync
      : DEFAULT_CONFIG.splitScrollSync;

  const customTemplates = Array.isArray(config.customTemplates)
    ? config.customTemplates.filter(isTemplate)
    : DEFAULT_CONFIG.customTemplates;

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
    autosaveEnabled,
    autosaveDelayMs,
    editorFontFamily,
    editorTabSize,
    editorShowGutter,
    editorWrap,
    previewMaxWidth,
    previewShowToc,
    splitScrollSync,
    customTemplates,
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
