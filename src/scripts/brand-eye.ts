import { REDUCE } from './env';
import { pointer } from './pointer';
import { on, state } from './state';

/**
 * The eye at the end of the header wordmark (markup in src/components/Header.astro), alive like the gate's:
 * the pupil follows the pointer with a little lag, glances away now and then, and the lids blink.
 * Runs only after entering and while the tab is visible; reduced motion keeps the still eye.
 */

/** viewBox geometry (0 0 64 64): centre, radius, and the opening as a fraction of the radius. */
const C = 32;
const R = 30;
const OPEN = 0.47;
const LID = 2.2;
/** How far the pupil may travel from the centre. */
const REACH = R * 0.3;

export function initBrandEye(): void {
  const svg = document.querySelector<SVGSVGElement>('.brand-eye');
  if (!svg || REDUCE) return;
  const part = <T extends SVGElement>(name: string) => svg.querySelector<T>(`[data-part="${name}"]`)!;
  const openRect = part<SVGRectElement>('open');
  const lidTop = part<SVGRectElement>('lid-top');
  const lidBottom = part<SVGRectElement>('lid-bottom');
  const pupil = part<SVGGElement>('pupil');

  const look = { px: 0, py: 0, open: OPEN, glanceAt: 0, glanceGap: 3000, gx: 0, gy: 0, blinkAt: -1e9 };
  let rect = svg.getBoundingClientRect();
  let raf = 0;
  let running = false;
  let last = 0;

  function frame(now: number, dt: number): void {
    // Towards the pointer, in viewBox units.
    const ex = rect.left + rect.width / 2;
    const ey = rect.top + rect.height / 2;
    const dx = pointer.x - ex;
    const dy = pointer.y - ey;
    const d = Math.hypot(dx, dy) || 1;
    const m = REACH * Math.min(1, d / 90);
    let tx = (dx / d) * m;
    let ty = (dy / d) * m;
    let open = OPEN;
    // A quick random glance every few seconds.
    if (now - look.glanceAt > look.glanceGap) {
      look.glanceAt = now;
      look.glanceGap = 2600 + Math.random() * 1200;
      look.gx = (Math.random() - 0.5) * REACH * 2;
      look.gy = (Math.random() - 0.5) * REACH * 1.4;
    }
    if (now - look.glanceAt < 260) {
      tx = look.gx;
      ty = look.gy;
    }
    // Blink now and then (about every four seconds).
    const bl = now - look.blinkAt;
    if (bl > 150) {
      if (Math.random() < dt / 4200) look.blinkAt = now;
    } else {
      open *= Math.abs(bl - 75) / 75;
    }
    // Frame-rate independent easing: a little lag on the pupil, quicker lids (faster still when closing).
    const k = (rate: number) => 1 - Math.pow(1 - rate, dt / 16.667);
    look.px += (tx - look.px) * k(0.22);
    look.py += (ty - look.py) * k(0.22);
    look.open += (open - look.open) * k(open < look.open ? 0.5 : 0.25);

    const o = R * look.open;
    const py = Math.max(-o * 0.6, Math.min(o * 0.6, look.py));
    openRect.setAttribute('y', (C - o).toFixed(2));
    openRect.setAttribute('height', (o * 2).toFixed(2));
    lidTop.setAttribute('y', (C - o - LID / 2).toFixed(2));
    lidBottom.setAttribute('y', (C + o - LID / 2).toFixed(2));
    pupil.setAttribute('transform', `translate(${look.px.toFixed(2)} ${py.toFixed(2)})`);
  }

  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(50, now - last);
    last = now;
    frame(now, dt);
  };
  function start(): void {
    if (running || document.hidden || !state.entered) return;
    running = true;
    rect = svg!.getBoundingClientRect();
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }
  function stop(): void {
    running = false;
    cancelAnimationFrame(raf);
  }

  addEventListener('resize', () => {
    if (running) rect = svg.getBoundingClientRect();
  });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  on('app:enter', () => requestAnimationFrame(start));
  start();
}
