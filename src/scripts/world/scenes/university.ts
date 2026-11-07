import * as T from 'three';
import { REDUCE } from '../../env';
import { Batch } from '../batch';
import { makeClock } from '../clock';
import { MOBILE, SCENE_X } from '../config';
import { makeFranco, makePerson, person, type Person } from '../figure';
import { floorGlow, windowGlow, windowLight } from '../lights';
import { mat, pm } from '../materials';
import { at, toWorld, UNIT_BOX, unitCyl } from '../primitives';
import { backpack, bookcase, classChair, notebook, plant, studentDesk } from '../props';
import { createBoard } from '../screens';
import type { Diorama } from '../types';
import { base } from '../walls';

/**
 * University diorama: blackboard with the three Databases II slides (and the "PARISE CRACK"
 * graffiti), projection screen in sync with the board, projector with its light cone, teacher
 * at the lectern, 3×3 desks with notebooks and exercise books, Franco's desk with his lunch
 * box, and the wall clock. Board and screen change slide every 6 s.
 */
export function university(scene: T.Scene): Diorama {
  const root = new T.Group();
  root.position.x = SCENE_X.uni;
  scene.add(root);
  const b = new Batch(root);
  base(root, b, { window: { a: -3.4, b: -1.4, y0: 1.1, y1: 2.6 } });
  // Blackboard on the left wall (faces +x), pushed to the back to leave room for the screen.
  const BZ = -2.3;
  b.box(-4.76, 0.95, BZ, 0.06, 1.95, 4.5, mat.trim);
  b.box(-4.68, 0.93, BZ, 0.16, 0.04, 4.2, mat.furnL);
  b.box(-4.62, 0.97, BZ - 1.6, 0.06, 0.025, 0.12, mat.paper);
  b.box(-4.62, 0.97, BZ - 1.4, 0.06, 0.025, 0.12, mat.pale);
  const slides = createBoard();
  const boardMesh = new T.Mesh(
    new T.PlaneGeometry(4.3, 1.86),
    new T.MeshBasicMaterial({ map: slides.board.tex, toneMapped: false, color: 0xd0d4d9 }),
  );
  boardMesh.position.set(-4.72, 1.9, BZ);
  boardMesh.rotation.y = Math.PI / 2;
  root.add(boardMesh);
  // Projection screen (roll-up) to the right of the board, and the projector aimed at it.
  const PZ = 1.5;
  b.add(unitCyl(10), mat.dark, -4.7, 2.3, PZ, 0.05, 2.34, 0.05, Math.PI / 2, 0, 0);
  b.box(-4.7, 0.86, PZ, 0.03, 0.04, 2.24, mat.dark);
  const screenMesh = new T.Mesh(
    new T.PlaneGeometry(2.2, 1.3),
    new T.MeshBasicMaterial({ map: slides.slide.tex, toneMapped: false, color: 0xe8ecf0 }),
  );
  screenMesh.position.set(-4.7, 1.55, PZ);
  screenMesh.rotation.y = Math.PI / 2;
  root.add(screenMesh);
  // Ceiling projector (lens faces -x, toward the screen).
  b.box(0.3, 2.84, PZ, 0.04, 0.18, 0.04, mat.metal);
  b.box(0.3, 2.66, PZ, 0.42, 0.16, 0.36, mat.pale);
  b.add(unitCyl(10), mat.dark, 0.08, 2.74, PZ, 0.06, 0.05, 0.06, 0, 0, Math.PI / 2);
  b.box(0.3, 2.7, PZ + 0.182, 0.02, 0.02, 0.006, mat.signal);
  let cone: T.Mesh | null = null;
  if (!MOBILE) {
    // Faint light cone from the projector to the screen (hidden in the POV view so it does not wash the frame).
    const lens = new T.Vector3(0.06, 2.74, PZ);
    const scr = new T.Vector3(-4.7, 1.55, PZ);
    const len = lens.distanceTo(scr);
    cone = new T.Mesh(
      new T.ConeGeometry(1.1, len, 24, 1, true),
      new T.MeshBasicMaterial({
        color: 0xcfe6ff,
        transparent: true,
        opacity: 0.08,
        blending: T.AdditiveBlending,
        depthWrite: false,
        side: T.DoubleSide,
      }),
    );
    cone.position.copy(lens).add(scr).multiplyScalar(0.5);
    cone.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), lens.clone().sub(scr).normalize());
    cone.scale.x = 0.6;
    cone.renderOrder = 2;
    root.add(cone);
  }
  // Desks in a 3×3 facing the board (-x), with an aisle between rows.
  const cols = [-1.9, -0.4, 1.1];
  const rows = [-1.9, 0, 1.9];
  const SEAT = (x: number, z: number) => ({ x: x + 0.6, z });
  for (const x of cols) {
    for (const z of rows) {
      studentDesk(b, x, z);
      classChair(b, x + 0.62, z, 0);
    }
  }
  // Franco in the middle column, front row (away from the projector and its cone);
  // mates on 5 desks; 3 empty, two with a backpack.
  const fSeat = SEAT(-0.4, -1.9);
  const mates: [number, number][] = [
    [-1.9, 0],
    [-0.4, 1.9],
    [1.1, 1.9],
    [-1.9, -1.9],
    [-1.9, 1.9],
  ];
  const empties: [number, number, T.Material | null][] = [
    [1.1, -1.9, mat.plum],
    [-0.4, 0, pm(0x9c5a46)],
    [1.1, 0, null],
  ];
  // The occupied desks alternate notebook, exercise book, loose sheet, notebook with an exercise
  // book beside it, and exercise book with a pen.
  const cuaderno = (x: number, z: number, ry: number, cover: T.Material) => {
    b.box(x, 0.76, z, 0.21, 0.025, 0.29, cover, ry);
    const w = at(x, z, ry);
    const [px, pz] = w(0, 0.055);
    b.box(px, 0.785, pz, 0.19, 0.004, 0.13, mat.paper, ry);
  };
  mates.forEach(([x, z], i) => {
    const tilt = 0.2 - ((x * 7 + z * 3) % 1) * 0.5;
    if (i === 0) notebook(b, x - 0.04, 0.76, z, 0);
    else if (i === 1) cuaderno(x, z, tilt, mat.plum);
    else if (i === 2) {
      b.box(x, 0.76, z, 0.24, 0.012, 0.32, mat.paper, tilt);
      b.box(x + 0.08, 0.772, z + 0.15, 0.012, 0.012, 0.16, mat.dark, 0.4);
    } else if (i === 3) {
      notebook(b, x - 0.04, 0.76, z - 0.16, 0);
      cuaderno(x + 0.02, z + 0.26, 0.1, mat.trim);
    } else {
      cuaderno(x, z, tilt, pm(0x9c5a46));
      b.box(x + 0.1, 0.785, z + 0.12, 0.012, 0.012, 0.16, mat.dark, 0.3);
    }
  });
  for (const [x, z, m] of empties) {
    if (m) backpack(b, x + 0.55, z + 0.6, 0.3, m);
    else b.box(x, 0.74, z, 0.2, 0.06, 0.28, mat.trim, 0.1);
  }
  // Franco's desk: notebook and a lunch box with its lid.
  notebook(b, -0.44, 0.76, -2.02, 0);
  b.box(-0.38, 0.76, -1.6, 0.17, 0.065, 0.13, mat.pale, 0.15);
  b.box(-0.38, 0.825, -1.6, 0.18, 0.015, 0.14, mat.plum, 0.15);
  // Lectern between the board and the screen.
  b.box(-3.9, 0, -0.5, 0.55, 1.0, 0.5, mat.furn);
  b.add(UNIT_BOX, mat.furnL, -3.86, 1.06, -0.5, 0.62, 0.05, 0.58, 0, 0, -0.25);
  b.box(-3.84, 1.1, -0.5, 0.3, 0.012, 0.4, mat.paper, 0.1);
  // Bookcase on the back wall.
  bookcase(b, 2.8, -4.57, -Math.PI / 2, 2.2, 4);
  plant(b, 4.3, -3.6, 0.8);
  b.flush();

  const franco = makeFranco('writing');
  franco.root.position.set(fSeat.x, 0.51, fSeat.z);
  franco.root.rotation.y = -Math.PI / 2;
  root.add(franco.root);
  franco.ring.position.y = -0.48;
  const people: Person[] = [];
  mates.slice(0, MOBILE ? 3 : 5).forEach(([x, z], i) => {
    const p = person(i + 1, 'writing');
    p.root.position.set(x + 0.6, 0.51, z);
    p.root.rotation.y = -Math.PI / 2;
    root.add(p.root);
    people.push(p);
  });
  const teacher = makePerson({ shirt: 0x4a505c, pants: 0x1f242b, skin: 0xc8a68e, hair: 0x2a2420, pose: 'standing', recede: true });
  teacher.root.position.set(-3.95, 0.93, 0.45);
  teacher.root.rotation.y = Math.PI / 2 + 0.2;
  root.add(teacher.root);
  people.push(teacher);

  // Softer sun than the office: paler glow, weaker patch.
  windowGlow(root, -2.4, 1.85, -4.86, 2.6, 2.2, '236,240,255', 0.6);
  floorGlow(root, -2.5, -3.5, 2.8, 2.4, '230,236,255', 0.28);
  const sunIn = windowLight(root, 0xf1f4ff, [-2.4, 4.4, -7.2], [-2.6, 0, -2.0]);

  // POV: between the teacher's head and the centre of the screen, so both and the board fit.
  const pov = {
    target: toWorld(root, (-3.95 - 4.7) / 2, (1.72 + 1.55) / 2, (0.45 + PZ) / 2),
    wide: { back: 1.1, up: 0.22, side: -0.32, fov: 50 },
  };
  const onFocus = (on: boolean) => {
    if (cone) cone.visible = !on;
  };
  const clock = makeClock(root, 0, 2.5, -4.77);
  // Surprise shot (plan, Fase 8): projection screen seen from the side away from the teacher (+z).
  const shot = { mesh: screenMesh, dist: 2.3, yaw: -0.6, lift: 0.15 };
  // Hunt ticket (plan, Fase 8): out of the bookcase's front-left edge, at the third shelf.
  const tkSpot = new T.Vector3(1.68, 1.35, -4.22);

  const update = (t: number) => {
    franco.update(t);
    for (const p of people) p.update(t);
    if (!REDUCE) slides.tick(t);
  };
  return {
    root,
    franco,
    update,
    pov,
    onFocus,
    shot,
    tkSpot,
    clock,
    lights: [[sunIn, 60]],
    light: { hemi: 1.6, sun: 2.2, sunColor: 0xf3f6fa },
  };
}
