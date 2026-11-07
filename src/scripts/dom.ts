/** Small DOM helpers shared by every module. */

/** `root` is typed loosely because the generated Cloudflare types merge HTMLRewriter's Element into the DOM one. */
export const $ = <T extends Element = HTMLElement>(selector: string, root: Element | Document = document): T | null =>
  root.querySelector<T>(selector);

export const $$ = <T extends Element = HTMLElement>(selector: string, root: Element | Document = document): T[] => [
  ...root.querySelectorAll<T>(selector),
];

/** An element the markup guarantees; a missing one is a programming error. */
export function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing #${id}`);
  return node as T;
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

export const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
export const nextFrame = (): Promise<void> => new Promise((resolve) => requestAnimationFrame(() => resolve()));
