import { gsap } from 'gsap';
import { audio } from './audio';
import { $$, byId } from './dom';
import { REDUCE } from './env';

/**
 * Justified rows: splits the group into a fixed number of rows (2, or 3 on narrow screens) that
 * each fill the width exactly, choosing the breaks (in order) that keep the rows' heights as even
 * as possible. Every photo keeps its own ratio, nothing is cropped, no row is left half empty,
 * and since the groups add up to similar widths the section keeps about the same height from one
 * group to the next. The CSS flex layout is the fallback until this runs.
 */
function justify(page: HTMLElement): void {
  const items = [...page.children] as HTMLElement[];
  const W = page.clientWidth - 1;
  if (!items.length || W <= 0) return;
  const gap = parseFloat(getComputedStyle(page).columnGap) || 0;
  const ratio = items.map((item) => parseFloat(item.style.getPropertyValue('--r')) || 1);
  const n = items.length;
  const rows = Math.min(n, W < 520 ? 3 : 2);
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
  page.classList.add('is-justified');
}

/**
 * "Ver más fotos": the section shows one group of photos at a time; the button fades the
 * current group out and the next one in, wrapping to the first after the last. Hidden groups
 * keep their lazy images unloaded, so the next group is prefetched once the current one shows.
 */
export function initPhotos(): void {
  const grid = document.getElementById('photos');
  if (!grid) return;
  const pages = $$('.photos-page', grid);
  let current = 0;
  let busy = false;
  // Re-justify the visible group whenever the width changes (also the first time it gets a size).
  let lastW = 0;
  new ResizeObserver(() => {
    if (grid.clientWidth === lastW) return;
    lastW = grid.clientWidth;
    justify(pages[current]);
  }).observe(grid);

  const more = document.getElementById('photosMore');
  if (!more) return;
  const count = byId('photosCount');

  const prefetch = (index: number) => {
    for (const img of $$<HTMLImageElement>('img', pages[index % pages.length])) img.loading = 'eager';
  };

  more.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    audio.tick();
    const from = pages[current];
    current = (current + 1) % pages.length;
    const to = pages[current];
    if (!REDUCE) await gsap.to(from, { opacity: 0, y: -6, duration: 0.2, ease: 'power2.in' });
    from.hidden = true;
    gsap.set(from, { clearProps: 'opacity,transform' });
    to.hidden = false;
    justify(to);
    count.textContent = `${current + 1}/${pages.length}`;
    if (!REDUCE) await gsap.fromTo(to, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.45, ease: 'expo.out', clearProps: 'opacity,transform' });
    prefetch(current + 1);
    busy = false;
  });
  // Once the section is reached, the second group starts loading so the first click is instant.
  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    prefetch(1);
  });
  io.observe(more);
}
