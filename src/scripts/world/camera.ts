import * as T from 'three';
import { REDUCE } from '../env';
import type { Css3dLayer } from './css3d';
import { FOV } from './config';
import type { Stage } from './renderer';

/**
 * Camera rig: a perspective camera on the old isometric angles. `rig` is what the camera moves
 * tween (position, extra angles, zoom); `orbit` is the drag, `para` the pointer parallax; the
 * POV camera (behind Franco, Fase 6) blends in through `pov.mix`.
 */
export const BASE_AZ = Math.PI / 4;
/** True isometric elevation. */
export const BASE_EL = Math.atan(1 / Math.SQRT2);
export const MAX_AZ = Math.PI / 6;
/** Target above the floor so the slab sits a bit low, under the HUD. */
export const CAM_Y = 1.5;
const TAN_HALF = Math.tan(((FOV / 2) * Math.PI) / 180);

export type ViewMode = 'off' | 'inicio' | 'mundo';
const HOME_ZOOM: Record<ViewMode, number> = { inicio: 0.62, mundo: 1.3, off: 1 };

export interface Rig {
  x: number;
  y: number;
  z: number;
  az: number;
  el: number;
  zoom: number;
}

export interface Pov {
  /** 0 = iso rig, 1 = POV camera. */
  mix: number;
  fov: number;
  pos: T.Vector3;
  target: T.Vector3;
}

export interface CameraRig {
  rig: Rig;
  orbit: { az: number; el: number; goalAz: number; goalEl: number; vAz: number };
  para: { az: number; el: number };
  view: { userZoom: number; halfH: number; dist: number; w: number; h: number; camY: number };
  pov: Pov;
  /** Mutable view state shared with the loop and the input. */
  cam: { focused: boolean; viewMode: ViewMode; elapsed: number };
  homeZoom(): number;
  resize(): void;
  applyCamera(): void;
  render(): void;
}

export function createCameraRig(st: Stage, css3d: Css3dLayer): CameraRig {
  const { renderer, scene, camera, fog } = st;
  const rig: Rig = { x: 0, y: CAM_Y, z: 0, az: 0, el: 0, zoom: 1 };
  const orbit = { az: 0, el: 0, goalAz: 0, goalEl: 0, vAz: 0 };
  const para = { az: 0, el: 0 };
  const view = { userZoom: 1, halfH: 7, dist: 33, w: 1, h: 1, camY: CAM_Y };
  const cam = { focused: false, viewMode: 'off' as ViewMode, elapsed: 0 };
  const pov: Pov = { mix: 0, fov: FOV, pos: new T.Vector3(), target: new T.Vector3() };
  const _ct = new T.Vector3();
  const homeZoom = () => HOME_ZOOM[cam.viewMode] ?? 1;

  function resize(): void {
    const w = innerWidth;
    const h = innerHeight;
    view.w = w;
    view.h = h;
    renderer.setSize(w, h, false);
    const aspect = w / h;
    // Fit the slab (≈14.5 units wide in iso) on narrow screens too.
    // Leave room for the HUD: the diorama fills ~2/3 of the height on desktop.
    view.halfH = Math.max(7.1, 8.0 / aspect);
    // Same framing as the old orthographic frustum: at the target distance the
    // visible half-height is halfH, so dist = halfH / tan(fov / 2).
    view.dist = view.halfH / TAN_HALF;
    // Portrait: the HUD takes the top third, so aim higher to drop the diorama lower.
    view.camY = CAM_Y + (aspect < 0.8 ? (0.26 * view.halfH) / Math.cos(BASE_EL) : 0);
    if (!cam.focused) rig.y = view.camY;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
  }

  function render(): void {
    renderer.render(scene, camera);
    css3d.render(camera, view.w, view.h);
  }

  function applyCamera(): void {
    const auto = cam.viewMode === 'inicio' && !REDUCE ? Math.sin(cam.elapsed * 0.12) * 0.05 : 0;
    const bob = REDUCE ? 0 : Math.sin(cam.elapsed * 0.4) * 0.15 * (cam.focused ? 0.3 : 1);
    const az = BASE_AZ + rig.az + orbit.az + para.az + auto;
    const el = BASE_EL + rig.el + orbit.el + para.el;
    // Zoom maps to distance: zoom 1 reproduces the old framing.
    const dist = view.dist / (rig.zoom * view.userZoom);
    camera.position.set(
      rig.x + dist * Math.cos(el) * Math.sin(az),
      rig.y + bob + dist * Math.sin(el),
      rig.z + dist * Math.cos(el) * Math.cos(az),
    );
    _ct.set(rig.x, rig.y + bob, rig.z);
    if (pov.mix > 0) {
      camera.position.lerp(pov.pos, pov.mix);
      _ct.lerp(pov.target, pov.mix);
    }
    camera.lookAt(_ct);
    const fov = FOV + (pov.fov - FOV) * pov.mix;
    if (fov !== camera.fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    fog.near = dist;
    fog.far = dist + 34;
    camera.updateMatrixWorld();
  }

  return { rig, orbit, para, view, pov, cam, homeZoom, resize, applyCamera, render };
}
