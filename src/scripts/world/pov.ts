import { gsap } from 'gsap';
import * as T from 'three';
import { byId } from '../dom';
import { isNarrow, REDUCE } from '../env';
import { state } from '../state';
import type { CameraRig } from './camera';
import type { SceneLights } from './lights';
import type { Dioramas, PovFraming } from './types';

/**
 * POV view, shown while the panel is open: the camera sits behind and above Franco's head,
 * offset to one shoulder, looking at what he looks at (`d.pov.target`). On desktop the panel
 * covers the ~420 px on the right, so the target is centred in the free area; on mobile the
 * sheet covers the bottom and the framing moves up. The surprise shot (plan, Fase 8) reuses
 * `blendPov` and the on-top mesh helpers so a shot glides from the current framing.
 */
const POV_WIDE: PovFraming = { back: 0.9, up: 0.35, side: -0.3, fov: 46 };
const POV_NARROW: PovFraming = { back: 1.3, up: 0.45, side: 0, fov: 60 };
const UP = new T.Vector3(0, 1, 0);
/** Width of the desktop panel, which the POV framing leaves free on the right. */
const PANEL_W = 420;

export interface PovCore {
  cam: CameraRig;
  lights: SceneLights;
  dioramas: Dioramas;
  setLabel(on: boolean): void;
  setHover(on: boolean): void;
}

export interface PovControl {
  /** Blends into the POV framing of the active scene; returns the transition length in seconds. */
  focusOn(): number;
  /** Back to the iso rig; lights and vignette recover. */
  unfocus(): void;
  /** Moves the POV camera to a new framing: fades in from the iso rig, or glides from the current one. */
  blendPov(pos: T.Vector3, target: T.Vector3, fov: number, dur: number, ease: string): void;
  /** Draws `mesh` over whatever crosses the view (surprise shot); null restores the previous one. */
  setOnTop(mesh: T.Mesh | null): void;
  /** Tween target for a slow push-in along the shot axis (surprise shot). */
  readonly shotPush: { k: number };
}

export function createPov(core: PovCore): PovControl {
  const { cam, dioramas, setLabel, setHover } = core;
  const { pov, view } = cam;
  const { hemi, sun, focus } = core.lights;
  const shotPush = { k: 0 };
  let onTopMesh: T.Mesh | null = null;

  function setOnTop(mesh: T.Mesh | null): void {
    if (onTopMesh) {
      (onTopMesh.material as T.Material).depthTest = true;
      onTopMesh.renderOrder = 0;
    }
    onTopMesh = mesh;
    if (mesh) {
      (mesh.material as T.Material).depthTest = false;
      mesh.renderOrder = 10;
    }
  }

  function blendPov(pos: T.Vector3, target: T.Vector3, fov: number, dur: number, ease: string): void {
    gsap.killTweensOf([pov, pov.pos, pov.target, shotPush]);
    if (pov.mix < 0.01 || dur === 0) {
      pov.pos.copy(pos);
      pov.target.copy(target);
      pov.fov = fov;
      gsap.to(pov, { mix: 1, duration: dur, ease });
    } else {
      gsap.to(pov.pos, { x: pos.x, y: pos.y, z: pos.z, duration: dur, ease });
      gsap.to(pov.target, { x: target.x, y: target.y, z: target.z, duration: dur, ease });
      gsap.to(pov, { fov, mix: 1, duration: dur, ease });
    }
  }

  function focusOn(): number {
    cam.cam.focused = true;
    setOnTop(null);
    const d = dioramas[state.scene];
    setLabel(false);
    setHover(false);
    if (!d.pov) return 0;
    const narrow = isNarrow();
    // Each diorama may adjust the framing (`pov.wide` / `pov.narrow`): distance back, height, shoulder, fov.
    const L: PovFraming = { ...(narrow ? POV_NARROW : POV_WIDE), ...(narrow ? d.pov.narrow : d.pov.wide) };
    const head = d.franco.head.getWorldPosition(new T.Vector3()).add(UP.clone().multiplyScalar(0.12));
    const target = d.pov.target.clone();
    // Franco's axis: from the target towards him (on the floor plane), unless the diorama fixes it.
    const back = d.pov.back ? d.pov.back.clone() : head.clone().sub(target).setY(0).normalize();
    const right = back.clone().negate().cross(UP).normalize();
    const pos = head.clone().addScaledVector(back, L.back).addScaledVector(UP, L.up).addScaledVector(right, L.side);
    // Shift the aim so the target lands in the centre of the free area.
    const fwd = target.clone().sub(pos).normalize();
    const camRight = fwd.clone().cross(UP).normalize();
    const camUp = camRight.clone().cross(fwd).normalize();
    const dist = pos.distanceTo(target);
    // World units per pixel at that distance.
    const upp = (2 * dist * Math.tan(((L.fov / 2) * Math.PI) / 180)) / view.h;
    const shiftX = narrow ? 0 : Math.min(PANEL_W, view.w) / 2;
    // Mobile: centre on the strip between the header (~60 px) and the sheet (top 20 %).
    const shiftY = narrow ? view.h / 2 - (60 + view.h * 0.2) / 2 : 0;
    const aim = target.clone().addScaledVector(camRight, shiftX * upp).addScaledVector(camUp, -shiftY * upp);
    focus.position.set(head.x + 1.0, head.y + 3.5, head.z + 1.0);
    focus.target.position.copy(head);
    d.onFocus?.(true);
    const dur = REDUCE ? 0 : 1.1;
    gsap.killTweensOf([hemi, sun, focus]);
    blendPov(pos, aim, L.fov, dur, 'power3.inOut');
    // Lights only slightly down: what he looks at (TV, screens, monitors) must stay visible.
    gsap.to(hemi, { intensity: d.light.hemi * 0.65, duration: dur, ease: 'power2.inOut' });
    gsap.to(sun, { intensity: d.light.sun * 0.65, duration: dur, ease: 'power2.inOut' });
    gsap.to(focus, { intensity: 1.6, duration: dur, ease: 'power2.inOut' });
    const fv = byId('focusVig');
    fv.style.setProperty('--fx', `${((view.w - shiftX * 2) / 2 / view.w) * 100}%`);
    fv.style.setProperty('--fy', `${((view.h - shiftY * 2) / 2 / view.h) * 100}%`);
    gsap.to(fv, { opacity: 0.6, duration: dur, ease: 'power2.inOut' });
    return dur;
  }

  function unfocus(): void {
    gsap.killTweensOf([pov, pov.pos, pov.target, shotPush, hemi, sun, focus]);
    setOnTop(null);
    const dur = REDUCE ? 0 : 1.4;
    cam.cam.focused = false;
    const d = dioramas[state.scene];
    d.onFocus?.(false);
    gsap.to(pov, { mix: 0, duration: dur, ease: 'expo.out', onComplete: () => setLabel(true) });
    gsap.to(hemi, { intensity: d.light.hemi, duration: dur * 0.8, ease: 'expo.out' });
    gsap.to(sun, { intensity: d.light.sun, duration: dur * 0.8, ease: 'expo.out' });
    gsap.to(focus, { intensity: 0, duration: dur * 0.6, ease: 'expo.out' });
    gsap.to(byId('focusVig'), { opacity: 0, duration: dur * 0.6, ease: 'expo.out' });
  }

  return { focusOn, unfocus, blendPov, setOnTop, shotPush };
}
