import { byId } from './dom';
import { WEBGL } from './env';
import { t } from './i18n';

/**
 * Gate loader: the thin bar at the top and the percentage reflect real work.
 * Two kinds of jobs feed it:
 *
 * - downloads/fonts (`fractions`, 90 % of the bar): `three` through `loadThree()`
 *   and the two web fonts;
 * - boot steps (`build`, the final 10 %): work registered with
 *   `registerBootStep()` before loading starts, each reporting 0..1. The world
 *   (plan, Fase 3) registers its build here, e.g.
 *   `registerBootStep('world', async (report) => initWorld(await loadThree(), report))`.
 *
 * `loadThree()` caches the module promise, so a later phase may call it from
 * the gate (honest bar, instant world) or lazily when entering `mundo`.
 */
export type LoaderState = 'idle' | 'loading' | 'ready' | 'failed';
export type BootStep = (report: (fraction: number) => void) => Promise<void>;

interface Loader {
  state: LoaderState;
  pct: number;
  fractions: Record<string, number>;
  build: number;
  steps: Map<string, BootStep>;
  stepFractions: Record<string, number>;
}

export const loader: Loader = {
  state: 'idle',
  pct: 0,
  fractions: {},
  build: 0,
  steps: new Map(),
  stepFractions: {},
};

type ThreeModule = typeof import('three');
let threePromise: Promise<ThreeModule> | null = null;

/** Dynamic import of `three` from npm, cached; a separate chunk the browser fetches once. */
export function loadThree(): Promise<ThreeModule> {
  threePromise ??= import('three');
  return threePromise;
}

export function registerBootStep(key: string, step: BootStep): void {
  if (loader.state !== 'idle') throw new Error(`Boot step "${key}" registered after loading started`);
  loader.steps.set(key, step);
}

/** Called while the enter button waits for the loader, to show the percentage on it. */
let pendingLabel: ((pct: number, loading: boolean) => void) | null = null;
export function onProgressLabel(fn: typeof pendingLabel): void {
  pendingLabel = fn;
}

export function renderProgress(): void {
  const keys = Object.keys(loader.fractions);
  const avg = keys.length ? keys.reduce((sum, key) => sum + loader.fractions[key], 0) / keys.length : 0;
  const pct = Math.min(1, avg * 0.9 + loader.build * 0.1);
  loader.pct = Math.max(loader.pct, pct);
  const shown = Math.floor(loader.pct * 100);
  const bar = byId('bar');
  const text = byId('loadtxt');
  bar.style.transform = `scaleX(${loader.pct})`;
  if (loader.state === 'ready') {
    text.textContent = '';
    byId('loadbar').style.opacity = '0';
  } else if (loader.state === 'failed') {
    text.textContent = t.loader.offline;
  } else {
    text.textContent = t.loader.loading(Math.min(99, shown));
  }
  pendingLabel?.(Math.min(99, shown), loader.state === 'loading');
}

async function track(key: string, job: Promise<unknown>): Promise<void> {
  loader.fractions[key] = 0;
  renderProgress();
  await job;
  loader.fractions[key] = 1;
  renderProgress();
}

function fontProgress(key: string, spec: string): Promise<void> {
  return track(key, (document.fonts?.load?.(spec) ?? Promise.resolve()).catch(() => {}));
}

async function runBootSteps(): Promise<void> {
  const keys = [...loader.steps.keys()];
  if (!keys.length) return;
  const update = () => {
    loader.build = keys.reduce((sum, key) => sum + (loader.stepFractions[key] ?? 0), 0) / keys.length;
    renderProgress();
  };
  // Steps run in registration order: later ones may depend on earlier ones.
  for (const key of keys) {
    loader.stepFractions[key] = 0;
    await loader.steps.get(key)!((fraction) => {
      loader.stepFractions[key] = Math.min(1, Math.max(0, fraction));
      update();
    });
    loader.stepFractions[key] = 1;
    update();
  }
}

/** Runs every job once; resolves when the bar is complete (or the load failed). */
export async function startLoading(): Promise<void> {
  if (loader.state !== 'idle') return;
  loader.state = 'loading';
  renderProgress();
  try {
    const jobs = [
      WEBGL ? track('three', loadThree()) : null,
      fontProgress('f1', '500 16px "Instrument Sans"'),
      fontProgress('f2', '400 12px "JetBrains Mono"'),
    ];
    await Promise.all(jobs);
    // Final ~10 %: the registered boot steps (the world: geometry, textures, shader compile, first render).
    await runBootSteps();
    loader.build = 1;
    loader.state = 'ready';
    byId('loadbar').classList.add('is-done');
  } catch (error) {
    console.warn('[gate] load incomplete, lite mode:', error);
    loader.state = 'failed';
    loader.pct = 1;
  }
  renderProgress();
}
