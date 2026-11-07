import * as T from 'three';
import { REDUCE } from '../../env';
import { state } from '../../state';
import { Batch } from '../batch';
import { SCENE_X } from '../config';
import { makeFranco } from '../figure';
import { floorGlow, windowGlow, windowLight } from '../lights';
import { mat } from '../materials';
import { makeCat, makeDog, type Pet } from '../pets';
import { mesh, PUFF, unitCyl } from '../primitives';
import { bookcase, classChair, mug, plant, roundTable, rug, sofa, tvUnit } from '../props';
import type { Diorama } from '../types';
import { base } from '../walls';

/**
 * Home diorama: living room facing the back wall (the TV goes there), Franco's sofa in front
 * of it with his back to the camera, L sofa on the left, armchair on the right, dining corner,
 * the black poodle, the white cat on the sofa back and the black cat eating by the left wall.
 * The TV, lamp, moon light and volume bar arrive with the scene task (plan, Fase 5).
 */
export function home(scene: T.Scene): Diorama {
  const root = new T.Group();
  root.position.x = SCENE_X.home;
  scene.add(root);
  const b = new Batch(root);
  base(root, b, { wallLeftOpen: { a: -1.6, b: 0.6, y0: 1.0, y1: 2.5 }, night: true });
  rug(b, 0.2, -2.9, 4.6, 3.0, mat.rug2);
  // TV unit against the back wall; a white console lying at its right end, round black grille on top.
  tvUnit(b, 0, -4.5, 3.4);
  b.box(1.3, 0.54, -4.5, 0.3, 0.065, 0.16, mat.catW);
  b.cyl(1.38, 0.605, -4.5, 0.045, 0.006, mat.black, 16);
  // Franco's two-seat sofa faces -z; his cushion sits at x≈0, in line with the TV.
  const SZ = -1.3;
  sofa(b, 0.5, SZ, Math.PI / 2, 2.3, 2);
  // L sofa against the left side (faces +x) and a one-seat armchair on the right, turned to the TV.
  sofa(b, -2.4, -2.2, 0, 2.1, 2);
  sofa(b, 2.7, -2.7, (3 * Math.PI) / 4, 1.2, 1);
  // Side table with mate and thermos by the sofa's right arm.
  const tx = 2.05;
  const tz = -1.25;
  b.cyl(tx, 0, tz, 0.2, 0.03, mat.dark, 10);
  b.cyl(tx, 0.03, tz, 0.025, 0.5, mat.metal, 6);
  b.cyl(tx, 0.53, tz, 0.33, 0.04, mat.furnL, 12);
  b.cyl(tx - 0.08, 0.57, tz + 0.06, 0.06, 0.11, mat.pot, 9, 0.85);
  b.add(unitCyl(4), mat.pale, tx - 0.06, 0.71, tz + 0.06, 0.008, 0.16, 0.008, 0, 0, -0.25);
  b.cyl(tx + 0.13, 0.57, tz - 0.06, 0.06, 0.3, mat.metal, 10);
  b.cyl(tx + 0.13, 0.87, tz - 0.06, 0.045, 0.05, mat.dark, 10);
  // Floor lamp in the corner, between the L sofa and the TV (base and pole; the shade is a lit mesh).
  const lx = -2.5;
  const lz = -3.7;
  b.cyl(lx, 0, lz, 0.18, 0.03, mat.dark, 10);
  b.cyl(lx, 0.03, lz, 0.02, 1.45, mat.metal, 6);
  // Low shelf + plant on the right.
  b.box(3.9, 0, -1.5, 0.7, 0.9, 1.6, mat.furn);
  b.box(3.9, 0.9, -1.5, 0.74, 0.04, 1.64, mat.furnL);
  b.box(3.85, 0.94, -1.95, 0.24, 0.32, 0.18, mat.pale);
  b.box(3.85, 0.94, -1.7, 0.2, 0.24, 0.12, mat.trim);
  b.cyl(3.9, 0.94, -1.05, 0.14, 0.24, mat.pot, 7, 0.8);
  b.add(new T.IcosahedronGeometry(1, 0), mat.plant, 3.9, 1.38, -1.05, 0.24, 0.3, 0.24, 0.3, 0.2, 0);
  // Dining corner at the front right, bookcase on the left wall and a big plant.
  roundTable(b, 2.5, 2.4, 0.55);
  classChair(b, 3.25, 2.4, 0);
  classChair(b, 1.75, 2.4, Math.PI);
  mug(b, 2.35, 0.77, 2.2, mat.pale);
  b.cyl(2.65, 0.77, 2.55, 0.12, 0.05, mat.paper, 10, 0.8);
  b.box(2.4, 0.77, 2.65, 0.26, 0.015, 0.2, mat.plum, 0.3);
  bookcase(b, -4.78, 2.3, 0, 2.0, 3);
  plant(b, -3.9, 4.0, 1.1);
  // Slippers in front of the sofa and a book near the armchair.
  b.box(0.95, 0, -1.95, 0.12, 0.04, 0.26, mat.pot, 0.15);
  b.box(1.13, 0, -1.93, 0.12, 0.04, 0.26, mat.pot, -0.1);
  b.box(1.7, 0.02, -2.0, 0.22, 0.04, 0.3, mat.plum, 0.4);
  // Cat bowl by the left wall, under the window, on its little mat.
  b.box(-4.5, 0, 0.3, 0.4, 0.012, 0.5, mat.rug2);
  b.cyl(-4.6, 0.012, 0.3, 0.09, 0.045, mat.pale, 10, 0.8);
  b.add(PUFF, mat.pot, -4.6, 0.05, 0.3, 0.065, 0.02, 0.065, 0, 0, 0);
  b.flush();

  const franco = makeFranco('phone');
  franco.root.position.set(0, 0.52, SZ - 0.06);
  franco.root.rotation.y = Math.PI; // faces -z, towards the TV
  root.add(franco.root);
  franco.ring.position.y = -0.49;
  franco.ring.position.z = 0.3;
  const phoneLight = new T.PointLight(0x1fbf75, 0, 1.6, 1.2);
  phoneLight.position.set(0, 0.95, SZ - 0.5);
  root.add(phoneLight);
  // Pets: black poodle on the L sofa (left side) looking towards the TV, white cat with orange
  // patches high on the back of Franco's sofa, black cat eating from its bowl by the left wall.
  const pets: Pet[] = [];
  const dog = makeDog();
  dog.root.position.set(-2.34, 0.48, -1.71);
  dog.root.rotation.y = 2.3;
  root.add(dog.root);
  pets.push(dog);
  const catW = makeCat(mat.catW, 'sit', mat.catO);
  catW.root.position.set(-0.25, 1.0, SZ + 0.4);
  catW.root.rotation.y = 0.6;
  root.add(catW.root);
  pets.push(catW);
  const catB = makeCat(mat.catB, 'eat');
  catB.root.position.set(-4.27, 0, 0.3);
  catB.root.rotation.y = -Math.PI / 2;
  root.add(catB.root);
  pets.push(catB);

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
    for (const p of pets) p.update(t);
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
