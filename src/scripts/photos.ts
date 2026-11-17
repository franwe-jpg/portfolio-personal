import { gsap } from 'gsap';
import { audio } from './audio';
import { $, $$, byId } from './dom';
import { REDUCE } from './env';

/**
 * The "Fotos" section: one group of photos at a time, "Ver más fotos" swapping the whole group
 * for the next (wrapping to the first after the last), and a viewer that opens a photo over the
 * dimmed page.
 *
 * Layout: the photos become columns. A portrait photo is a column of its own, as tall as the
 * band; two landscape photos stack into one column (each keeps its ratio, so they share a width
 * and their heights add up to the band). Columns fill bands that span the grid's width exactly,
 * so every photo keeps its own ratio and nothing is cropped. A group is one band on wide screens
 * and two on narrow ones; the bands are cut so their heights stay close to the target, which
 * keeps the section at about the same height from one group to the next.
 */
const WIDE = { band: 420, bandsPerGroup: 1 };
const NARROW = { band: 220, bandsPerGroup: 2 };
const NARROW_BELOW = 700;

const ratioOf = (item: HTMLElement) => parseFloat(item.style.getPropertyValue('--r')) || 1;

/** A column: one photo, or two landscape photos stacked. */
interface Column {
  items: HTMLElement[];
  ratios: number[];
}

/** Portrait photos stand alone; landscape ones pair with the next landscape one, in order. */
function columnsOf(items: HTMLElement[]): Column[] {
  const columns: Column[] = [];
  let open: Column | null = null;
  for (const item of items) {
    const r = ratioOf(item);
    if (r < 1) {
      columns.push({ items: [item], ratios: [r] });
    } else if (open) {
      open.items.push(item);
      open.ratios.push(r);
      open = null;
    } else {
      open = { items: [item], ratios: [r] };
      columns.push(open);
    }
  }
  return columns;
}

/**
 * Column width at band height `h` is linear, `a * h + b`: a single photo is `r * h`; a stack is
 * `(h - gap) / (1/r1 + 1/r2)`, the width at which both heights plus the gap add up to `h`.
 */
function widthTerms(col: Column, gap: number): [number, number] {
  if (col.ratios.length === 1) return [col.ratios[0], 0];
  const k = col.ratios.reduce((sum, r) => sum + 1 / r, 0);
  return [1 / k, -gap / k];
}

/** The band height at which `cols` (side by side, `gap` apart) span exactly `W`. */
function bandHeight(cols: Column[], W: number, gap: number): number {
  let a = 0;
  let b = 0;
  for (const col of cols) {
    const [ca, cb] = widthTerms(col, gap);
    a += ca;
    b += cb;
  }
  return (W - gap * (cols.length - 1) - b) / a;
}

/** Cuts the columns (in order) into the band count that best fits `target`, as even as possible. */
function bands(cols: Column[], W: number, gap: number, target: number): Column[][] {
  const n = cols.length;
  const natural = cols.reduce((sum, col) => {
    const [a, b] = widthTerms(col, gap);
    return sum + a * target + b + gap;
  }, -gap);
  const count = Math.max(1, Math.min(n, Math.round(natural / W)));
  // best[k][i]: lowest cost of the first i columns in k bands; cut[k][i]: where band k starts.
  const best = Array.from({ length: count + 1 }, () => new Array<number>(n + 1).fill(Infinity));
  const cut = Array.from({ length: count + 1 }, () => new Array<number>(n + 1).fill(0));
  best[0][0] = 0;
  for (let k = 1; k <= count; k++) {
    for (let i = k; i <= n; i++) {
      for (let j = k - 1; j < i; j++) {
        const cost = best[k - 1][j] + Math.log(bandHeight(cols.slice(j, i), W, gap) / target) ** 2;
        if (cost < best[k][i]) {
          best[k][i] = cost;
          cut[k][i] = j;
        }
      }
    }
  }
  const out: Column[][] = [];
  for (let k = count, i = n; k > 0; i = cut[k][i], k--) out.unshift(cols.slice(cut[k][i], i));
  return out;
}

/** Places the bands' photos absolutely, band under band; returns the total height. */
function place(groupBands: Column[][], W: number, gap: number): number {
  let y = 0;
  for (const cols of groupBands) {
    const h = bandHeight(cols, W, gap);
    let x = 0;
    for (const col of cols) {
      const [a, b] = widthTerms(col, gap);
      const w = a * h + b;
      let top = y;
      for (const [i, item] of col.items.entries()) {
        const ih = col.items.length === 1 ? h : w / col.ratios[i];
        Object.assign(item.style, { left: `${x}px`, top: `${top}px`, width: `${w}px`, height: `${ih}px` });
        top += ih + gap;
      }
      x += w + gap;
    }
    y += h + gap;
  }
  return y - gap;
}

