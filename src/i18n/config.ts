export const LANGS = ['es', 'en'] as const;
export type Lang = (typeof LANGS)[number];

export const DEFAULT_LANG: Lang = 'es';

/**
 * Countries served the Spanish page when nothing else decides.
 *
 * Two judgment calls are baked in:
 * - Brazil (BR) is here because the brief draws the line at "outside Latin
 *   America", and Brazil is Latin America even though it does not speak
 *   Spanish.
 * - Spain (ES) is here because the real criterion is "does this visitor read
 *   Spanish", which is a language question, not a geographic one.
 */
export const SPANISH_COUNTRIES: ReadonlySet<string> = new Set([
  'AR',
  'UY',
  'CL',
  'PY',
  'BO',
  'PE',
  'EC',
  'CO',
  'VE',
  'MX',
  'CR',
  'PA',
  'NI',
  'HN',
  'SV',
  'GT',
  'DO',
  'CU',
  'PR',
  'BR',
  'ES',
]);

/** Route for a language. Spanish is the root; English lives under /en/. */
export function pathForLang(lang: Lang): string {
  return lang === 'en' ? '/en/' : '/';
}

export function otherLang(lang: Lang): Lang {
  return lang === 'en' ? 'es' : 'en';
}

/**
 * Explicit language choice, persisted so the automatic geo redirect can never
 * override a deliberate pick. Mirrors THEME_STORAGE_KEY's role: the inline
 * script in Layout.astro reads the same literal.
 */
export const LANG_STORAGE_KEY = 'lang';
