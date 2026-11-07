import { gsap } from 'gsap';
import { byId } from './dom';
import { REDUCE } from './env';

/**
 * "Mancha": an organic blob (two filtered circles, graphite + light rim,
 * displaced by fractal noise) that grows from the click to cover the screen,
 * then shrinks away over the new page.
 */
function createMancha() {
  const svg = byId<HTMLElement>('mancha');
  const turb = byId<HTMLElement>('manchaTurb');
  const disp = byId<HTMLElement>('manchaDisp');
  const filter = byId<HTMLElement>('manchaFilter');
  const blob = byId<HTMLElement>('manchaBlob');
  const rim = byId<HTMLElement>('manchaRim');
  const m = { r: 0, cx: innerWidth / 2, cy: innerHeight / 2, wob: 0 };
  let seed = 2;

  function origin(x: number, y: number): void {
    m.cx = x;
    m.cy = y;
  }
  function fit(): void {
    filter.setAttribute('x', '-300');
    filter.setAttribute('y', '-300');
    filter.setAttribute('width', String(innerWidth + 600));
    filter.setAttribute('height', String(innerHeight + 600));
  }
  // Attributes are rewritten every frame so the browser repaints the filtered group.
  function draw(): void {
    const r = Math.max(0, m.r);
    const base = Math.min(140, innerWidth * 0.12, r * 0.5);
    const scale = base * (1 + Math.sin(m.wob * Math.PI * 2) * 0.15); // edge wobble
    for (const circle of [blob, rim]) {
      circle.setAttribute('cx', m.cx.toFixed(1));
      circle.setAttribute('cy', m.cy.toFixed(1));
    }
    blob.setAttribute('r', r.toFixed(1));
    rim.setAttribute('r', (r + 2.5).toFixed(1));
    disp.setAttribute('scale', scale.toFixed(1));
  }
  const coverRadius = () =>
    Math.hypot(Math.max(m.cx, innerWidth - m.cx), Math.max(m.cy, innerHeight - m.cy)) + 200;

  async function cover(): Promise<void> {
    // New noise per transition; a slightly tighter frequency for the reveal half.
    seed = (seed % 50) + 7;
    turb.setAttribute('seed', String(seed));
    turb.setAttribute('baseFrequency', '0.012');
    fit();
    m.r = 0;
    m.wob = 0;
    draw();
    svg.classList.add('is-on');
    await gsap.to(m, { r: coverRadius(), wob: 0.5, duration: 0.3, ease: 'expo.in', onUpdate: draw });
  }
  async function reveal(): Promise<void> {
    turb.setAttribute('baseFrequency', '0.015');
    await gsap.to(m, { r: 0, wob: 1, duration: 1.0, ease: 'expo.out', onUpdate: draw });
    svg.classList.remove('is-on');
  }
  return { origin, cover, reveal };
}

let instance: ReturnType<typeof createMancha> | null = null;
export function mancha(): ReturnType<typeof createMancha> {
  instance ??= createMancha();
  return instance;
}

/** Title glitch: two cloned layers, offset ±4px with red/cyan shadows, sliced by CSS steps(). */
export function glitch(heading: Element | null): void {
  if (!heading || REDUCE) return;
  for (const layer of heading.querySelectorAll('.glitch-layer')) layer.remove();
  const html = heading.innerHTML;
  for (const kind of ['a', 'b']) {
    const layer = document.createElement('span');
    layer.className = `glitch-layer ${kind}`;
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = html;
    layer.addEventListener('animationend', () => layer.remove(), { once: true });
    heading.appendChild(layer);
  }
}
