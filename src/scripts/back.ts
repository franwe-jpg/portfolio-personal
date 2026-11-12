import { audio } from './audio';
import { byId } from './dom';
import { t } from './i18n';
import { router } from './router';
import { isCurrentScene, setMode } from './scene';
import { on, state } from './state';

/**
 * Header back arrow: one step up from where the visitor is. inicio goes back to the gate,
 * proyectos and sobre to inicio, and the world to inicio too, unless another time was picked on
 * the clock or the switcher: then it first returns to the current scene.
 */
type BackTarget = keyof typeof t.header.back;

function target(): BackTarget {
  if (!state.page || state.page === 'inicio') return 'gate';
  if (state.page === 'mundo' && !isCurrentScene()) return 'now';
  return 'inicio';
}

export function initBack(): void {
  const button = byId<HTMLButtonElement>('backGate');
  const paint = () => {
    const label = t.header.back[target()];
    button.title = label;
    button.setAttribute('aria-label', label);
  };
  button.addEventListener('click', () => {
    if (state.busy) return;
    const to = target();
    if (to === 'gate') {
      // The gate only exists at load time: reload without a hash. Hunt progress stays in storage.
      history.replaceState(null, '', location.pathname + location.search);
      location.reload();
      return;
    }
    audio.tick();
    if (to === 'now') setMode('auto');
    else void router.go('inicio');
  });
  on('app:pageswap', paint);
  on('app:scene', paint);
  // The schedule can turn the picked scene into the current one (or the other way round) while it is on screen.
  setInterval(paint, 30000);
  paint();
}
