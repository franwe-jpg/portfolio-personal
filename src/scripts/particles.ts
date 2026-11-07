import { byId } from './dom';
import { REDUCE } from './env';
import { pointer } from './pointer';

/**
 * Particle "FS" mark on the gate (canvas 2D). Phases: 'boot' (particles
 * spiral in and settle), 'solid' (the key cap is drawn as one shape, with the
 * green dot as an eye that follows the pointer), 'leave' (the cap bursts back
 * into particles that fly off-screen).
 */
type Kind = 'white' | 'dark' | 'green';
type Phase = 'boot' | 'solid' | 'leave';

interface Particle {
  hx: number;
  hy: number;
  kind: Kind;
  col: string;
  ang: number;
  r0: number;
  spin: number;
  delay: number;
  ph: number;
  ex: number;
  ey: number;
  sx: number;
  sy: number;
  sa: number;
  ss: number;
}

const BOOT_MS = 3800; // last particle lands
const SOLID_AT = BOOT_MS + 150; // cap turns solid (one flash)
const COLORS: Record<Kind, [string, string]> = {
  white: ['#ffffff', '#dfe4ea'],
  dark: ['#2b313b', '#1a1e25'],
  green: ['#1fbf75', '#5fe0a3'],
};
const CAP = { fill: '#10120d', edge: '#2b313b', ink: '#ffffff', dot: '#1fbf75' };
/** Key-cap geometry, normalised to the cap side (0..1). Matches the favicon: rounded square, FS, green dot. */
const GEO = { radius: 0.22, font: 0.47, tx: 0.485, ty: 0.56, dx: 0.8125, dy: 0.1875, dr: 0.094 };

function rrect(c: CanvasRenderingContext2D, x: number, y: number, s: number, r: number): void {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + s, y, x + s, y + s, r);
  c.arcTo(x + s, y + s, x, y + s, r);
  c.arcTo(x, y + s, x, y, r);
  c.arcTo(x, y, x + s, y, r);
  c.closePath();
}

function heart(c: CanvasRenderingContext2D, hx: number, hy: number, hs: number): void {
  c.beginPath();
  c.moveTo(hx, hy + hs * 0.95);
  c.bezierCurveTo(hx - hs * 1.6, hy - hs * 0.2, hx - hs * 0.9, hy - hs * 1.25, hx, hy - hs * 0.45);
  c.bezierCurveTo(hx + hs * 0.9, hy - hs * 1.25, hx + hs * 1.6, hy - hs * 0.2, hx, hy + hs * 0.95);
  c.closePath();
}

const easeOut = (u: number) => 1 - Math.pow(1 - u, 3);

export interface Particles {
  /** Resolves after the first particle frame is on screen. */
  firstPaint: Promise<void>;
  /** Resolves once the cap is solid. */
  booted: Promise<void>;
  leave(): void;
  stop(): void;
}

