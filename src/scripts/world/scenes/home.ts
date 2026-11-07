import * as T from 'three';
import { Batch } from '../batch';
import { SCENE_X } from '../config';
import { floorGlow, windowGlow, windowLight } from '../lights';
import { mat } from '../materials';
import { mesh } from '../primitives';
import type { Diorama } from '../types';
import { base } from '../walls';

/** Home diorama (plan, Fase 5): the sofas, TV, pets and Franco arrive with that task. */
export function home(scene: T.Scene): Diorama {
  const root = new T.Group();
  root.position.x = SCENE_X.home;
  scene.add(root);
  const b = new Batch(root);
  base(root, b, { wallLeftOpen: { a: -1.6, b: 0.6, y0: 1.0, y1: 2.5 }, night: true });
  b.flush();

  // Window on the left wall: half the moon shows past the back edge of the frame (z=-1.6),
  // its halo only on the glass (the quad is the opening itself, with the moon at its right edge),
  // and a cool moonlight patch on the floor.
  const moon = mesh(new T.CircleGeometry(0.3, 28, Math.PI / 2, Math.PI), mat.moon, root, -4.77, 1.95, -1.6);
  moon.rotation.y = Math.PI / 2;
  moon.castShadow = false;
  windowGlow(root, -4.78, 1.75, -0.5, 2.2, 1.5, '170,196,240', 0.7, Math.PI / 2, [1, 0.37], 0.4);
  floorGlow(root, -3.6, -0.5, 2.4, 3.0, '150,182,238', 0.4);
  const moonIn = windowLight(root, 0xa9c0ee, [-7.4, 4.0, -0.9], [-2.4, 0, -0.3], 0.5);
  for (const [y, z] of [
    [1.4, -1.2],
    [2.3, -0.9],
    [1.75, -0.3],
    [2.35, 0.45],
  ]) {
    const s = mesh(new T.PlaneGeometry(0.025, 0.025), mat.moon, root, -4.77, y, z);
    s.rotation.y = Math.PI / 2;
    s.castShadow = false;
  }

  const update = () => {};
  return {
    root,
    update,
    lights: [[moonIn, 60]],
    light: { hemi: 1.35, sun: 1.3, sunColor: 0x9fb4d0 },
  };
}
