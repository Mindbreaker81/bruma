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
      viewMode: 'editor',
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

    patchConfig({ theme: 'dark', viewMode: 'split' }, storage);

    expect(readConfig(storage)).toMatchObject({
      theme: 'dark',
      viewMode: 'split',
    });
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
