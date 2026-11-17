import { gsap } from 'gsap';
import { byId } from './dom';
import { REDUCE } from './env';

/**
 * "Mancha": an organic blob (graphite fill + light rim) that grows from the click to cover the
 * screen, then shrinks away over the new page. The wobbly edge is a closed curve whose radius is
 * a sum of a few sines with random phases, rebuilt as a plain SVG path every frame. No SVG
 * filter: full-screen turbulence + displacement re-rasterized each frame made every page change
 * stutter, on phones above all.
 */
const POINTS = 36;
const RIM = 2.5;

function createMancha() {
  const svg = byId<HTMLElement>('mancha');
  const blob = byId<HTMLElement>('manchaBlob');
  const rim = byId<HTMLElement>('manchaRim');
  const m = { r: 0, cx: innerWidth / 2, cy: innerHeight / 2, wob: 0 };
  // Edge shape: integer frequencies keep the curve closed; phases change every transition.
  const waves = [
    { f: 3, a: 0.5, p: 0, s: 1 },
    { f: 5, a: 0.3, p: 0, s: -1.6 },
    { f: 8, a: 0.2, p: 0, s: 2.3 },
  ];
  const cos = new Float32Array(POINTS);
  const sin = new Float32Array(POINTS);
  const offs = new Float32Array(POINTS);
  for (let i = 0; i < POINTS; i++) {
    const th = (i / POINTS) * Math.PI * 2;
    cos[i] = Math.cos(th);
    sin[i] = Math.sin(th);
  }

  function origin(x: number, y: number): void {
    m.cx = x;
    m.cy = y;
  }
  function reshape(): void {
    for (const w of waves) w.p = Math.random() * Math.PI * 2;
  }
  /** Smooth closed curve through the points (quadratic segments between midpoints). */
  function pathFor(r: number, amp: number): string {
    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = 0; i < POINTS; i++) {
      const rr = Math.max(0, r + offs[i] * amp);
      xs.push(m.cx + cos[i] * rr);
      ys.push(m.cy + sin[i] * rr);
    }
    const mid = (i: number) => {
      const j = (i + 1) % POINTS;
      return `${((xs[i] + xs[j]) / 2).toFixed(1)} ${((ys[i] + ys[j]) / 2).toFixed(1)}`;
    };
    let d = `M${mid(POINTS - 1)}`;
    for (let i = 0; i < POINTS; i++) d += `Q${xs[i].toFixed(1)} ${ys[i].toFixed(1)} ${mid(i)}`;
    return `${d}Z`;
  }
  function draw(): void {
    const r = Math.max(0, m.r);
    if (r <= 0) {
      blob.setAttribute('d', '');
      rim.setAttribute('d', '');
      return;
    }
    // Edge amplitude in px, as the old displacement filter: grows with the blob, capped.
    const base = Math.min(70, innerWidth * 0.06, r * 0.25);
    const amp = base * (1 + Math.sin(m.wob * Math.PI * 2) * 0.15);
    const tw = m.wob * Math.PI * 2;
    for (let i = 0; i < POINTS; i++) {
      const th = (i / POINTS) * Math.PI * 2;
      let o = 0;
      for (const w of waves) o += w.a * Math.sin(th * w.f + w.p + tw * w.s);
      offs[i] = o;
    }
    blob.setAttribute('d', pathFor(r, amp));
    rim.setAttribute('d', pathFor(r + RIM, amp));
  }
  // The edge can dip `base` px inward; cover past it.
  const coverRadius = () =>
    Math.hypot(Math.max(m.cx, innerWidth - m.cx), Math.max(m.cy, innerHeight - m.cy)) + 90;

  async function cover(): Promise<void> {
    reshape();
    m.r = 0;
    m.wob = 0;
    draw();
    svg.classList.add('is-on');
    await gsap.to(m, { r: coverRadius(), wob: 0.5, duration: 0.3, ease: 'expo.in', onUpdate: draw });
  }
  async function reveal(): Promise<void> {
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