export function createParticles(): Particles {
  const cv = byId<HTMLCanvasElement>('mark');
  const ctx = cv.getContext('2d')!;
  // Full-screen layer for the particle phases, so they can enter from the screen edges and fly off it.
  const fc = document.createElement('canvas');
  fc.className = 'mark-sky';
  fc.setAttribute('aria-hidden', 'true');
  byId('gate').appendChild(fc);
  const fctx = fc.getContext('2d')!;
  let W = 0;
  let H = 0;
  let VW = 0;
  let VH = 0;
  let MR = { left: 0, top: 0 };
  let pts: Particle[] = [];
  let raf = 0;
  let running = true;
  const mouse = { x: -1e4, y: -1e4 };
  const rot = { x: 0, y: 0 };
  let phase: Phase = 'boot';
  let bootT0 = 0;
  let solidT = 0;
  let leaveT = 0;
  let painted: () => void = () => {};
  let booted: () => void = () => {};
  const firstPaint = new Promise<void>((resolve) => {
    painted = resolve;
  });
  const bootDone = new Promise<void>((resolve) => {
    booted = resolve;
  });

  function resize(): void {
    const dpr = Math.min(2, devicePixelRatio || 1);
    const r = cv.getBoundingClientRect();
    W = r.width;
    H = r.height;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    VW = innerWidth;
    VH = innerHeight;
    MR = { left: r.left, top: r.top };
    fc.width = Math.round(VW * dpr);
    fc.height = Math.round(VH * dpr);
    fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function build(): void {
    // Rasterise the cap once; the colour channel tells which part a pixel belongs to.
    const ow = 256;
    const off = document.createElement('canvas');
    off.width = off.height = ow;
    const o = off.getContext('2d', { willReadFrequently: true })!;
    o.fillStyle = '#000';
    rrect(o, 0, 0, ow, ow * GEO.radius);
    o.fill();
    o.fillStyle = '#f00';
    o.textAlign = 'center';
    o.textBaseline = 'middle';
    o.font = `700 ${ow * GEO.font}px "Instrument Sans", sans-serif`;
    o.fillText('FS', ow * GEO.tx, ow * GEO.ty);
    o.fillStyle = '#0f0';
    o.beginPath();
    o.arc(ow * GEO.dx, ow * GEO.dy, ow * GEO.dr, 0, 6.283);
    o.fill();
    const data = o.getImageData(0, 0, ow, ow).data;
    pts = [];
    const step = 4;
    for (let y = 0; y < ow; y += step) {
      for (let x = 0; x < ow; x += step) {
        const k = (y * ow + x) * 4;
        if (data[k + 3] < 128) continue;
        const kind: Kind = data[k] > 128 ? 'white' : data[k + 1] > 128 ? 'green' : 'dark';
        if (kind === 'dark' && Math.random() < 0.5) continue; // the body of the cap is a looser cloud
        pts.push({
          hx: x / ow - 0.5,
          hy: y / ow - 0.5,
          kind,
          col: COLORS[kind][Math.random() < 0.65 ? 0 : 1],
          // Spawn: somewhere far outside, on a spiral that unwinds while it approaches.
          ang: Math.random() * 6.283,
          r0: 0.7 + Math.random() * 1.3,
          spin: 2.5 + Math.random() * 2.5,
          delay: Math.random() * 0.8,
          ph: Math.random() * 6.28,
          ex: 0,
          ey: 0,
          sx: 0,
          sy: 0,
          sa: 0,
          ss: 0,
        });
      }
    }
  }

  function capRect() {
    const S = Math.min(H * 0.76, W * 0.5);
    const shiftX = REDUCE ? 0 : pointer.nx * W * 0.02;
    const shiftY = REDUCE ? 0 : pointer.ny * H * 0.02;
    return { S, x: (W - S) / 2 + shiftX, y: (H - S) / 2 + shiftY };
  }

  // The green dot is an eye: the pupil follows the pointer, the lids close as the pointer moves away,
  // it blinks now and then, and it falls in love when the pointer rests on the Ingresar button.
  const eye = { px: 0, py: 0, dil: 0, open: 0.62, glanceAt: 0, gx: 0, gy: 0 };
  function drawEye(S: number, now: number, capX: number, capY: number): void {
    const r = S * GEO.dr;
    const ex = S * GEO.dx;
    const ey = S * GEO.dy;
    const vx = MR.left + capX + ex; // eye centre in viewport coordinates
    const vy = MR.top + capY + ey;
    const dx = pointer.x - vx;
    const dy = pointer.y - vy;
    const dist = Math.hypot(dx, dy) || 1;
    const eb = document.getElementById('enter')?.getBoundingClientRect();
    const love = !!eb && pointer.x >= eb.left && pointer.x <= eb.right && pointer.y >= eb.top && pointer.y <= eb.bottom;
    const near = 1 - Math.min(1, dist / (Math.max(VW, VH) * 0.55)); // 1 = pointer on the eye, 0 = far away
    let open = 0.62;
    let tx = 0;
    let ty = 0;
    let dil = 0;
    if (!REDUCE) {
      if (!love) {
        open = 0.1 + near * 0.52;
        const bl = now % 4300;
        if (bl < 150) open *= Math.abs(bl - 75) / 75; // blink
      }
      // Where the pupil wants to be: towards the pointer, with a quick random glance every few seconds.
      const reach = r * 0.34;
      const m = Math.min(reach, dist * 0.07);
      tx = (dx / dist) * m;
      ty = (dy / dist) * m;
      if (now - eye.glanceAt > 2600 + (eye.glanceAt % 900)) {
        eye.glanceAt = now;
        eye.gx = (Math.random() - 0.5) * reach * 2;
        eye.gy = (Math.random() - 0.5) * reach * 1.4;
      }
      if (now - eye.glanceAt < 260) {
        tx = eye.gx;
        ty = eye.gy;
      }
      dil = love ? 1 : near;
    }
    // Smooth follow with a little lag, so the pupil feels alive rather than glued to the pointer.
    eye.px += (tx - eye.px) * 0.22;
    eye.py += (ty - eye.py) * 0.22;
    eye.dil += (dil - eye.dil) * 0.1;
    eye.open += (open - eye.open) * (open < eye.open ? 0.5 : 0.25);
    const o = eye.open; // 0..1 → half-height of the opening as a fraction of the radius
    ctx.save();
    // Green eyeball; the lids are the green bands above and below a straight-edged opening.
    ctx.fillStyle = CAP.dot;
    ctx.beginPath();
    ctx.arc(ex, ey, r, 0, 6.283);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ex, ey, r * 0.96, 0, 6.283);
    ctx.clip();
    const top = ey - r * o;
    const bot = ey + r * o;
    ctx.beginPath();
    ctx.rect(ex - r, top, r * 2, bot - top);
    ctx.clip();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ex - r, top, r * 2, bot - top);
    const px = ex + eye.px;
    const py = ey + Math.max(-r * o * 0.5, Math.min(r * o * 0.5, eye.py));
    if (love) {
      const beat = REDUCE ? 1 : 1 + Math.max(0, Math.sin(now / 110)) * 0.14;
      ctx.fillStyle = '#e63946';
      heart(ctx, px, py + r * 0.04, r * 0.38 * beat);
      ctx.fill();
    } else {
      // Big black pupil, one large and one small highlight.
      ctx.fillStyle = CAP.fill;
      ctx.beginPath();
      ctx.arc(px, py, r * (0.5 + eye.dil * 0.1), 0, 6.283);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px - r * 0.2, py - r * 0.18, r * 0.15, 0, 6.283);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px + r * 0.18, py + r * 0.16, r * 0.07, 0, 6.283);
      ctx.fill();
    }
    // Lid edges: a thin dark line gives the lids their outline, like a drawn cartoon eye.
    ctx.fillStyle = 'rgba(16,18,13,.55)';
    ctx.fillRect(ex - r, top, r * 2, Math.max(1, r * 0.06));
    ctx.fillRect(ex - r, bot - Math.max(1, r * 0.06), r * 2, Math.max(1, r * 0.06));
    ctx.restore();
  }

  function drawCap(now: number): void {
    const { S, x, y } = capRect();
    const cx = x + S / 2;
    const cy = y + S / 2;
    // A key cap: slight 3D tilt following the pointer, pressed when hovered.
    const hover = mouse.x > x && mouse.x < x + S && mouse.y > y && mouse.y < y + S;
    const press = hover && !REDUCE ? 0.97 : 1;
    const flash = phase === 'solid' ? Math.max(0, 1 - (now - solidT) / 320) : 0;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.transform(Math.cos(rot.y * 0.6) * press, rot.x * 0.08, -rot.y * 0.08, Math.cos(rot.x * 0.6) * press, 0, 0);
    ctx.translate(-S / 2, -S / 2);
    // Cast shadow lying to the right (sun low on the left), only meaningful once the paper is visible.
    if (!REDUCE && document.body.classList.contains('booted')) {
      ctx.save();
      ctx.transform(1, 0, 0.6, 0.18, S * 0.06, S * 0.82);
      ctx.fillStyle = 'rgba(21,24,29,.09)';
      rrect(ctx, 0, 0, S, S * GEO.radius);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = CAP.fill;
    rrect(ctx, 0, 0, S, S * GEO.radius);
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, S * 0.008);
    ctx.strokeStyle = CAP.edge;
    if (flash) {
      ctx.shadowColor = `rgba(255,255,255,${0.55 * flash})`;
      ctx.shadowBlur = 40 * flash;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = CAP.ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${S * GEO.font}px "Instrument Sans", sans-serif`;
    ctx.fillText('FS', S * GEO.tx, S * GEO.ty);
    drawEye(S, now, x, y);
    if (flash) {
      ctx.fillStyle = `rgba(255,255,255,${0.25 * flash})`;
      rrect(ctx, 0, 0, S, S * GEO.radius);
      ctx.fill();
    }
    ctx.restore();
  }

  function frame(now: number): void {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    rot.y += ((REDUCE ? 0 : pointer.nx * 0.9) - rot.y) * 0.06;
    rot.x += ((REDUCE ? 0 : -pointer.ny * 0.6) - rot.x) * 0.06;
    if (phase === 'boot' && !bootT0) bootT0 = now;
    if (phase === 'boot' && now - bootT0 >= SOLID_AT) {
      phase = 'solid';
      solidT = now;
      fctx.clearRect(0, 0, VW, VH);
      booted();
    }
    if (phase === 'solid') {
      drawCap(now);
      painted();
      raf = requestAnimationFrame(frame);
      return;
    }

    // Particle phases draw on the full-screen layer, in viewport coordinates.
    const c = fctx;
    c.clearRect(0, 0, VW, VH);
    const { S, x, y } = capRect();
    const cx = MR.left + x + S / 2;
    const cy = MR.top + y + S / 2;
    const far = Math.max(VW, VH) * 0.5;
    const lt = phase === 'leave' ? Math.min(1, (now - leaveT) / 900) : 0;
    const elapsed = (now - bootT0) / 1000;
    for (const p of pts) {
      const hx = cx + p.hx * S;
      const hy = cy + p.hy * S;
      let px = hx;
      let py = hy;
      let a = 1;
      if (phase === 'boot') {
        const u = Math.min(1, Math.max(0, (elapsed - p.delay) / (BOOT_MS / 1000 - p.delay)));
        const e = easeOut(u);
        const k = 1 - e;
        const ang = p.ang + p.spin * k;
        px = cx + Math.cos(ang) * p.r0 * far * k + (hx - cx) * e;
        py = cy + Math.sin(ang) * p.r0 * far * 0.75 * k + (hy - cy) * e;
        a = Math.min(1, u * 6);
      } else {
        const e = lt * lt;
        px += p.ex * VW * e;
        py += p.ey * VH * e;
        a = 1 - lt;
      }
      p.sx = px;
      p.sy = py;
      p.sa = a;
      p.ss = (p.kind === 'dark' ? 3.2 : 3.6) * Math.min(1.9, Math.max(1, W / 620));
    }
    for (const p of pts) {
      if (p.sa <= 0) continue;
      c.globalAlpha = p.sa;
      c.fillStyle = p.col;
      if (p.kind !== 'dark') {
        c.globalAlpha = p.sa * 0.22;
        c.fillRect(p.sx - p.ss, p.sy - p.ss, p.ss * 2, p.ss * 2);
        c.globalAlpha = p.sa;
      }
      c.fillRect(p.sx - p.ss / 2, p.sy - p.ss / 2, p.ss, p.ss);
    }
    c.globalAlpha = 1;
    painted();
    if (phase === 'leave' && lt >= 1) {
      running = false;
      c.clearRect(0, 0, VW, VH);
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  const local = (event: PointerEvent) => {
    const r = cv.getBoundingClientRect();
    mouse.x = event.clientX - r.left;
    mouse.y = event.clientY - r.top;
  };
  cv.addEventListener('pointermove', local);
  cv.addEventListener('pointerdown', local);
  const clear = () => {
    mouse.x = mouse.y = -1e4;
  };
  cv.addEventListener('pointerleave', clear);
  cv.addEventListener('pointerup', (event) => {
    if (event.pointerType !== 'mouse') setTimeout(clear, 120);
  });
  cv.addEventListener('pointercancel', clear);
  addEventListener('resize', () => {
    if (running) resize();
  });

  const ready = (document.fonts?.load?.('700 200px "Instrument Sans"') ?? Promise.resolve())
    .catch(() => {})
    .then(() => {
      resize();
      build();
      if (REDUCE) {
        phase = 'solid';
        solidT = -1e4;
        booted();
      }
      raf = requestAnimationFrame(frame);
    });
  void bootDone.then(() => {
    cv.dataset.phase = 'solid';
    cv.dataset.bootMs = String(Math.round(performance.now()));
  });

  return {
    firstPaint: ready.then(() => firstPaint),
    booted: ready.then(() => bootDone),
    leave() {
      // The cap shatters: every particle flies away from the centre of the mark.
      for (const p of pts) {
        const d = Math.hypot(p.hx, p.hy) || 1;
        const s = 1.2 + Math.random() * 1.4;
        p.ex = (p.hx / d) * s;
        p.ey = (p.hy / d) * s * 1.3;
      }
      phase = 'leave';
      leaveT = performance.now();
      ctx.clearRect(0, 0, W, H);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
  };
}
