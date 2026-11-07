import { LANG_STORAGE_KEY, type Lang } from '../i18n/config';
import { UI, type UiCopy } from '../i18n/ui';

/** The page language, from <html lang>; Spanish is the root route. */
export const lang: Lang = document.documentElement.lang === 'en' ? 'en' : 'es';

/** UI copy for the current language. Content data stays in src/data. */
export const t: UiCopy = UI[lang];

/**
 * The ES/EN link in the header. Following it is an explicit choice: it is stored under
 * LANG_STORAGE_KEY so the geo guess in Layout.astro never sends the visitor back, and the
 * current `?escena=`/`?debug` query travels with it.
 */
export function initLangSwitch(): void {
  const link = document.getElementById('langSwitch');
  if (!(link instanceof HTMLAnchorElement)) return;
  link.href = `${link.pathname}${location.search}`;
  link.addEventListener('click', () => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, link.hreflang === 'en' ? 'en' : 'es');
    } catch {
      /* Privacy modes throw; the link still works for this visit. */
    }
  });
}
