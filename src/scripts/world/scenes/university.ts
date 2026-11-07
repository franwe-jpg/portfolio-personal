import * as T from 'three';
import { Batch } from '../batch';
import { SCENE_X } from '../config';
import { floorGlow, windowGlow, windowLight } from '../lights';
import type { Diorama } from '../types';
import { base } from '../walls';

/** University diorama (plan, Fase 5): the board, desks and people arrive with that task. */
export function university(scene: T.Scene): Diorama {
  const root = new T.Group();
  root.position.x = SCENE_X.uni;
  scene.add(root);
  const b = new Batch(root);
  base(root, b, { window: { a: -3.4, b: -1.4, y0: 1.1, y1: 2.6 } });
  b.flush();

  // Softer sun than the office: paler glow, weaker patch.
  windowGlow(root, -2.4, 1.85, -4.86, 2.6, 2.2, '236,240,255', 0.6);
  floorGlow(root, -2.5, -3.5, 2.8, 2.4, '230,236,255', 0.28);
  const sunIn = windowLight(root, 0xf1f4ff, [-2.4, 4.4, -7.2], [-2.6, 0, -2.0]);

  const update = () => {};
  return {
    root,
    update,
    lights: [[sunIn, 60]],
    light: { hemi: 1.6, sun: 2.2, sunColor: 0xf3f6fa },
  };
}
