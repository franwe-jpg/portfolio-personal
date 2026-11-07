import type { Lang } from '../i18n/config';
import { UI, type UiCopy } from '../i18n/ui';

/** The page language, from <html lang>; Spanish is the root route. */
export const lang: Lang = document.documentElement.lang === 'en' ? 'en' : 'es';

/** UI copy for the current language. Content data stays in src/data. */
export const t: UiCopy = UI[lang];
