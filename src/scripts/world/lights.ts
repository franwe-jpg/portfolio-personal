import * as T from 'three';
import { MOBILE } from './config';
import { mesh } from './primitives';
import { canvasTex } from './textures';

/** Global lights (constant count so shaders never recompile) and the per-window helpers. */

export interface SceneLights {
  hemi: T.HemisphereLight;
  sun: T.DirectionalLight;
  /** Spot over Franco's head during the POV view (Fase 6); intensity 0 otherwise. */
  focus: T.SpotLight;
}

export function createLights(scene: T.Scene): SceneLights {
  const hemi = new T.HemisphereLight(0xdfe6ef, 0x14171c, 1.5);
  const sun = new T.DirectionalLight(0xfff6ea, 2.4);
  sun.castShadow = !MOBILE;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 40 });
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.02;
  const focus = new T.SpotLight(0xf2f5f8, 0, 14, 0.42, 0.65, 0);
  scene.add(hemi, sun, sun.target, focus, focus.target);
  return { hemi, sun, focus };
}

export type Vec3Tuple = [number, number, number];

/**
 * Soft glow drawn on a window pane (additive), for sunlight or moonlight coming in. The quad is
 * sized to the pane so the glow stays on the glass and never spills onto the wall; `focus` is
 * where the light sits on the pane (fractions from the left/top, seen from inside) and `reach`
 * the halo radius as a fraction of the pane width.
 */
export function windowGlow(
  root: T.Object3D,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  rgb: string,
  alpha: number,
  ry = 0,
  focus: [number, number] = [0.5, 0.5],
  reach = 0.5,
): T.Mesh {
  const tex = canvasTex(128, 128, (c, cw, ch) => {
    const fx = focus[0] * cw;
    const fy = focus[1] * ch;
    const g = c.createRadialGradient(fx, fy, 0, fx, fy, reach * cw);
    g.addColorStop(0, `rgba(${rgb},${alpha})`);
    g.addColorStop(0.45, `rgba(${rgb},${alpha * 0.45})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = g;
    c.fillRect(0, 0, cw, ch);
  }).tex;
  const m = mesh(
    new T.PlaneGeometry(w, h),
    new T.MeshBasicMaterial({ map: tex, transparent: true, blending: T.AdditiveBlending, depthWrite: false }),
    root,
    x,
    y,
    z,
  );
  m.rotation.y = ry;
  m.castShadow = m.receiveShadow = false;
  return m;
}

/** The patch of light on the floor in front of a window (additive quad lying flat). */
export function floorGlow(
  root: T.Object3D,
  x: number,
  z: number,
  w: number,
  d: number,
  rgb: string,
  alpha: number,
): T.Mesh {
  const m = windowGlow(root, x, 0.03, z, w, d, rgb, alpha);
  m.rotation.set(-Math.PI / 2, 0, 0);
  return m;
}

/** Light through a window: a shadowless spot aimed at the floor, intensity driven per scene. */
export function windowLight(root: T.Object3D, color: number, from: Vec3Tuple, to: Vec3Tuple, angle = 0.55): T.SpotLight {
  const l = new T.SpotLight(color, 0, 18, angle, 0.7, 1);
  l.position.set(...from);
  l.target.position.set(...to);
  root.add(l, l.target);
  return l;
}
