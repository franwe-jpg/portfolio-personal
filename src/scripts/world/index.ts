import { gsap } from 'gsap';
import * as T from 'three';
import type { Scene } from '../../i18n/ui';
import { byId, nextFrame } from '../dom';
import { DEBUG, REDUCE } from '../env';
import { t } from '../i18n';
import { pointer } from '../pointer';
import { scramble } from '../scramble';
import { on, SCENES, state, type Page } from '../state';
import { createCameraRig, MAX_AZ, type ViewMode } from './camera';
import { SCENE_X } from './config';
import { createCss3d } from './css3d';
import { createDust } from './dust';
import { isStaticOn } from './figure';
import type { WorldApi } from './handle';
import { bindInput } from './input';
import { createLights } from './lights';
import { francoMats } from './materials';
import { createStage } from './renderer';
import { home } from './scenes/home';
import { office } from './scenes/office';
import { university } from './scenes/university';
import { drawSnow } from './textures';
import type { Diorama } from './types';
import { addGroundHalo } from './walls';

/**
 * The world: three isometric dioramas (Three.js, perspective on an iso rig). This module and
 * everything it imports load lazily on the first visit to `mundo` (see src/scripts/stage.ts),
 * which is the only place `three` is downloaded.
 */
const VIEW_OF: Record<Page, ViewMode> = { inicio: 'off', mundo: 'mundo', proyectos: 'off', sobre: 'off' };

