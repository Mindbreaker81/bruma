import { describe, expect, it } from 'vitest';

import {
  getNextLanguagePreference,
  resolveLanguagePreference,
} from './language';

describe('language preferences', () => {
  it('cycles through system, Spanish and English', () => {
    expect(getNextLanguagePreference('system')).toBe('es');
    expect(getNextLanguagePreference('es')).toBe('en');
    expect(getNextLanguagePreference('en')).toBe('system');
  });

  it('resolves system language to a supported locale', () => {
    expect(resolveLanguagePreference('system', 'es-ES')).toBe('es');
    expect(resolveLanguagePreference('system', 'fr-FR')).toBe('en');
    expect(resolveLanguagePreference('es', 'en-US')).toBe('es');
  });
});
