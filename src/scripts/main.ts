import { audio, initAudio } from './audio';
import { initBack } from './back';
import { initCursor } from './cursor';
import { DEBUG } from './env';
import { initGalleries } from './gallery';
import { initGate } from './gate';
import { initGlyphFields } from './glyph-field';
import { initHero } from './hero';
import { initHunt } from './hunt';
import { initLangSwitch } from './i18n';
import { loader } from './loader';
import { initPanel, panelApi } from './panel';
import { initPointer } from './pointer';
import { initRain } from './rain';
import { initReveals } from './reveals';
import { initRouter, router } from './router';
import { initScene } from './scene';
import { initStage } from './stage';
import { state } from './state';

/**
 * Client entry. Each module registers its listeners here.
 * Modules talk through `state` and the `app:*` events declared in state.ts.
 * The 3D world (src/scripts/world) is not imported here: stage.ts loads it
 * lazily on the first visit to `mundo`. A phase that needs work on the gate's
 * loading bar calls `registerBootStep()` from loader.ts before `initGate()` runs.
 */
initPointer();
initLangSwitch();
initCursor();
initScene();
initRain();
initGlyphFields();
initReveals();
initHero();
initGalleries();
initRouter();
initBack();
initStage();
initPanel();
initHunt();
initAudio();
initGate();

if (DEBUG) {
  Object.assign(window, { __app: { state, router, audio, loader, panel: panelApi } });
}
