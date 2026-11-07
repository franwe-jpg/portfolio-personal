import { REDUCE } from './env';

/** Mono scramble: characters settle left to right. Instant under reduced motion. */
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>_+=*#';
const running = new WeakMap<Element, number>();

export function scramble(node: Element, text: string, duration = 0.5): void {
  cancelAnimationFrame(running.get(node) ?? 0);
  if (REDUCE || !text) {
    node.textContent = text;
    return;
  }
  const start = performance.now();
  const step = (now: number) => {
    const progress = Math.min(1, (now - start) / (duration * 1000));
    let out = '';
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      out += ch === ' ' || ch === '·' || i / text.length < progress ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    node.textContent = out;
    if (progress < 1) running.set(node, requestAnimationFrame(step));
  };
  running.set(node, requestAnimationFrame(step));
}
