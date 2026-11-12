import { byId } from './dom';
import { COARSE, REDUCE } from './env';
import { on, state } from './state';

/** Glyph set shared by the inicio rain and the paper-page fields. */
export const RAIN_GLYPHS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789Z:・"=*+<>¦|ç';
export const randomGlyph = (): string => RAIN_GLYPHS[(Math.random() * RAIN_GLYPHS.length) | 0];

/** Inks of a stream, drawn at full strength in the atlas; each stream applies its own alpha. */
const INKS = ['rgb(21,24,29)', 'rgb(23,149,91)', 'rgb(31,191,117)'] as const;
const HEAD = 0;
const NECK = 1;
const TAIL = 2;
/** Glyph sizes are quantised to this many steps so the atlas stays small. */
const SIZES = 6;
const PAD = 2;
/** Fade per frame at 60 fps; other frame rates get the same trail length in time. */
const FADE_60 = 0.085;
/** Frames closer than this are skipped, so 120/144 Hz screens do not pay double. */
const MIN_FRAME_MS = 1000 / 64;

interface Stream {
  x: number;
  /** Size step, 0 (far) .. SIZES - 1 (near). */
  si: number;
  fs: number;
  y: number;
  v: number;
  a: number;
  len: number;
}

interface Row {
  y: number;
  w: number;
  h: number;
}

/**
 * Matrix rain for inicio: columns of glyphs that fall without pause while the page is active.
 * Every glyph is rasterised once into an atlas (one row per ink and size) and copied with
 * drawImage: fillText per glyph was the main-thread bottleneck, worst where canvas 2D runs
 * on the CPU and the katakana go through font fallback on every call.
 */