/**
 * The viewer: a modal dialog with the photo, over the dimmed page; Escape, ✕ or a click outside
 * close it. Its animations are CSS (`.lightbox` in pages.css), never GSAP: to read a fixed
 * element's transform GSAP detaches and re-attaches it, and that silently drops a dialog out of
 * modal mode (no backdrop, no Escape).
 */
function initViewer(grid: HTMLElement): void {
  const dialog = byId<HTMLDialogElement>('lightbox');
  const img = byId<HTMLImageElement>('lightboxImg');
  let opener: HTMLElement | null = null;
  let closing = 0;
  const close = () => {
    if (!dialog.open || closing) return;
    if (REDUCE) {
      dialog.close();
      return;
    }
    dialog.classList.add('is-closing');
    closing = window.setTimeout(() => dialog.close(), 180);
  };
  dialog.addEventListener('close', () => {
    clearTimeout(closing);
    closing = 0;
    dialog.classList.remove('is-closing');
    opener?.focus({ preventScroll: true });
  });
  for (const button of $$<HTMLButtonElement>('.photo-open', grid)) {
    button.addEventListener('click', () => {
      const thumb = $<HTMLImageElement>('img', button);
      if (!thumb) return;
      opener = button;
      img.src = thumb.currentSrc || thumb.src;
      img.alt = thumb.alt;
      img.width = thumb.naturalWidth || Number(thumb.getAttribute('width'));
      img.height = thumb.naturalHeight || Number(thumb.getAttribute('height'));
      audio.tick();
      dialog.showModal();
    });
  }
  byId('lightboxClose').addEventListener('click', close);
  // A click on the backdrop lands on the dialog itself (the photo and the button stop it).
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close();
  });
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });
}

export function initPhotos(): void {
  const grid = document.getElementById('photos');
  if (!grid) return;
  initViewer(grid);
  const items = $$('.photo', grid);
  const columns = columnsOf(items);
  const more = document.getElementById('photosMore');
  const count = more ? byId('photosCount') : null;
  let groups: Column[][][] = [];
  let current = 0;
  let busy = false;
  let W = 0;
  let gap = 8;

  function show(): void {
    const group = groups[current];
    if (!group) return;
    const visible = new Set(group.flat().flatMap((col) => col.items));
    for (const item of items) item.hidden = !visible.has(item);
    grid!.style.height = `${place(group, W, gap)}px`;
    grid!.classList.add('is-laid');
    if (count) count.textContent = `${current + 1}/${groups.length}`;
  }
  const prefetch = (index: number) => {
    const group = groups[index % groups.length];
    if (!group) return;
    for (const item of group.flat().flatMap((col) => col.items)) {
      const img = $<HTMLImageElement>('img', item);
      if (img) img.loading = 'eager';
    }
  };

  // Regroup on every width change; the group that holds the first photo on screen stays current.
  new ResizeObserver(() => {
    const w = grid.clientWidth;
    if (!w || w === W) return;
    const anchor = groups[current]?.[0]?.[0]?.items[0] ?? items[0];
    W = w;
    gap = parseFloat(getComputedStyle(grid).columnGap) || 0;
    const mode = W < NARROW_BELOW ? NARROW : WIDE;
    const all = bands(columns, W, gap, mode.band);
    groups = [];
    for (let i = 0; i < all.length; i += mode.bandsPerGroup) groups.push(all.slice(i, i + mode.bandsPerGroup));
    current = Math.max(0, groups.findIndex((g) => g.flat().some((col) => col.items.includes(anchor))));
    show();
  }).observe(grid);

  if (!more) return;
  more.addEventListener('click', async () => {
    if (busy || groups.length < 2) return;
    busy = true;
    audio.tick();
    if (!REDUCE) await gsap.to(grid, { opacity: 0, y: -6, duration: 0.2, ease: 'power2.in' });
    current = (current + 1) % groups.length;
    show();
    if (!REDUCE) await gsap.fromTo(grid, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.45, ease: 'expo.out', clearProps: 'opacity,transform' });
    prefetch(current + 1);
    busy = false;
  });
  // Once the section is reached, the next group starts loading so the first click is instant.
  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    prefetch(current + 1);
  });
  io.observe(more);
}
