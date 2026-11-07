import { gsap } from 'gsap';
import { busyCursor } from './cursor';
import { $$, byId } from './dom';
import { REDUCE } from './env';
import { pointer } from './pointer';
import { scramble } from './scramble';
import { emit, isPage, PAGES, state, type Page } from './state';
import { glitch, mancha } from './transitions';

/**
 * Pages are states of one document: exactly one is active. The hash only
 * serves the browser's back/forward; the first entry always lands on inicio.
 */
export const pageEl = (page: Page): HTMLElement => byId(page);
export const heading = (page: Page): HTMLElement | null => pageEl(page).querySelector<HTMLElement>('[data-glitch]');

interface GoOptions {
  /** No blob transition (used for the first page after the gate). */
  instant?: boolean;
  push?: boolean;
  replace?: boolean;
}

let transitioning = false;

function swap(page: Page): void {
  state.page = page;
  for (const name of PAGES) {
    const node = pageEl(name);
    node.classList.toggle('is-active', name === page);
    node.setAttribute('aria-hidden', String(name !== page));
  }
  pageEl(page).querySelector('.page-scroll')?.scrollTo({ top: 0, behavior: 'instant' });
  document.body.classList.toggle('on-paper', page !== 'mundo');
  document.body.dataset.page = page;
  // The stage (world canvas + dark glyph field) only shows behind mundo; once built, the world sets
  // its view on `app:pageswap`. In fallback mode the stage keeps its blurred backdrop on every page.
  const stage = byId('stage3d');
  if (!stage.classList.contains('has-fallback')) stage.classList.toggle('is-off', page !== 'mundo');
  for (const link of $$<HTMLAnchorElement>('.nav a[data-go]')) {
    if (link.dataset.go === page) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  emit('app:pageswap', page);
}

export async function go(target: string | null | undefined, { instant = false, push = true, replace = false }: GoOptions = {}): Promise<void> {
  const page: Page = isPage(target) ? target : 'inicio';
  if (!state.entered || page === state.page || transitioning) return;
  if (replace) history.replaceState({ page }, '', `#${page}`);
  else if (push) history.pushState({ page }, '', `#${page}`);
  emit('app:navigate', page);
  if (instant) {
    swap(page);
    return;
  }
  transitioning = true;
  busyCursor.begin();
  if (REDUCE) {
    const pages = byId('pages');
    await gsap.to(pages, { opacity: 0, duration: 0.12, ease: 'none' });
    swap(page);
    await gsap.to(pages, { opacity: 1, duration: 0.13, ease: 'none' });
  } else {
    await mancha().cover();
    swap(page);
    glitch(heading(page));
    await mancha().reveal();
  }
  transitioning = false;
  busyCursor.end();
  heading(page)?.focus({ preventScroll: true });
}

export const router = { go };

export function initRouter(): void {
  addEventListener('popstate', (event: PopStateEvent) => {
    if (!state.entered) return;
    mancha().origin(pointer.x, pointer.y);
    const page: unknown = (event.state as { page?: unknown } | null)?.page ?? location.hash.slice(1);
    void go(typeof page === 'string' ? page : null, { push: false });
  });

  // Page navigation: header, pills, world switch. The blob grows from the click.
  for (const trigger of $$<HTMLElement>('[data-go]')) {
    trigger.addEventListener('click', (event: MouseEvent) => {
      event.preventDefault();
      mancha().origin(event.clientX || innerWidth / 2, event.clientY || innerHeight / 2);
      void go(trigger.dataset.go);
    });
  }
  // Nav links scramble their label on hover.
  for (const link of $$<HTMLElement>('[data-scr]')) {
    const label = link.textContent ?? '';
    link.setAttribute('aria-label', label);
    link.addEventListener('mouseenter', () => scramble(link, label.toUpperCase(), 0.35));
    link.style.textTransform = 'uppercase';
  }
}
