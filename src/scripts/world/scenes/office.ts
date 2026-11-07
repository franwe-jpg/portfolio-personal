import * as T from 'three';
import { Batch } from '../batch';
import { MOBILE, SCENE_X } from '../config';
import { makeFranco, makePerson, type Person } from '../figure';
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

  // Seats at the four stations of the two islands (the furniture itself arrives with "Props y batching").
  const sFranco = { x: -1.96, z: -0.6 };
  const sA = { x: -4.04, z: -0.6 };
  const sB = { x: 1.94, z: -0.6 };
  const sC = { x: -0.14, z: -0.6 };

  const franco = makeFranco('typing');
  franco.root.position.set(sFranco.x, 0.53, sFranco.z);
  franco.root.rotation.y = -Math.PI / 2;
  root.add(franco.root);
  franco.ring.position.y = -0.5;
  // Colleagues: the one across from Franco always; the other island only on desktop.
  const people: Person[] = [];
  const seat = (p: Person, st: { x: number; z: number }, ry: number) => {
    p.root.position.set(st.x, 0.53, st.z);
    p.root.rotation.y = ry;
    root.add(p.root);
    people.push(p);
  };
  // Across from Franco: red-haired girl with long hair, lilac shirt and black trousers.
  seat(makePerson({ shirt: 0xb08ad0, pants: 0x15181d, skin: 0xe6c7ad, hair: 0xd8642a, long: true }), sA, Math.PI / 2);
  if (!MOBILE) {
    // Other island, facing each other: guy with glasses and a brown polo; girl with black curls and
    // glasses, black jacket over a light shirt and light-blue jeans.
    seat(makePerson({ shirt: 0x6b4a32, collar: 0x80603f, pants: 0x2a2f38, skin: 0xb98a66, hair: 0x1b1e23, glasses: true }), sB, -Math.PI / 2);
    seat(makePerson({ shirt: 0x1a1d22, lapel: 0xd6dbe2, pants: 0x6f9cc4, skin: 0xc8a68e, hair: 0x15171b, glasses: true, curly: true }), sC, Math.PI / 2);
  }

  const glow = new T.PointLight(0xbff5da, 0, 3, 1.4);
  glow.position.set(-2.9, 1.25, -0.6);
  root.add(glow);

  // Sun: warm glow on the window pane and a patch of light on the floor in front of it.
  windowGlow(root, 1.2, 1.85, -4.86, 2.6, 2.2, '255,214,150', 0.95);
  floorGlow(root, 1.1, -3.5, 2.8, 2.4, '255,205,130', 0.5);
  const sunIn = windowLight(root, 0xffd9a6, [1.2, 4.4, -7.2], [0.5, 0, -2.0]);

  function update(t: number): void {
    franco.update(t);
    for (const p of people) p.update(t);
  }
  return {
    root,
    franco,
    update,
    lights: [
      [glow, 1.2],
      [sunIn, 120],
    ],
    light: { hemi: 1.5, sun: 2.4, sunColor: 0xfff6ea },
  };
}
