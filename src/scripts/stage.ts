import { busyCursor } from './cursor';
import { WEBGL } from './env';
import { on, state } from './state';
import { setWorld, world } from './world/handle';

/**
 * Lazy world: `three` and the world modules download on the first trip to `mundo` (the
 * download starts with the page transition, before the blob covers the screen) and the
 * busy cursor shows while the chunk arrives and the dioramas build. Without WebGL the
 * world never loads.
 */
let loading: Promise<void> | null = null;

function load(): Promise<void> {
  loading ??= import('./world')
    .then((module) => module.initWorld())
    .then(
      (api) => {
        setWorld(api);
        if (state.page) api.setView(state.page === 'mundo' ? 'mundo' : 'off', { instant: true });
        if (state.page === 'mundo') api.intro(false);
      },
      (error: unknown) => {
        console.warn('[world] unavailable:', error);
        setWorld(null);
      },
    );
  return loading;
}

export function initStage(): void {
  if (!WEBGL) return;
  on('app:navigate', (event) => {
    if (event.detail === 'mundo' && !world) void load();
  });
  on('app:pageswap', (event) => {
    if (event.detail === 'mundo' && !world) void busyCursor.wrap(load());
  });
}
