import * as T from 'three';
import { Batch } from '../batch';
import { SCENE_X } from '../config';
import { REDUCE } from '../../env';
import { state } from '../../state';
import { makeFranco } from '../figure';
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

  // Franco's two-seat sofa faces -z; his cushion sits at x≈0, in line with the TV.
  const SZ = -1.3;
  const franco = makeFranco('phone');
  franco.root.position.set(0, 0.52, SZ - 0.06);
  franco.root.rotation.y = Math.PI; // faces -z, towards the TV
  root.add(franco.root);
  franco.ring.position.y = -0.49;
  franco.ring.position.z = 0.3;
  const phoneLight = new T.PointLight(0x1fbf75, 0, 1.6, 1.2);
  phoneLight.position.set(0, 0.95, SZ - 0.5);
  root.add(phoneLight);

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

  const update = (t: number) => {
    franco.update(t);
    if (REDUCE) return;
    const on = state.scene === 'home';
    phoneLight.intensity = (on ? 1.4 : 0) * (0.85 + Math.sin(t * 2.2) * 0.15);
  };
  return {
    root,
    franco,
    update,
    lights: [
      [phoneLight, 1.4],
      [moonIn, 60],
    ],
    light: { hemi: 1.35, sun: 1.3, sunColor: 0x9fb4d0 },
  };
}
