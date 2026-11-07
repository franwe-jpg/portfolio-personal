import * as T from 'three';
import { Batch } from '../batch';
import { SCENE_X } from '../config';
import { floorGlow, windowGlow, windowLight } from '../lights';
import type { Diorama } from '../types';
import { base } from '../walls';

/** Office diorama (plan, Fase 5): the islands, people and screens arrive with that task. */
export function office(scene: T.Scene): Diorama {
  const root = new T.Group();
  root.position.x = SCENE_X.office;
  scene.add(root);
  const b = new Batch(root);
  base(root, b, { window: { a: 0.3, b: 2.1, y0: 1.1, y1: 2.6 } });
  b.flush();

  const glow = new T.PointLight(0xbff5da, 0, 3, 1.4);
  glow.position.set(-2.9, 1.25, -0.6);
  root.add(glow);

  // Sun: warm glow on the window pane and a patch of light on the floor in front of it.
  windowGlow(root, 1.2, 1.85, -4.86, 2.6, 2.2, '255,214,150', 0.95);
  floorGlow(root, 1.1, -3.5, 2.8, 2.4, '255,205,130', 0.5);
  const sunIn = windowLight(root, 0xffd9a6, [1.2, 4.4, -7.2], [0.5, 0, -2.0]);

  const update = () => {};
  return {
    root,
    update,
    lights: [
      [glow, 1.2],
      [sunIn, 120],
    ],
    light: { hemi: 1.5, sun: 2.4, sunColor: 0xfff6ea },
  };
}
