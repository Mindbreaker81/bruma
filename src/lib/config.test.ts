import { describe, expect, it } from 'vitest';

import {
  CONFIG_VERSION,
  DEFAULT_CONFIG,
  migrateConfig,
  patchConfig,
  readConfig,
} from './config';

describe('app config', () => {
  it('migrates unknown config to defaults', () => {
    expect(migrateConfig(null)).toEqual(DEFAULT_CONFIG);
    expect(migrateConfig({ version: 0, theme: 'invalid' })).toMatchObject({
      version: CONFIG_VERSION,
      theme: 'system',
      language: 'system',
      viewMode: 'editor',
      autosaveEnabled: true,
      autosaveDelayMs: 2000,
      editorFontFamily: 'sans',
      editorTabSize: 4,
      editorShowGutter: false,
      editorWrap: true,
      previewMaxWidth: 65,
      previewShowToc: false,
      splitScrollSync: false,
    });
  });

  it('limits recent files to ten entries', () => {
    const config = migrateConfig({
      recentFiles: Array.from({ length: 12 }, (_, index) => `${index}.md`),
    });

    expect(config.recentFiles).toHaveLength(10);
  });

  it('reads and patches config from storage', () => {
    const storage = new MapStorage();

    patchConfig({ theme: 'dark', language: 'es', viewMode: 'split' }, storage);

    expect(readConfig(storage)).toMatchObject({
      theme: 'dark',
      language: 'es',
      viewMode: 'split',
    });
  });

  it('rejects unsupported language preferences', () => {
    expect(migrateConfig({ language: 'fr' })).toMatchObject({
      language: 'system',
    });
  });

  it('migrates v4 without autosave fields to v5 defaults', () => {
    const config = migrateConfig({
      version: 4,
      theme: 'dark',
      language: 'es',
      viewMode: 'split',
      recentFiles: [],
      fontScale: 1,
      focusMode: false,
      tocOpen: false,
      showFrontmatter: true,
    });
    expect(config.autosaveEnabled).toBe(true);
    expect(config.autosaveDelayMs).toBe(2000);
    expect(config.version).toBe(CONFIG_VERSION);
  });

  it('preserves valid autosave settings', () => {
    const config = migrateConfig({
      autosaveEnabled: false,
      autosaveDelayMs: 5000,
    });
    expect(config.autosaveEnabled).toBe(false);
    expect(config.autosaveDelayMs).toBe(5000);
  });

  it('clamps invalid autosaveDelayMs', () => {
    expect(migrateConfig({ autosaveDelayMs: 200 }).autosaveDelayMs).toBe(2000);
    expect(migrateConfig({ autosaveDelayMs: 60000 }).autosaveDelayMs).toBe(
      2000
    );
  });

  it('migrates v5 without editor/preview fields to v6 defaults', () => {
    const config = migrateConfig({
      version: 5,
      theme: 'dark',
      language: 'es',
      viewMode: 'split',
      recentFiles: [],
      fontScale: 1,
      focusMode: false,
      tocOpen: false,
      showFrontmatter: true,
      autosaveEnabled: true,
      autosaveDelayMs: 2000,
    });
    expect(config.editorFontFamily).toBe('sans');
    expect(config.editorTabSize).toBe(4);
    expect(config.editorShowGutter).toBe(false);
    expect(config.editorWrap).toBe(true);
    expect(config.previewMaxWidth).toBe(65);
    expect(config.previewShowToc).toBe(false);
    expect(config.version).toBe(CONFIG_VERSION);
  });

  it('preserves valid editor and preview settings', () => {
    const config = migrateConfig({
      editorFontFamily: 'serif',
      editorTabSize: 2,
      editorShowGutter: true,
      editorWrap: false,
      previewMaxWidth: 80,
      previewShowToc: true,
    });
    expect(config.editorFontFamily).toBe('serif');
    expect(config.editorTabSize).toBe(2);
    expect(config.editorShowGutter).toBe(true);
    expect(config.editorWrap).toBe(false);
    expect(config.previewMaxWidth).toBe(80);
    expect(config.previewShowToc).toBe(true);
  });

  it('preserves splitScrollSync', () => {
    expect(migrateConfig({ splitScrollSync: true }).splitScrollSync).toBe(true);
    expect(migrateConfig({ splitScrollSync: false }).splitScrollSync).toBe(
      false
    );
  });

  it('clamps invalid editorTabSize and previewMaxWidth', () => {
    expect(migrateConfig({ editorTabSize: 0 }).editorTabSize).toBe(4);
    expect(migrateConfig({ editorTabSize: 20 }).editorTabSize).toBe(4);
    expect(migrateConfig({ previewMaxWidth: 5 }).previewMaxWidth).toBe(65);
    expect(migrateConfig({ previewMaxWidth: 300 }).previewMaxWidth).toBe(65);
  });

  it('keeps only structurally valid custom templates', () => {
    const config = migrateConfig({
      customTemplates: [
        { id: 'ok', name: 'Valid', content: '# Note', locale: 'en' },
        { id: 'missing-content', name: 'Invalid' },
        null,
      ] as never,
    });

    expect(config.customTemplates).toEqual([
      { id: 'ok', name: 'Valid', content: '# Note', locale: 'en' },
    ]);
  });
});

class MapStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}
