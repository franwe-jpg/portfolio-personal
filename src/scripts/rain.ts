import { byId } from './dom';
import { COARSE, REDUCE } from './env';
import { on, state } from './state';

/** Glyph set shared by the inicio rain and the paper-page fields. */
export const RAIN_GLYPHS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789Z:・"=*+<>¦|ç';
export const randomGlyph = (): string => RAIN_GLYPHS[(Math.random() * RAIN_GLYPHS.length) | 0];

interface Stream {
  x: number;
  fs: number;
  y: number;
  v: number;
  a: number;
  len: number;
}

/** Matrix rain for inicio: columns of glyphs that fall without pause while the page is active. */
export function initRain(): void {
  const canvas = byId<HTMLCanvasElement>('rain');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const BG = 'rgb(231,234,238)';
  let streams: Stream[] = [];
  let base = 15;
  let W = 0;
  let H = 0;
  let raf = 0;
  let last = 0;
  let running = false;
  let mono = 'monospace';

  // Smaller glyphs read as farther away: slower and dimmer.
  function mk(x: number, spread: boolean): Stream {
    const fs = base * (0.6 + Math.random() * 0.9);
    const depth = (fs / base - 0.6) / 0.9;
    return {
      x,
      fs,
      y: -Math.random() * H * (spread ? 1.6 : 0.5),
      v: fs * (4.5 + depth * 9 + Math.random() * 3),
      a: 0.3 + depth * 0.7,
      len: 12 + Math.random() * 30,
    };
  }
  function size(): void {
    const dpr = Math.min(2, devicePixelRatio || 1);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    mono = getComputedStyle(document.documentElement).getPropertyValue('--font-mono') || 'monospace';
    base = COARSE ? 12 : 15;
    const cw = base * 0.8;
    const n = Math.ceil(W / cw) + 1;
    streams = [];
    for (let i = 0; i < n; i++) {
      const k = COARSE ? 1 + (Math.random() < 0.5 ? 1 : 0) : 2 + (Math.random() < 0.6 ? 1 : 0);
      for (let j = 0; j < k; j++) streams.push(mk(i * cw, true));
    }
    ctx!.fillStyle = BG;
    ctx!.fillRect(0, 0, W, H);
  }
  /** Reduced motion: one frozen frame of the rain (heads, necks and fading tails), never redrawn. */
  function drawStill(): void {
    ctx!.textBaseline = 'top';
    for (const s of streams) {
      const fs = s.fs;
      const gy = Math.floor((Math.random() * H) / fs) * fs;
      ctx!.font = `600 ${fs}px ${mono}`;
      const tail = Math.min(s.len, 9) | 0;
      for (let i = 2; i < tail; i++) {
        ctx!.fillStyle = `rgba(31,191,117,${(s.a * 0.4 * (1 - i / tail)).toFixed(3)})`;
        ctx!.fillText(randomGlyph(), s.x, gy - fs * i);
      }
      ctx!.fillStyle = `rgba(23,149,91,${s.a * 0.95})`;
      ctx!.fillText(randomGlyph(), s.x, gy - fs);
      ctx!.fillStyle = `rgba(21,24,29,${s.a})`;
      ctx!.fillText(randomGlyph(), s.x, gy);
    }
  }
  function frame(now: number): void {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    // Fade the previous frame instead of clearing: that is what leaves the long trails.
    ctx!.fillStyle = 'rgba(231,234,238,.085)';
    ctx!.fillRect(0, 0, W, H);
    ctx!.textBaseline = 'top';
    for (const s of streams) {
      s.y += s.v * dt;
      const fs = s.fs;
      const gy = Math.floor(s.y / fs) * fs;
      ctx!.font = `600 ${fs}px ${mono}`;
      // Bright head, green neck, and a glyph somewhere in the tail that keeps changing.
      ctx!.fillStyle = `rgba(21,24,29,${s.a})`;
      ctx!.fillText(randomGlyph(), s.x, gy);
      ctx!.fillStyle = `rgba(23,149,91,${s.a * 0.95})`;
      ctx!.fillText(randomGlyph(), s.x, gy - fs);
      if (Math.random() < 0.35) {
        ctx!.fillStyle = `rgba(31,191,117,${s.a * 0.55})`;
        ctx!.fillText(randomGlyph(), s.x, gy - fs * (2 + ((Math.random() * Math.min(s.len, 14)) | 0)));
      }
      if (gy > H + s.len * fs) Object.assign(s, mk(s.x, false));
    }
    raf = requestAnimationFrame(frame);
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
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (state.entered && state.page === 'inicio') start();
  });
  on('app:pageswap', (event) => (event.detail === 'inicio' ? start() : stop()));
}
