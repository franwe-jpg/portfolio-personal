import { gsap } from 'gsap';
import { byId } from '../dom';
import { isNarrow, REDUCE } from '../env';

/**
 * Cell curtain: a grid of squares that grow over the stage, hide the diorama swap, and shrink
 * away again. Pure DOM, so it also runs in fallback mode (where it only covers the labels).
 */
let cells: HTMLElement[] = [];
let grid: [number, number] = [1, 1];

function buildCells(): void {
  const cellmask = byId('cellmask');
  const r = cellmask.getBoundingClientRect();
  const size = isNarrow() ? 64 : 88;
  const cols = Math.max(4, Math.ceil(r.width / size));
  const rows = Math.max(4, Math.ceil(r.height / size));
  if (cols === grid[1] && rows === grid[0] && cells.length) return;
  grid = [rows, cols];
  cellmask.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  cellmask.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  cellmask.replaceChildren(...Array.from({ length: rows * cols }, () => document.createElement('span')));
  cells = [...cellmask.children] as HTMLElement[];
  if (REDUCE) cellmask.classList.add('is-fade');
}

/** Resolves once the stage is fully covered. */
export async function coverStage(): Promise<void> {
  buildCells();
  gsap.killTweensOf(cells);
  if (REDUCE) {
    await gsap.to(cells, { opacity: 1, duration: 0.15, ease: 'none' });
  } else {
    gsap.set(cells, { scale: 0, opacity: 1 });
    await gsap.to(cells, { scale: 1.02, duration: 0.2, ease: 'expo.in', stagger: { grid, from: 'start', amount: 0.15 } });
  }
}

/** Resolves once the stage shows again. */
export async function revealStage(): Promise<void> {
  if (REDUCE) await gsap.to(cells, { opacity: 0, duration: 0.2, ease: 'none' });
  else await gsap.to(cells, { scale: 0, duration: 0.55, ease: 'expo.out', stagger: { grid, from: 'start', amount: 0.35 } });
}
