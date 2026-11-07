import * as T from 'three';
import type { Scene } from '../../i18n/ui';
import { COARSE } from '../env';
import { pointer } from '../pointer';
import { state } from '../state';
import { SCENE_X } from './config';

/** Floating dust: additive points inside the active diorama, tinted green near its glow. */
export interface Dust {
  points: T.Points;
  tint(key: Scene): void;
  update(t: number, dt: number): void;
}

/** Scene-local point where the dust picks up the green glow (monitor, board, phone). */
const GLOW_AT: Record<Scene, [number, number, number]> = {
  office: [-2.9, 1.2, -0.6],
  uni: [-4.5, 1.9, -2.3],
  home: [0, 0.95, -1.8],
};

export function createDust(scene: T.Scene): Dust {
  const N = COARSE ? 120 : 350;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const seed = new Float32Array(N * 2);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 10;
    pos[i * 3 + 1] = Math.random() * 3.6;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    seed[i * 2] = Math.random() * 6.28;
    seed[i * 2 + 1] = 0.4 + Math.random() * 0.8;
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(pos, 3));
  geo.setAttribute('color', new T.BufferAttribute(col, 3));
  const points = new T.Points(
    geo,
    new T.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: T.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
  points.frustumCulled = false;
  scene.add(points);
  const _pale = new T.Color(0x8a94a3);
  const _green = new T.Color(0x5fe0a3);
  const _c = new T.Color();

  function tint(key: Scene): void {
    const [gx, gy, gz] = GLOW_AT[key];
    for (let i = 0; i < N; i++) {
      const d = Math.hypot(pos[i * 3] - gx, pos[i * 3 + 1] - gy, pos[i * 3 + 2] - gz);
      _c.copy(_pale).lerp(_green, Math.max(0, 1 - d / 3.2));
      col[i * 3] = _c.r;
      col[i * 3 + 1] = _c.g;
      col[i * 3 + 2] = _c.b;
    }
    geo.attributes.color.needsUpdate = true;
  }

  function update(t: number, dt: number): void {
    for (let i = 0; i < N; i++) {
      const ph = seed[i * 2];
      const sp = seed[i * 2 + 1];
      let y = pos[i * 3 + 1] + dt * 0.06 * sp;
      if (y > 3.6) y -= 3.6;
      pos[i * 3 + 1] = y;
      pos[i * 3] += Math.sin(t * 0.35 + ph) * dt * 0.08;
      pos[i * 3 + 2] += Math.cos(t * 0.3 + ph * 1.3) * dt * 0.08;
    }
    geo.attributes.position.needsUpdate = true;
    // Gentle sway with the pointer.
    points.position.set(SCENE_X[state.scene] + pointer.nx * 0.35, -pointer.ny * 0.25, 0);
  }

  return { points, tint, update };
}
