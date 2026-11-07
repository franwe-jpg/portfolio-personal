import type { Scene } from '../../i18n/ui';
import type { ViewMode } from './camera';

/**
 * The world's public API and the slot that holds the built instance. Modules that run before
 * `three` is downloaded (scene switcher, panel, hunt) import this file, never `./index`, so the
 * world chunk stays lazy. `world` is null until the first visit to `mundo` builds it, and stays
 * null in fallback mode.
 */
export interface WorldApi {
  /** First reveal: dolly in from far away and type the scene tag. */
  intro(instant: boolean): void;
  /** Switch the visible diorama; called while the cell curtain covers the canvas. */
  show(key: Scene): void;
  /** View per page: inicio (wide, auto-orbit), mundo (interactive), off (paused, faded). */
  setView(mode: ViewMode, opts?: { instant?: boolean }): void;
  setLabel(on: boolean): void;
  start(): void;
  stop(): void;
}

export let world: WorldApi | null = null;

export function setWorld(api: WorldApi | null): void {
  world = api;
}