export async function initWorld(): Promise<WorldApi> {
  const st = createStage();
  const { renderer, scene, camera, canvas, stage } = st;
  const css3d = createCss3d();
  const { hemi, sun } = createLights(scene);
  const cam = createCameraRig(st, css3d);
  const { rig, orbit, para, view, pov } = cam;

  // Build one diorama per frame so the busy cursor keeps animating.
  await nextFrame();
  const dioramas: Record<Scene, Diorama> = {} as Record<Scene, Diorama>;
  dioramas.office = office(scene);
  await nextFrame();
  dioramas.uni = university(scene);
  await nextFrame();
  dioramas.home = home(scene);
  await nextFrame();
  for (const k of SCENES) addGroundHalo(dioramas[k].root);
  const dust = createDust(scene);

  // Tells each diorama whether it is active and in view (the living-room TV plays only then).
  function syncActive(): void {
    const on = state.entered && cam.cam.viewMode !== 'off' && !document.hidden;
    for (const k of SCENES) dioramas[k].onActive?.(on && k === state.scene);
  }

  function activate(key: Scene): void {
    for (const k of SCENES) dioramas[k].root.visible = k === key;
    const d = dioramas[key];
    hemi.intensity = d.light.hemi;
    sun.intensity = d.light.sun;
    sun.color.setHex(d.light.sunColor);
    sun.position.set(SCENE_X[key] + 6, 12, 5);
    sun.target.position.set(SCENE_X[key], 0, 0);
    for (const k of SCENES) for (const [l, v] of dioramas[k].lights) l.intensity = k === key ? v : 0;
    dust.points.position.x = SCENE_X[key];
    dust.tint(key);
    syncActive();
  }

  cam.resize();
  rig.x = SCENE_X[state.scene];
  cam.applyCamera();
  // Compile every material with every diorama visible, then show only the active one.
  for (const k of SCENES) dioramas[k].root.visible = true;
  await nextFrame();
  await renderer.compileAsync(scene, camera);
  await nextFrame();
  activate(state.scene);
  cam.render();

  // ---------- render loop (paused when the view is off / hidden tab) ----------
  let running = false;
  let last = performance.now();
  const label = byId('francoLabel');
  const _v = new T.Vector3();
  let labelOn = false;
  let hoverAmt = 0;
  let snowLast = -1;
  const input = bindInput({ canvas, camera, rig: cam, dioramas, interactive: () => cam.cam.viewMode === 'mundo' });

  function frame(now: number): void {
    if (!running) return;
    requestAnimationFrame(frame);
    // Clamped at 0: the first rAF timestamp can precede the performance.now() taken in start().
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
    last = now;
    cam.cam.elapsed += dt;
    const elapsed = cam.cam.elapsed;
    // Orbit inertia + damping.
    if (!input.dragging) {
      orbit.goalAz += orbit.vAz;
      orbit.vAz *= 0.9;
    }
    orbit.goalAz = Math.max(-MAX_AZ, Math.min(MAX_AZ, orbit.goalAz));
    const damp = REDUCE ? 1 : 0.1;
    orbit.az += (orbit.goalAz - orbit.az) * damp;
    orbit.el += (orbit.goalEl - orbit.el) * damp;
    // Pointer parallax on the rig: frozen while dragging so the drag keeps priority,
    // stronger on inicio where there is no drag at all.
    if (!input.dragging && !REDUCE) {
      const k = cam.cam.viewMode === 'inicio' ? 1.8 : 1;
      const gAz = cam.cam.focused ? 0 : pointer.nx * 0.1 * k;
      const gEl = cam.cam.focused ? 0 : -pointer.ny * 0.06 * k;
      para.az += (gAz - para.az) * 0.06;
      para.el += (gEl - para.el) * 0.06;
    }
    cam.applyCamera();
    const d = dioramas[state.scene];
    d.update(elapsed, dt);
    d.clock?.update(elapsed);
    if (!REDUCE) dust.update(elapsed, dt);
    // Hover highlight: emissive rim tint + floor ring.
    hoverAmt += ((input.hovered ? 1 : 0) - hoverAmt) * (REDUCE ? 1 : 0.15);
    for (const m of francoMats) {
      m.emissive.setHex(0x9aa1ab);
      m.emissiveIntensity = hoverAmt * 0.16;
    }
    d.franco.ring.material.opacity = hoverAmt * 0.9;
    // "No signal" static over Franco: redrawn ≈12 times per second while any hover lasts.
    if ((isStaticOn() || input.anyHot) && !REDUCE && elapsed - snowLast >= 1 / 12) {
      snowLast = elapsed;
      drawSnow();
    }
    cam.render();
    // Project the floating label above Franco.
    if (labelOn) {
      d.franco.anchor.getWorldPosition(_v).project(camera);
      const x = (_v.x * 0.5 + 0.5) * view.w;
      const y = (-_v.y * 0.5 + 0.5) * view.h;
      label.style.transform = `translate3d(${x.toFixed(1)}px, ${(y - 18).toFixed(1)}px, 0) translate(-50%, -100%)`;
    }
  }
  function start(): void {
    if (running || document.hidden || !state.entered || cam.cam.viewMode === 'off') return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }
  function stop(): void {
    running = false;
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
    syncActive();
  });
  addEventListener('resize', () => {
    cam.resize();
    cam.applyCamera();
    if (!running) cam.render();
  });
  // The label only exists on the interactive view.
  const setLabel = (on: boolean) => {
    labelOn = on && cam.cam.viewMode === 'mundo';
    label.classList.toggle('is-on', labelOn);
  };

  // ---------- camera moves ----------
  const camSet = (vars: Partial<typeof rig>) => {
    gsap.killTweensOf(rig);
    gsap.set(rig, vars);
    cam.applyCamera();
  };
  const tagIn = (dur: number) => scramble(byId('sceneTag'), t.mundo.sceneTag(t.mundo.scenes[state.scene]), dur);

  function intro(instant: boolean): void {
    setLabel(false);
    start();
    const z = cam.homeZoom();
    if (instant || REDUCE) {
      camSet({ zoom: z, az: 0, el: 0 });
      setLabel(true);
      tagIn(0.3);
      return;
    }
    // Dolly in from far away; the slight downward tilt settles last.
    camSet({ zoom: 0.35, az: -0.35, el: 0.26 });
    gsap.to(rig, { zoom: z, az: 0, el: 0, duration: 2.0, ease: 'expo.out', onComplete: () => setLabel(true) });
    gsap.delayedCall(0.35, () => tagIn(0.55));
  }

  function show(key: Scene): void {
    // Called while the cell mask fully covers the canvas.
    activate(key);
    orbit.az = orbit.goalAz = orbit.vAz = 0;
    orbit.el = orbit.goalEl = 0;
    view.userZoom = 1;
    const z = cam.homeZoom();
    camSet({ x: SCENE_X[key], y: view.camY, z: 0, az: REDUCE ? 0 : -0.12, zoom: REDUCE ? z : z * 0.88 });
    if (!REDUCE) gsap.to(rig, { az: 0, zoom: z, duration: 1.2, ease: 'expo.out' });
    if (!running) cam.render();
  }

  // View per page: inicio (wide, auto-orbit, no interaction), mundo (interactive), off (paused, faded).
  function setView(mode: ViewMode, { instant = false }: { instant?: boolean } = {}): void {
    if (mode === cam.cam.viewMode) return;
    cam.cam.viewMode = mode;
    syncActive();
    stage.classList.toggle('is-off', mode === 'off');
    stage.classList.toggle('is-inicio', mode === 'inicio');
    setLabel(false);
    input.setHover(false);
    input.setClockHover(false);
    if (mode === 'off') {
      stop();
      return;
    }
    if (!cam.cam.focused) {
      const z = cam.homeZoom();
      const el = mode === 'inicio' ? 0.06 : 0;
      if (instant || REDUCE) {
        camSet({ zoom: z, el, az: 0, x: SCENE_X[state.scene], y: view.camY, z: 0 });
        setLabel(true);
      } else {
        gsap.killTweensOf(rig);
        gsap.to(rig, {
          zoom: z,
          el,
          az: 0,
          duration: 1.4,
          ease: 'expo.out',
          onComplete: () => {
            if (!cam.cam.focused) setLabel(true);
          },
        });
      }
    }
    cam.render();
    start();
  }

  on('app:pageswap', (event) => setView(VIEW_OF[event.detail]));

  if (DEBUG) {
    Object.assign(window, {
      __world: { T, gsap, camera, rig, view, para, pov, dioramas, renderer, pointer, dbg: { locked: input.locked, hitFranco: input.hitFranco, hitClock: input.hitClock, setHover: input.setHover, setClockHover: input.setClockHover, clockHot: () => input.anyHot, busy: () => state.busy } },
    });
  }

  return { intro, show, setView, setLabel, start, stop };
}
