import { $$ } from './dom';
import { COARSE, FINE, REDUCE } from './env';
import { pointer } from './pointer';
import { randomGlyph } from './rain';
import { on, state } from './state';

/**
 * Glyph field for the paper pages (proyectos, sobre) and the world stage: the
 * same glyphs as the rain, but still. The pointer carries a halo that
 * "decodes" the cells it passes over: they flicker through glyphs, light up
 * ink in the centre and green around it, then cool down and leave a trail.
 * Nothing on the page moves, so the cards and the text stay readable.
 */
interface FieldTheme {
  bg: string;
  dormant: string;
  core: (heat: number) => string;
  rim: (heat: number) => string;
}

const FIELD_THEMES: Record<'paper' | 'dark', FieldTheme> = {
  // Paper pages: ink at the centre of the halo, green towards the rim (like the rain's head and neck).
  paper: {
    bg: 'rgb(231,234,238)',
    dormant: 'rgba(21,24,29,.05)',
    core: (h) => `rgba(21,24,29,${(0.25 + h * 0.6).toFixed(3)})`,
    rim: (h) => `rgba(23,149,91,${(0.1 + h * 0.85).toFixed(3)})`,
  },
  // The world: same field on the dark stage, pale core and signal-green rim.
  dark: {
    bg: 'rgb(14,16,19)',
    dormant: 'rgba(201,206,214,.07)',
    core: (h) => `rgba(231,234,238,${(0.2 + h * 0.6).toFixed(3)})`,
    rim: (h) => `rgba(31,191,117,${(0.08 + h * 0.8).toFixed(3)})`,
  },
};

interface Cell {
  g: string;
  h: number;
}

