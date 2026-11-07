import { busyCursor } from './cursor';
import { byId } from './dom';
import { WEBGL } from './env';
import { on, state } from './state';
import { showFallback } from './world/fallback';
import { setWorld, world } from './world/handle';

/**
 * Lazy world: `three` and the world modules download on the first trip to `mundo` (the
 * download starts with the page transition, before the blob covers the screen) and the
 * busy cursor shows while the chunk arrives and the dioramas build. Without WebGL, when the
 * chunk cannot be downloaded, when the build fails or when the context is lost, the SVG
 * illustration takes over and the world never loads (again).
 */
let loading: Promise<void> | null = null;

async function load(): Promise<void> {
  let module: typeof import('./world');
  try {
    module = await import('./world');
  } catch (error) {
    console.warn('[world] chunk unavailable, lite mode:', error);
    showFallback(true);
    return;
  }
  try {
    const api = await module.initWorld();
    setWorld(api);
    byId('world-canvas').addEventListener('webglcontextlost', () => {
      console.warn('[world] WebGL context lost');
      api.stop();
      setWorld(null);
      showFallback();
    });
    if (state.page) api.setView(state.page === 'mundo' ? 'mundo' : 'off', { instant: true });
    if (state.page === 'mundo') api.intro(false);
  } catch (error) {
    console.warn('[world] WebGL unavailable:', error);
    setWorld(null);
    showFallback();
  }
}

/** Resolves once the world chunk has been built (or given up for the fallback); immediately if nothing started. */
export function worldLoaded(): Promise<void> {
  return loading ?? Promise.resolve();
}

export function initStage(): void {
  if (!WEBGL) {
    showFallback();
    return;
  }
  const start = () => (loading ??= load());
  on('app:navigate', (event) => {
    if (event.detail === 'mundo' && !world) void start();
  });
  on('app:pageswap', (event) => {
    if (event.detail === 'mundo' && !world) void busyCursor.wrap(start());
  });
}
