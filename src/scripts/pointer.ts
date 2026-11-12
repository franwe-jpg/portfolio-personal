import { $$ } from './dom';
import { COARSE, REDUCE } from './env';

/**
 * Global pointer: `nx`/`ny` in [-1, 1], eased every frame, drive the DOM
 * parallax of `[data-depth]` elements. Mouse on fine pointers, device tilt
 * (±20°) on coarse ones, zero otherwise. `x`/`y` are the last client position.
 */
export const pointer = { nx: 0, ny: 0, tx: 0, ty: 0, x: innerWidth / 2, y: innerHeight / 2 };

export type Ticker = (dtSeconds: number, now: number) => void;
/** Callbacks on the shared frame loop. */
export const tickers = new Set<Ticker>();

export function initPointer(): void {
  addEventListener(
    'mousemove',
    (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.tx = (event.clientX / innerWidth) * 2 - 1;
      pointer.ty = (event.clientY / innerHeight) * 2 - 1;
    },
    { passive: true },
  );
  addEventListener(
    'pointerdown',
    (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    },
    { passive: true },
  );
  if (COARSE && 'DeviceOrientationEvent' in window) {
    let beta0: number | null = null;
    addEventListener(
      'deviceorientation',
      (event) => {
        if (event.gamma == null || event.beta == null) return;
        // The holding angle at the first reading is "neutral".
        if (beta0 === null) beta0 = event.beta;
        const unit = (value: number) => Math.max(-20, Math.min(20, value)) / 20;
        pointer.tx = unit(event.gamma);
        pointer.ty = unit(event.beta - beta0);
      },
      { passive: true },
    );
  }

  const parallaxEls = $$('[data-depth]');
  let lastTick = performance.now();
  let settled = false;
  const tickLoop = (now: number) => {
    requestAnimationFrame(tickLoop);
    const dt = Math.min(50, now - lastTick);
    lastTick = now;
    // 0.08 per frame at 60 fps, made frame-rate independent.
    const k = 1 - Math.pow(0.92, dt / 16.667);
    pointer.nx += (pointer.tx - pointer.nx) * k;
    pointer.ny += (pointer.ty - pointer.ny) * k;
    // Once the easing has caught up, the parallax styles stop being rewritten (no style work while still).
    const still = Math.abs(pointer.tx - pointer.nx) + Math.abs(pointer.ty - pointer.ny) < 1e-4;
    if (!REDUCE && !(still && settled)) {
      settled = still;
      for (const node of parallaxEls) {
        const depth = +(node.dataset.depth ?? 0) || 0;
        // Writes `translate`, so GSAP keeps `transform` for itself.
        node.style.translate = `${(pointer.nx * depth * 24).toFixed(2)}px ${(pointer.ny * depth * 24).toFixed(2)}px`;
      }
    }
    for (const fn of tickers) fn(dt / 1000, now);
  };
  requestAnimationFrame(tickLoop);
}
