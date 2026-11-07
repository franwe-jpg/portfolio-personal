import { byId } from './dom';
import { FINE, REDUCE } from './env';
import { pointer, tickers } from './pointer';
import { state } from './state';

/**
 * Busy cursor: begin()/end() bracket a wait; the Windows 7 ring appears only
 * past 0.5 s. 'busy' is the ring alone (hotspot at its centre); 'working' is
 * the arrow with the ring beside it. Frames live in /cursores/.
 */
type BusyKind = 'busy' | 'working';
const KINDS: Record<BusyKind, { hx: number; hy: number }> = { busy: { hx: 16, hy: 16 }, working: { hx: 0, hy: 8 } };
const FRAMES = 18;
const STEP = 55; // ≈ one turn per second, like Windows
const frameSrc = (kind: BusyKind, index: number) => `/cursores/${kind}-${String(index).padStart(2, '0')}.png`;

function createBusyCursor() {
  let node: HTMLElement | null = null;
  let img: HTMLImageElement | null = null;
  let depth = 0;
  let timer = 0;
  let on = false;
  let kind: BusyKind = 'busy';
  let nextKind: BusyKind = 'busy';
  let frame = 0;
  let ticker = 0;

  function show(visible: boolean): void {
    if (on === visible || !node || !img) return;
    on = visible;
    node.classList.toggle('is-on', visible);
    document.body.classList.toggle('is-busy', visible);
    clearInterval(ticker);
    if (!visible) return;
    kind = nextKind;
    node.style.margin = `-${KINDS[kind].hy}px 0 0 -${KINDS[kind].hx}px`;
    node.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
    frame = 0;
    img.src = frameSrc(kind, 0);
    const image = img;
    ticker = window.setInterval(() => {
      frame = (frame + 1) % FRAMES;
      image.src = frameSrc(kind, frame);
    }, STEP);
  }
  function begin(k: BusyKind = 'busy'): void {
    nextKind = k;
    if (depth++ === 0 && FINE) timer = window.setTimeout(() => show(true), 500);
  }
  function end(): void {
    depth = Math.max(0, depth - 1);
    if (depth === 0) {
      clearTimeout(timer);
      show(false);
    }
  }
  async function wrap<T>(promise: Promise<T>): Promise<T> {
    begin();
    try {
      return await promise;
    } finally {
      end();
    }
  }
  function init(): void {
    node = byId('busyCursor');
    img = byId<HTMLImageElement>('busyImg');
    if (FINE) {
      for (const k of Object.keys(KINDS) as BusyKind[]) {
        for (let i = 0; i < FRAMES; i++) new Image().src = frameSrc(k, i);
      }
    }
    addEventListener(
      'pointermove',
      (event) => {
        if (on && node && event.pointerType === 'mouse') {
          node.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
        }
      },
      { passive: true },
    );
  }
  return { begin, end, wrap, init };
}

export const busyCursor = createBusyCursor();

/** The small ring that follows a fine pointer (desktop only). */
export function initCursor(): void {
  busyCursor.init();
  if (!FINE || REDUCE) return;
  const ring = byId('cursor');
  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const cur = { ...pos };
  addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    pos.x = event.clientX;
    pos.y = event.clientY;
    if (state.entered) ring.classList.add('is-on');
    const target = event.target instanceof Element ? event.target : null;
    const link = target?.closest('a, button, input, textarea, label, [data-go]');
    ring.classList.toggle('is-link', !!link && !ring.classList.contains('is-hot'));
  });
  document.addEventListener('pointerleave', () => ring.classList.remove('is-on'));
  tickers.add(() => {
    cur.x += (pos.x - cur.x) * 0.2;
    cur.y += (pos.y - cur.y) * 0.2;
    ring.style.transform = `translate3d(${cur.x.toFixed(1)}px, ${cur.y.toFixed(1)}px, 0)`;
  });
}