function glyphField(canvas: HTMLCanvasElement, pageName: string, theme: FieldTheme) {
  const ctx = canvas.getContext('2d');
  const BG = theme.bg;
  const CELL = COARSE ? 22 : 26;
  const FS = COARSE ? 11 : 13;
  const RADIUS = COARSE ? 150 : 200;
  const DORMANT = theme.dormant;
  let cols = 0;
  let rows = 0;
  let cells: Cell[] = [];
  let W = 0;
  let H = 0;
  let raf = 0;
  let last = 0;
  let on = false;
  let mono = 'monospace';
  let layer: HTMLCanvasElement | null = null; // offscreen copy of the dormant grid, redrawn only where cells cool down
  let px = -1e4;
  let py = -1e4;
  let seenX = -1;
  let seenY = -1;
  let wake = 0;
  const hot = new Set<number>();

  function cellAt(i: number) {
    return { x: (i % cols) * CELL + (CELL - FS * 0.6) / 2, y: Math.floor(i / cols) * CELL + (CELL - FS) / 2 };
  }
  function paintDormant(target: CanvasRenderingContext2D, i: number): void {
    const { x, y } = cellAt(i);
    target.fillStyle = BG;
    target.fillRect(x - 2, y - 2, FS + 4, FS + 4);
    target.fillStyle = DORMANT;
    target.fillText(cells[i].g, x, y);
  }
  function size(): void {
    if (!ctx) return;
    const dpr = Math.min(2, devicePixelRatio || 1);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mono = getComputedStyle(document.documentElement).getPropertyValue('--font-mono') || 'monospace';
    cols = Math.ceil(W / CELL) + 1;
    rows = Math.ceil(H / CELL) + 1;
    cells = Array.from({ length: cols * rows }, () => ({ g: randomGlyph(), h: 0 }));
    hot.clear();
    layer = document.createElement('canvas');
    layer.width = canvas.width;
    layer.height = canvas.height;
    const lc = layer.getContext('2d');
    if (!lc) return;
    lc.setTransform(dpr, 0, 0, dpr, 0, 0);
    lc.font = `500 ${FS}px ${mono}`;
    lc.textBaseline = 'top';
    lc.fillStyle = BG;
    lc.fillRect(0, 0, W, H);
    lc.fillStyle = DORMANT;
    for (let i = 0; i < cells.length; i++) {
      const { x, y } = cellAt(i);
      lc.fillText(cells[i].g, x, y);
    }
    ctx.drawImage(layer, 0, 0, W, H);
  }
  function frame(now: number): void {
    if (!on || !ctx || !layer) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    // The page is fixed to the viewport, so client coordinates are canvas coordinates.
    const moved = pointer.x !== seenX || pointer.y !== seenY;
    if (moved) {
      seenX = pointer.x;
      seenY = pointer.y;
      wake = 1;
    }
    // Fine pointers keep the halo lit; touch lets it fade a couple of seconds after the tap.
    if (!FINE) wake = Math.max(0, wake - dt / 2.2);
    if (px < -1e3) {
      px = seenX;
      py = seenY;
    }
    const k = 1 - Math.pow(0.001, dt);
    px += (seenX - px) * k;
    py += (seenY - py) * k;
    ctx.drawImage(layer, 0, 0, W, H);
    ctx.font = `500 ${FS}px ${mono}`;
    ctx.textBaseline = 'top';
    // Heat the cells inside the halo; the gain fades with distance.
    if (wake > 0) {
      const c0 = Math.max(0, Math.floor((px - RADIUS) / CELL));
      const c1 = Math.min(cols - 1, Math.ceil((px + RADIUS) / CELL));
      const r0 = Math.max(0, Math.floor((py - RADIUS) / CELL));
      const r1 = Math.min(rows - 1, Math.ceil((py + RADIUS) / CELL));
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const dx = c * CELL + CELL / 2 - px;
          const dy = r * CELL + CELL / 2 - py;
          const d = Math.sqrt(dx * dx + dy * dy) / RADIUS;
          if (d > 1) continue;
          const gain = (1 - d) * (1 - d) * wake;
          const i = r * cols + c;
          const cell = cells[i];
          if (gain > cell.h) {
            if (gain - cell.h > 0.08 && Math.random() < 0.5) cell.g = randomGlyph();
            cell.h = gain;
            hot.add(i);
          }
        }
      }
    }
    const decay = Math.pow(0.18, dt);
    const lc = layer.getContext('2d');
    if (!lc) return;
    lc.font = `500 ${FS}px ${mono}`;
    lc.textBaseline = 'top';
    for (const i of hot) {
      const cell = cells[i];
      cell.h *= decay;
      if (cell.h < 0.02) {
        cell.h = 0;
        hot.delete(i);
        paintDormant(lc, i);
        continue;
      }
      if (cell.h > 0.35 && Math.random() < 0.06) cell.g = randomGlyph();
      const { x, y } = cellAt(i);
      const h = cell.h;
      ctx.fillStyle = BG;
      ctx.fillRect(x - 2, y - 2, FS + 4, FS + 4);
      ctx.fillStyle = h > 0.72 ? theme.core(h) : theme.rim(h);
      ctx.fillText(cell.g, x, y);
    }
    raf = requestAnimationFrame(frame);
  }
  function start(): void {
    if (!ctx || on || document.hidden) return;
    on = true;
    size();
    last = performance.now();
    px = py = -1e4;
    wake = 0;
    if (!REDUCE) raf = requestAnimationFrame(frame);
  }
  function stop(): void {
    on = false;
    cancelAnimationFrame(raf);
  }
  addEventListener('resize', () => {
    if (on) size();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (state.entered && state.page === pageName) start();
  });
  return { start, stop };
}

/** One field per `canvas.glyph-field`, keyed by its `data-field` page; only the active page's field runs. */
export function initGlyphFields(): void {
  const fields = new Map<string, ReturnType<typeof glyphField>>();
  for (const canvas of $$<HTMLCanvasElement>('canvas.glyph-field')) {
    const page = canvas.dataset.field ?? '';
    const theme = canvas.dataset.theme === 'dark' ? FIELD_THEMES.dark : FIELD_THEMES.paper;
    fields.set(page, glyphField(canvas, page, theme));
  }
  on('app:pageswap', (event) => {
    for (const [page, field] of fields) {
      if (page === event.detail) field.start();
      else field.stop();
    }
  });
}