export function initRain(): void {
  const canvas = byId<HTMLCanvasElement>('rain');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const BG = 'rgb(231,234,238)';
  const N = RAIN_GLYPHS.length;
  let streams: Stream[] = [];
  let base = 15;
  let dpr = 1;
  let W = 0;
  let H = 0;
  let raf = 0;
  let last = 0;
  let running = false;
  let mono = 'monospace';
  let atlas: HTMLCanvasElement | null = null;
  let rows: Row[] = [];
  /** Slow-frame budget: if the rain keeps missing frames, it drops to half density once. */
  let slow = 0;
  let lite = false;

  const sizeAt = (si: number) => base * (0.6 + (si / (SIZES - 1)) * 0.9);

  function buildAtlas(): void {
    rows = [];
    const probe = document.createElement('canvas').getContext('2d');
    if (!probe) return;
    let y = 0;
    let width = 0;
    for (let ink = 0; ink < INKS.length; ink++) {
      for (let si = 0; si < SIZES; si++) {
        const fs = sizeAt(si);
        probe.font = `600 ${fs}px ${mono}`;
        let gw = 0;
        for (const g of RAIN_GLYPHS) gw = Math.max(gw, probe.measureText(g).width);
        const row = { y, w: Math.ceil(gw) + PAD * 2, h: Math.ceil(fs * 1.25) + PAD * 2 };
        rows.push(row);
        y += row.h;
        width = Math.max(width, row.w * N);
      }
    }
    atlas = document.createElement('canvas');
    atlas.width = Math.ceil(width * dpr);
    atlas.height = Math.ceil(y * dpr);
    const ac = atlas.getContext('2d');
    if (!ac) {
      atlas = null;
      return;
    }
    ac.setTransform(dpr, 0, 0, dpr, 0, 0);
    ac.textBaseline = 'top';
    for (let ink = 0; ink < INKS.length; ink++) {
      ac.fillStyle = INKS[ink];
      for (let si = 0; si < SIZES; si++) {
        const row = rows[ink * SIZES + si];
        ac.font = `600 ${sizeAt(si)}px ${mono}`;
        for (let g = 0; g < N; g++) ac.fillText(RAIN_GLYPHS[g], g * row.w + PAD, row.y + PAD);
      }
    }
  }

  /** A random glyph of `ink` at the stream's size, top-left at (x, y) like fillText with textBaseline top. */
  function glyph(ink: number, si: number, x: number, y: number): void {
    const row = rows[ink * SIZES + si];
    const g = (Math.random() * N) | 0;
    ctx!.drawImage(atlas!, g * row.w * dpr, row.y * dpr, row.w * dpr, row.h * dpr, x - PAD, y - PAD, row.w, row.h);
  }

  // Smaller glyphs read as farther away: slower and dimmer.
  function mk(x: number, spread: boolean): Stream {
    const si = (Math.random() * SIZES) | 0;
    const fs = sizeAt(si);
    const depth = si / (SIZES - 1);
    return {
      x,
      si,
      fs,
      y: -Math.random() * H * (spread ? 1.6 : 0.5),
      v: fs * (4.5 + depth * 9 + Math.random() * 3),
      a: 0.3 + depth * 0.7,
      len: 12 + Math.random() * 30,
    };
  }
  function size(): void {
    dpr = Math.min(lite ? 1 : 2, devicePixelRatio || 1);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    mono = getComputedStyle(document.documentElement).getPropertyValue('--font-mono') || 'monospace';
    base = COARSE ? 12 : 15;
    buildAtlas();
    const cw = base * 0.8;
    const n = Math.ceil(W / cw) + 1;
    streams = [];
    for (let i = 0; i < n; i++) {
      const k = COARSE || lite ? 1 + (Math.random() < 0.5 ? 1 : 0) : 2 + (Math.random() < 0.6 ? 1 : 0);
      for (let j = 0; j < k; j++) streams.push(mk(i * cw, true));
    }
    ctx!.globalAlpha = 1;
    ctx!.fillStyle = BG;
    ctx!.fillRect(0, 0, W, H);
  }
  /** Reduced motion: one frozen frame of the rain (heads, necks and fading tails), never redrawn. */
  function drawStill(): void {
    if (!atlas) return;
    for (const s of streams) {
      const fs = s.fs;
      const gy = Math.floor((Math.random() * H) / fs) * fs;
      const tail = Math.min(s.len, 9) | 0;
      for (let i = 2; i < tail; i++) {
        ctx!.globalAlpha = s.a * 0.4 * (1 - i / tail);
        glyph(TAIL, s.si, s.x, gy - fs * i);
      }
      ctx!.globalAlpha = s.a * 0.95;
      glyph(NECK, s.si, s.x, gy - fs);
      ctx!.globalAlpha = s.a;
      glyph(HEAD, s.si, s.x, gy);
    }
    ctx!.globalAlpha = 1;
  }
  /** Halves the density (and caps the resolution) once, when frames keep arriving late. */
  function watch(dtMs: number): void {
    if (lite) return;
    slow = dtMs > 30 ? slow + 1 : Math.max(0, slow - 2);
    if (slow > 45) {
      lite = true;
      size();
    }
  }
  function frame(now: number): void {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dtMs = now - last;
    if (dtMs < MIN_FRAME_MS) return;
    const dt = Math.min(0.05, dtMs / 1000 || 0.016);
    last = now;
    watch(dtMs);
    if (!atlas) return;
    // Fade the previous frame instead of clearing: that is what leaves the long trails.
    ctx!.globalAlpha = 1 - Math.pow(1 - FADE_60, dt * 60);
    ctx!.fillStyle = BG;
    ctx!.fillRect(0, 0, W, H);
    for (const s of streams) {
      s.y += s.v * dt;
      const fs = s.fs;
      const gy = Math.floor(s.y / fs) * fs;
      // Bright head, green neck, and a glyph somewhere in the tail that keeps changing.
      ctx!.globalAlpha = s.a;
      glyph(HEAD, s.si, s.x, gy);
      ctx!.globalAlpha = s.a * 0.95;
      glyph(NECK, s.si, s.x, gy - fs);
      if (Math.random() < 0.35) {
        ctx!.globalAlpha = s.a * 0.55;
        glyph(TAIL, s.si, s.x, gy - fs * (2 + ((Math.random() * Math.min(s.len, 14)) | 0)));
      }
      if (gy > H + s.len * fs) Object.assign(s, mk(s.x, false));
    }
    ctx!.globalAlpha = 1;
  }
  function start(): void {
    if (running || document.hidden) return;
    running = true;
    size();
    if (REDUCE) {
      drawStill();
      return;
    }
    last = performance.now();
    slow = 0;
    raf = requestAnimationFrame(frame);
  }
  function stop(): void {
    running = false;
    cancelAnimationFrame(raf);
  }
  addEventListener('resize', () => {
    if (!running) return;
    size();
    if (REDUCE) drawStill();
  });
  // The mono face may arrive after the first build: redraw the atlas with it.
  document.fonts?.addEventListener?.('loadingdone', () => {
    if (!running) return;
    buildAtlas();
    if (REDUCE) drawStill();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (state.entered && state.page === 'inicio') start();
  });
  on('app:pageswap', (event) => (event.detail === 'inicio' ? start() : stop()));
}
