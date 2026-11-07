import * as T from 'three';
import { Batch } from '../batch';
import { MOBILE, SCENE_X } from '../config';
import { makeFranco, makePerson, type Person } from '../figure';
import { floorGlow, windowGlow, windowLight } from '../lights';
import { mat } from '../materials';
import { at, ICO, UNIT_BOX } from '../primitives';
import { coffeeMachine, dualMonitors, mug, notebook, plant, roundTable, rug, swivelChair, waterDispenser, type Face } from '../props';
import type { Diorama } from '../types';
import { base } from '../walls';

/**
 * Office diorama: two desk islands with four stations, Franco across from the girl with the
 * orange hair, the guy in the brown polo across from the girl with the curls, server rack,
 * coffee corner, meeting TV and whiteboard. Screens and the rack LEDs animate (plan, Fase 5).
 */
export function office(scene: T.Scene): Diorama {
  const root = new T.Group();
  root.position.x = SCENE_X.office;
  scene.add(root);
  const b = new Batch(root);
  base(root, b, { window: { a: 0.3, b: 2.1, y0: 1.1, y1: 2.6 } });
  rug(b, -1.1, -0.6, 5.6, 4.6);
  // Two islands of desks facing each other (long side along z); Franco on the island by the left wall.
  function island(cx: number, cz: number): void {
    b.box(cx, 0.72, cz, 1.4, 0.05, 3.2, mat.furnL);
    for (const s of [-1, 1]) b.box(cx, 0, cz + s * 1.55, 1.3, 0.72, 0.05, mat.furn);
    b.box(cx, 0, cz, 0.05, 0.72, 3.1, mat.furn);
    b.box(cx, 0.77, cz, 0.03, 0.3, 3.1, mat.trim);
    b.box(cx + 0.35, 0.3, cz - 1.1, 0.5, 0.42, 0.6, mat.furn);
  }
  interface StationOpts {
    mug?: boolean;
    paper?: boolean;
    book?: boolean;
    faces?: [T.Material, T.Material];
  }
  // Station on the edge (ex, z) of an island: the person sits at +x local, facing -x.
  function station(ex: number, z: number, ry: number, opts: StationOpts = {}): { x: number; z: number; faces: Face[] } {
    const w = at(ex, z, ry);
    const [nx, nz] = w(-0.24, 0.02);
    notebook(b, nx, 0.77, nz, ry);
    const [mx, mz] = w(-0.58, 0);
    const faces = dualMonitors(b, mx, 0.77, mz, ry, opts.faces);
    if (opts.mug) {
      const [gx, gz] = w(-0.14, 0.4);
      mug(b, gx, 0.77, gz);
    }
    if (opts.paper) {
      const [px, pz] = w(-0.3, -0.45);
      b.box(px, 0.77, pz, 0.24, 0.012, 0.32, mat.paper, ry + 0.25);
    }
    if (opts.book) {
      const [px, pz] = w(-0.32, -0.42);
      b.box(px, 0.77, pz, 0.18, 0.05, 0.26, mat.plum, ry - 0.15);
    }
    const [cx, cz] = w(0.34, 0);
    swivelChair(b, cx, cz, ry);
    return { x: cx, z: cz, faces };
  }
  island(-3.0, -0.6);
  island(0.9, -0.6);
  const sFranco = station(-2.3, -0.6, 0, { mug: true, paper: true, faces: [mat.screen, mat.screen2] });
  const sA = station(-3.7, -0.6, Math.PI, { mug: true });
  const sB = station(1.6, -0.6, 0, { book: true, faces: [mat.screen2, mat.screen] });
  const sC = station(0.2, -0.6, Math.PI, { paper: true, mug: true });
  // Server rack (front faces +z).
  const rx = -4.2;
  const rz = -4.15;
  b.box(rx, 0, rz, 0.9, 2.2, 0.9, mat.black);
  for (let i = 0; i < 6; i++) b.box(rx, 0.32 + i * 0.3, rz + 0.452, 0.8, 0.012, 0.01, mat.trim);
  // Shelf with books on the back wall.
  const shx = -1.5;
  b.box(shx, 1.62, -4.62, 2.6, 0.05, 0.36, mat.furnL);
  b.box(shx, 2.32, -4.62, 2.6, 0.05, 0.36, mat.furnL);
  const books: [number, T.Material][] = [
    [0.32, mat.furn],
    [0.4, mat.pale],
    [0.36, mat.trim],
    [0.28, mat.furnL],
    [0.42, mat.furn],
    [0.34, mat.paper],
  ];
  books.forEach(([h, m], i) => b.box(shx - 1.1 + i * 0.13, 1.67, -4.62, 0.11, h, 0.28, m));
  b.box(shx + 0.9, 1.67, -4.62, 0.36, 0.06, 0.26, mat.pale, 0.1);
  b.box(shx + 0.7, 2.37, -4.62, 0.5, 0.3, 0.2, mat.furn);
  b.cyl(shx - 0.9, 2.37, -4.62, 0.09, 0.2, mat.pot, 7, 0.8);
  b.add(ICO, mat.plant2, shx - 0.9, 2.66, -4.62, 0.16, 0.14, 0.16, 0.3, 0.2, 0);
  // Coffee corner on the back wall: counter, machine, mugs and water dispenser.
  b.box(3.2, 0, -4.6, 1.6, 0.9, 0.6, mat.furn);
  b.box(3.2, 0.9, -4.6, 1.64, 0.04, 0.64, mat.furnL);
  b.box(3.2, 0.42, -4.29, 1.5, 0.016, 0.01, mat.trim);
  coffeeMachine(b, 2.7, 0.94, -4.62);
  mug(b, 3.25, 0.94, -4.48);
  mug(b, 3.42, 0.94, -4.72, mat.pale);
  mug(b, 3.62, 0.94, -4.52);
  b.box(3.75, 0.94, -4.7, 0.2, 0.12, 0.14, mat.paper, 0.2);
  waterDispenser(b, 4.45, -4.5);
  plant(b, 4.5, -3.55);
  // Whiteboard on wheels next to Franco's island, turned towards the room.
  b.add(UNIT_BOX, mat.paper, -3.0, 1.35, 2.6, 1.4, 0.9, 0.04, 0, 0.6, 0);
  b.add(UNIT_BOX, mat.metal, -3.0, 0.45, 2.6, 0.04, 0.9, 0.04, 0, 0.6, 0);
  b.add(UNIT_BOX, mat.dark, -3.0, 0.02, 2.6, 0.8, 0.04, 0.4, 0, 0.6, 0);
  b.add(UNIT_BOX, mat.signal, -3.1, 1.5, 2.66, 0.5, 0.02, 0.005, 0, 0.6, 0);
  b.add(UNIT_BOX, mat.trim, -3.0, 1.3, 2.66, 0.8, 0.02, 0.005, 0, 0.6, 0);
  b.add(UNIT_BOX, mat.trim, -2.95, 1.1, 2.66, 0.6, 0.02, 0.005, 0, 0.6, 0);
  // Meeting table with two stools, at the front.
  roundTable(b, 3.0, 2.2);
  b.box(2.85, 0.77, 2.1, 0.32, 0.015, 0.24, mat.paper, 0.5);
  mug(b, 3.25, 0.77, 2.4);
  for (const [sx, sz] of [
    [2.15, 2.75],
    [3.85, 1.65],
  ]) {
    b.cyl(sx, 0, sz, 0.03, 0.44, mat.metal, 6);
    b.cyl(sx, 0.44, sz, 0.2, 0.06, mat.furn, 10);
    b.cyl(sx, 0, sz, 0.18, 0.02, mat.dark, 8);
  }
  b.flush();

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
