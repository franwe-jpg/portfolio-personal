import { $$, byId } from './dom';
import { t } from './i18n';
import { argNow, resolveScene, sceneFor, statusLine } from './schedule';
import { scramble } from './scramble';
import { on, SCENE_TO_PARAM, state, type Mode } from './state';

/**
 * Scene labels for the world page: tag, title, clock and the test switcher.
 * The dioramas themselves and the cell-mask switch arrive in Fase 3.
 */
export function tickStatus(): void {
  byId('statusTxt').textContent = statusLine(state.scene);
  byId('clock').textContent = t.mundo.clock(argNow().time);
}

export function paintSceneInfo(animate: boolean): void {
  const scene = t.mundo.scenes[state.scene];
  const tag = t.mundo.sceneTag(scene);
  const tagEl = byId('sceneTag');
  if (animate) scramble(tagEl, tag, 0.55);
  else tagEl.textContent = tag;
  byId('sceneTitle').textContent = scene.title;
  for (const button of $$<HTMLButtonElement>('.seg button')) {
    button.setAttribute('aria-pressed', String(button.dataset.mode === state.mode));
  }
  tickStatus();
}

/** Forces a scene (or `auto`) and mirrors it in `?escena=` so the URL can be shared. */
export function setMode(mode: Mode): void {
  state.mode = mode;
  const url = new URL(location.href);
  if (mode === 'auto') url.searchParams.delete('escena');
  else url.searchParams.set('escena', SCENE_TO_PARAM[mode]);
  history.replaceState(history.state, '', url);
  const next = resolveScene(mode);
  const changed = next !== state.scene;
  state.scene = next;
  paintSceneInfo(changed);
}

export function initScene(): void {
  paintSceneInfo(false);
  for (const button of $$<HTMLButtonElement>('.seg button')) {
    button.addEventListener('click', () => {
      if (!state.busy) setMode((button.dataset.mode as Mode | undefined) ?? 'auto');
    });
  }
  on('app:enter', () => scramble(byId('sceneTag'), t.mundo.sceneTag(t.mundo.scenes[state.scene]), 0.55));
  setInterval(() => {
    tickStatus();
    if (state.mode === 'auto' && state.entered && !state.panelOpen && !state.busy) {
      const scene = sceneFor(argNow());
      if (scene !== state.scene) {
        state.scene = scene;
        paintSceneInfo(true);
      }
    }
  }, 30000);
}
