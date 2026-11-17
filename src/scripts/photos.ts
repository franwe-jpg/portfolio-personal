import { gsap } from 'gsap';
import { audio } from './audio';
import { $$, byId } from './dom';
import { REDUCE } from './env';

/**
 * The "Fotos" section: one group of photos at a time, in justified rows, and "Ver más fotos"
 * swapping the whole group for the next (wrapping to the first after the last).
 *
 * Groups are sized to the screen: a wide grid shows `WIDE.groups` groups in 2 rows (about 9
 * photos each), a narrow one `NARROW.groups` in 3 rows (about 7). The photos are cut into groups
 * by their summed ratio, not by count, so every group fills its rows at about the same height
 * and the section does not jump from one group to the next.
 */
const WIDE = { groups: 3, rows: 2 };
const NARROW = { groups: 4, rows: 3 };
const NARROW_BELOW = 700;

const ratioOf = (item: HTMLElement) => parseFloat(item.style.getPropertyValue('--r')) || 1;

/** Cuts `items` (in order) into `count` runs whose summed ratios are as even as possible. */
function group(items: HTMLElement[], count: number): HTMLElement[][] {
  const total = items.reduce((sum, item) => sum + ratioOf(item), 0);
  const groups: HTMLElement[][] = [[]];
  let acc = 0;
  for (const [i, item] of items.entries()) {
    const r = ratioOf(item);
    const goal = (total * groups.length) / count;
    const left = items.length - i;
    const slots = count - groups.length;
    // Close the current group when adding this photo would overshoot its share by more than
    // stopping short does (and keep enough photos for the groups still to fill).
    if (groups.length < count && groups[groups.length - 1].length && (acc + r - goal > goal - acc || left <= slots)) {
      groups.push([]);
    }
    groups[groups.length - 1].push(item);
    acc += r;
  }
  return groups;
}

/**
 * Justified rows: lays `items` in `rows` rows that each fill the grid's width exactly, choosing
 * the breaks (in order) that keep the row heights as even as possible. Every photo keeps its own
 * ratio, nothing is cropped and no row is left half empty.
 */
function justify(grid: HTMLElement, items: HTMLElement[], rowsWanted: number): void {
  const W = grid.clientWidth - 1;
  if (!items.length || W <= 0) return;
  const gap = parseFloat(getComputedStyle(grid).columnGap) || 0;
  const ratio = items.map(ratioOf);
  const n = items.length;
  const rows = Math.min(n, rowsWanted);
  const heightOf = (from: number, to: number) => {
    let sum = 0;
    for (let k = from; k < to; k++) sum += ratio[k];
    return (W - gap * (to - from - 1)) / sum;
  };
  const even = (rows * W) / ratio.reduce((a, b) => a + b, 0);
  // best[r][i]: lowest cost to lay the first i photos in r rows; cut[r][i]: where row r starts.
  const best = Array.from({ length: rows + 1 }, () => new Array<number>(n + 1).fill(Infinity));
  const cut = Array.from({ length: rows + 1 }, () => new Array<number>(n + 1).fill(0));
  best[0][0] = 0;
  for (let r = 1; r <= rows; r++) {
    for (let i = r; i <= n; i++) {
      for (let j = r - 1; j < i; j++) {
        const cost = best[r - 1][j] + Math.log(heightOf(j, i) / even) ** 2;
        if (cost < best[r][i]) {
          best[r][i] = cost;
          cut[r][i] = j;
        }
      }
    }
  }
  for (let r = rows, i = n; r > 0; i = cut[r][i], r--) {
    const h = heightOf(cut[r][i], i);
    for (let k = cut[r][i]; k < i; k++) {
      items[k].style.width = `${(ratio[k] * h).toFixed(2)}px`;
      items[k].style.height = `${h.toFixed(2)}px`;
    }
  }
  grid.classList.add('is-justified');
}

export function initPhotos(): void {
  const grid = document.getElementById('photos');
  if (!grid) return;
  const items = $$('.photo', grid);
  const more = document.getElementById('photosMore');
  const count = more ? byId('photosCount') : null;
  let mode = NARROW;
  let groups: HTMLElement[][] = [items];
  let current = 0;
  let busy = false;

  function show(): void {
    const visible = new Set(groups[current]);
    for (const item of items) item.hidden = !visible.has(item);
    justify(grid!, groups[current], mode.rows);
    if (count) count.textContent = `${current + 1}/${groups.length}`;
  }
  const prefetch = (index: number) => {
    for (const img of $$<HTMLImageElement>('img', grid)) {
      if (groups[index % groups.length].includes(img.parentElement as HTMLElement)) img.loading = 'eager';
    }
  };

  // Regroup when the grid crosses the breakpoint; re-justify on any width change. The group
  // that holds the first photo on screen stays the current one.
  let lastW = 0;
  new ResizeObserver(() => {
    const w = grid.clientWidth;
    if (!w || w === lastW) return;
    lastW = w;
    const next = w < NARROW_BELOW ? NARROW : WIDE;
    if (next !== mode || groups.length === 1) {
      const anchor = groups[current][0];
      mode = next;
      groups = group(items, mode.groups);
      current = Math.max(0, groups.findIndex((g) => g.includes(anchor)));
    }
    show();
  }).observe(grid);

  if (!more) return;
  more.addEventListener('click', async () => {
    if (busy) return;
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
