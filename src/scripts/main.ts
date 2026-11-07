import { audio, initAudio } from './audio';
import { initCursor } from './cursor';
import { DEBUG } from './env';
import { initGate } from './gate';
import { initGlyphFields } from './glyph-field';
import { initHero } from './hero';
import { loader } from './loader';
import { initPointer } from './pointer';
import { initRain } from './rain';
import { initReveals } from './reveals';
import { initRouter, router } from './router';
import { initScene } from './scene';
import { state } from './state';

/**
 * Client entry. Each module registers its listeners here; later phases add
 * theirs next to these (the world in Fase 3, the panel in Fase 6, the ticket
 * hunt in Fase 8). Modules talk through `state` and the `app:*` events
 * declared in state.ts. A phase that needs work on the gate's loading bar
 * calls `registerBootStep()` from loader.ts before `initGate()` runs.
 */
initPointer();
initCursor();
initScene();
initRain();
initGlyphFields();
initReveals();
initHero();
initRouter();
initAudio();
initGate();

if (DEBUG) {
  Object.assign(window, { __app: { state, router, audio, loader } });
}
