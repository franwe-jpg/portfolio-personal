import type { Scene } from '../i18n/ui';
import { audio } from './audio';
import { busyCursor } from './cursor';
import { $$, byId } from './dom';
import { t } from './i18n';
import { argNow, resolveScene, sceneFor, statusLine } from './schedule';
import { scramble } from './scramble';
import { emit, on, SCENE_TO_PARAM, state, type Mode } from './state';
import { coverStage, revealStage } from './world/curtain';
import { world } from './world/handle';

/**
 * Scene selection: the Argentina schedule (auto), the test switcher and `?escena=` pick the
 * diorama; a change runs behind the cell curtain and repaints tag, title and status. Works the
 * same with the world built, still loading or replaced by the fallback illustration.
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

/** Swaps the diorama behind the cell curtain; other inputs wait while `state.busy`. */
export async function switchScene(next: Scene): Promise<void> {
  if (next === state.scene || state.busy) {
    paintSceneInfo(false);
    return;
  }
  state.busy = true;
  busyCursor.begin();
  world?.setLabel(false);
  audio.whoosh();
  await coverStage();
  state.scene = next;
  emit('app:scene', next);
  world?.show(next);
  paintSceneInfo(true);
  await revealStage();
  state.busy = false;
  busyCursor.end();
  world?.setLabel(true);
}

/** Forces a scene (or `auto`) and mirrors it in `?escena=` so the URL can be shared. */
export function setMode(mode: Mode): void {
  state.mode = mode;
  const url = new URL(location.href);
  if (mode === 'auto') url.searchParams.delete('escena');
  else url.searchParams.set('escena', SCENE_TO_PARAM[mode]);
  history.replaceState(history.state, '', url);
  const next = resolveScene(mode);
  if (next === state.scene) paintSceneInfo(false);
  else void switchScene(next);
}

export function initScene(): void {
  paintSceneInfo(false);
  for (const button of $$<HTMLButtonElement>('.seg button')) {
    button.addEventListener('click', () => {
      audio.tick();
      if (!state.busy) setMode((button.dataset.mode as Mode | undefined) ?? 'auto');
    });
  }
  on('app:enter', () => scramble(byId('sceneTag'), t.mundo.sceneTag(t.mundo.scenes[state.scene]), 0.55));
  setInterval(() => {
    tickStatus();
    if (state.mode === 'auto' && state.entered && !state.panelOpen && !state.busy) {
      const scene = sceneFor(argNow());
      if (scene !== state.scene) void switchScene(scene);
    }
  }, 30000);
}
