export type LanguagePreference = 'system' | 'es' | 'en';
export type ResolvedLanguage = 'es' | 'en';

const LANGUAGE_ORDER: LanguagePreference[] = ['system', 'es', 'en'];

export function getNextLanguagePreference(
  preference: LanguagePreference
): LanguagePreference {
  const index = LANGUAGE_ORDER.indexOf(preference);

  return LANGUAGE_ORDER[(index + 1) % LANGUAGE_ORDER.length] ?? 'system';
}

export function resolveLanguagePreference(
  preference: LanguagePreference,
  systemLanguage: string
): ResolvedLanguage {
  if (preference === 'es' || preference === 'en') {
    return preference;
  }

  return systemLanguage.toLowerCase().startsWith('es') ? 'es' : 'en';
}
