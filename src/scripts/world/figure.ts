import * as T from 'three';
import { REDUCE } from '../env';
import { fr, mat, pm, type FigureMats } from './materials';
import { mesh, PUFF, UNIT_BOX } from './primitives';
import { staticMat } from './textures';

/** The blocky figure shared by Franco and the secondary people, with its poses and options. */

const G = {
  torso: new T.CylinderGeometry(0.19, 0.16, 0.5, 6),
  pelvis: new T.BoxGeometry(0.34, 0.16, 0.21),
  neck: new T.CylinderGeometry(0.05, 0.055, 0.1, 6),
  head: new T.IcosahedronGeometry(0.12, 1),
  upper: new T.CylinderGeometry(0.052, 0.046, 0.28, 5).translate(0, -0.14, 0),
  fore: new T.CylinderGeometry(0.045, 0.04, 0.26, 5).translate(0, -0.13, 0),
  hand: new T.BoxGeometry(0.07, 0.09, 0.045).translate(0, -0.3, 0),
  thigh: new T.CylinderGeometry(0.078, 0.066, 0.44, 6).translate(0, -0.22, 0),
  shin: new T.CylinderGeometry(0.062, 0.05, 0.42, 6).translate(0, -0.21, 0),
  foot: new T.BoxGeometry(0.1, 0.07, 0.22).translate(0, -0.455, 0.05),
};

export type Pose = 'typing' | 'writing' | 'phone' | 'standing' | 'relaxed';

interface PoseDef {
  lean: number;
  sh: [number, number];
  el: number;
  head: number;
  seated: boolean;
  legs?: number;
}

// Poses: seated ones put the hip at y≈0.52 (seat at 0.47); standing, at y=0.93.
const POSES: Record<Pose, PoseDef> = {
  typing: { lean: 0.12, sh: [-0.38, 0.1], el: -1.18, head: 0.12, seated: true },
  writing: { lean: 0.18, sh: [-0.42, 0.06], el: -1.12, head: 0.3, seated: true },
  phone: { lean: -0.08, sh: [-0.32, 0.2], el: -1.45, head: 0.38, seated: true },
  standing: { lean: 0.02, sh: [0.06, 0.08], el: -0.22, head: 0.04, seated: false },
  relaxed: { lean: -0.22, sh: [-0.12, 0.22], el: -0.75, head: -0.04, seated: true, legs: 0.25 },
};

const GLASS_RING = new T.TorusGeometry(0.032, 0.006, 4, 10);

/**
 * Optional details: glasses, watch (left wrist), curly hair, receding hairline, long hair,
 * polo collar (material) and the shirt showing under a jacket (lapel material).
 */
export interface FigureOptions {
  glasses?: boolean;
  watch?: boolean;
  curly?: boolean;
  recede?: boolean;
  long?: boolean;
  collar?: T.Material | null;
  lapel?: T.Material | null;
}

interface Arm {
  shoulder: T.Group;
  elbow: T.Group;
  hand: T.Mesh;
}
interface Leg {
  hip: T.Group;
  knee: T.Group;
}

export interface Figure {
  root: T.Group;
  body: T.Group;
  spine: T.Group;
  head: T.Group;
  L: Arm;
  R: Arm;
  LL: Leg;
  RL: Leg;
  P: PoseDef;
  update(t: number): void;
}

/** `m` carries the materials; `ph` offsets the idle so figures never move in unison. */
export function figure(m: FigureMats, pose: Pose, ph = 0, o: FigureOptions = {}): Figure {
  const root = new T.Group();
  const body = new T.Group();
  root.add(body); // hip pivot at y=0
  mesh(G.pelvis, m.pants, body, 0, 0.02, 0);
  const spine = new T.Group();
  spine.position.y = 0.08;
  body.add(spine);
  const torso = mesh(G.torso, m.shirt, spine, 0, 0.25, 0);
  torso.scale.z = 0.68;
  mesh(UNIT_BOX, m.shirt, spine, 0, 0.47, 0).scale.set(0.44, 0.08, 0.2);
  mesh(G.neck, m.skin, spine, 0, 0.55, 0);
  const head = new T.Group();
  head.position.y = 0.58;
  spine.add(head);
  const skull = mesh(G.head, m.skin, head, 0, 0.13, 0.005);
  skull.scale.set(0.95, 1.12, 1.02);
  if (o.curly) {
    // Curls: puffs over the skull (direction from the head centre, size).
    const curls: [number, number, number, number][] = [
      [0, 1, 0, 0.095],
      [0.6, 0.8, 0.2, 0.08],
      [-0.6, 0.8, 0.2, 0.08],
      [0.6, 0.7, -0.5, 0.08],
      [-0.6, 0.7, -0.5, 0.08],
      [0, 0.75, -0.65, 0.085],
      [0.95, 0.3, -0.2, 0.07],
      [-0.95, 0.3, -0.2, 0.07],
      [0.5, 0.55, 0.7, 0.06],
      [-0.5, 0.55, 0.7, 0.06],
      [0.85, 0, -0.5, 0.065],
      [-0.85, 0, -0.5, 0.065],
      [0, 0.3, -0.95, 0.075],
      [0.7, -0.3, -0.6, 0.06],
      [-0.7, -0.3, -0.6, 0.06],
    ];
    for (const [ax, ay, az, sz] of curls) {
      const l = Math.hypot(ax, ay, az);
      mesh(PUFF, m.hair, head, (ax / l) * 0.115, 0.13 + (ay / l) * 0.13, 0.005 + (az / l) * 0.115).scale.setScalar(sz);
    }
  } else {
    // With `recede` the cap starts further back: a receding hairline, the rest of the hair the same.
    mesh(UNIT_BOX, m.hair, head, 0, 0.245, o.recede ? -0.045 : -0.015).scale.set(0.235, 0.075, o.recede ? 0.19 : 0.25);
    mesh(UNIT_BOX, m.hair, head, 0, 0.17, -0.1).scale.set(0.23, 0.16, 0.07);
    mesh(UNIT_BOX, m.hair, head, 0.112, 0.2, -0.03).scale.set(0.02, 0.1, 0.18);
    mesh(UNIT_BOX, m.hair, head, -0.112, 0.2, -0.03).scale.set(0.02, 0.1, 0.18);
  }
  if (o.long) {
    // Long hair: down the back to mid height and down the sides to the shoulders.
    mesh(UNIT_BOX, m.hair, head, 0, -0.04, -0.1).scale.set(0.24, 0.42, 0.08);
    for (const s of [-1, 1]) mesh(UNIT_BOX, m.hair, head, 0.125 * s, 0.03, -0.03).scale.set(0.03, 0.3, 0.17);
  }
  if (o.glasses) {
    for (const s of [-1, 1]) mesh(GLASS_RING, mat.glass, head, 0.047 * s, 0.15, 0.128).castShadow = false;
    mesh(UNIT_BOX, mat.glass, head, 0, 0.15, 0.128).scale.set(0.03, 0.008, 0.008);
    for (const s of [-1, 1]) {
      const a = mesh(UNIT_BOX, mat.glass, head, 0.114 * s, 0.155, 0.04);
      a.scale.set(0.008, 0.008, 0.17);
      a.castShadow = false;
    }
  }
  if (o.collar) {
    // Polo collar: two flaps open at the front and a strip at the back.
    for (const s of [-1, 1]) {
      const f = mesh(UNIT_BOX, o.collar, spine, 0.05 * s, 0.525, 0.085);
      f.scale.set(0.085, 0.012, 0.05);
      f.rotation.set(0.35, -0.55 * s, 0.25 * s);
    }
    mesh(UNIT_BOX, o.collar, spine, 0, 0.535, -0.045).scale.set(0.15, 0.035, 0.03);
    mesh(UNIT_BOX, o.collar, spine, 0, 0.44, 0.112).scale.set(0.012, 0.09, 0.012);
  }
  if (o.lapel) {
    // Shirt showing in a V under the jacket.
    mesh(UNIT_BOX, o.lapel, spine, 0, 0.42, 0.112).scale.set(0.065, 0.17, 0.012);
    for (const s of [-1, 1]) {
      const l = mesh(UNIT_BOX, m.shirt, spine, 0.045 * s, 0.42, 0.117);
      l.scale.set(0.02, 0.17, 0.012);
      l.rotation.y = 0.5 * s;
    }
  }
  const arm = (side: number): Arm => {
    const shoulder = new T.Group();
    shoulder.position.set(0.235 * side, 0.46, 0);
    spine.add(shoulder);
    mesh(G.upper, m.shirt, shoulder);
    const elbow = new T.Group();
    elbow.position.y = -0.28;
    shoulder.add(elbow);
    mesh(G.fore, m.shirt, elbow);
    const hand = mesh(G.hand, m.skin, elbow);
    return { shoulder, elbow, hand };
  };
  const leg = (side: number): Leg => {
    const hip = new T.Group();
    hip.position.set(0.09 * side, 0, 0);
    body.add(hip);
    mesh(G.thigh, m.pants, hip);
    const knee = new T.Group();
    knee.position.y = -0.44;
    hip.add(knee);
    mesh(G.shin, m.pants, knee);
    mesh(G.foot, m.shoes, knee);
    return { hip, knee };
  };
  const L = arm(1);
  const R = arm(-1);
  const LL = leg(1);
  const RL = leg(-1);
  if (o.watch) {
    // Watch on the left wrist: silver band and a face on the back of the wrist.
    mesh(UNIT_BOX, mat.silver, L.elbow, 0, -0.262, 0).scale.set(0.08, 0.022, 0.056);
    mesh(UNIT_BOX, mat.black, L.elbow, 0, -0.262, 0.03).scale.set(0.032, 0.026, 0.006);
  }
  const P = POSES[pose];
  if (P.seated) {
    const open = P.legs ?? 0;
    for (const l of [LL, RL]) {
      l.hip.rotation.x = -Math.PI / 2 + open;
      l.knee.rotation.x = Math.PI / 2 - open;
    }
  }
  LL.hip.rotation.z = 0.04;
  RL.hip.rotation.z = -0.04;
  spine.rotation.x = P.lean;
  for (const [a, side] of [
    [L, 1],
    [R, -1],
  ] as [Arm, number][]) {
    a.shoulder.rotation.x = P.sh[0];
    a.shoulder.rotation.z = -P.sh[1] * side;
    a.elbow.rotation.x = P.el;
  }
  head.rotation.x = P.head;

  function update(t: number): void {
    if (REDUCE) return;
    t += ph;
    const br = Math.sin(t * 1.7);
    spine.scale.y = 1 + br * 0.012;
    spine.rotation.x = P.lean + br * 0.008;
    if (pose === 'typing') {
      L.elbow.rotation.x = P.el + Math.sin(t * 13) * 0.05 + Math.sin(t * 7.1) * 0.03;
      R.elbow.rotation.x = P.el + Math.sin(t * 11 + 1.7) * 0.05 + Math.sin(t * 5.3) * 0.03;
      L.hand.rotation.x = Math.sin(t * 17) * 0.12;
      R.hand.rotation.x = Math.sin(t * 15 + 2) * 0.12;
      head.rotation.y = Math.sin(t * 0.4) * 0.08;
    } else if (pose === 'writing') {
      // Looks up at the board and back down to the notes.
      const look = Math.max(0, Math.sin(t * 0.55)) ** 3;
      head.rotation.x = P.head - look * 0.5;
      head.rotation.y = look * 0.25;
      R.elbow.rotation.x = P.el + Math.sin(t * 9) * 0.04 * (1 - look);
      R.shoulder.rotation.z = -P.sh[1] * -1 + Math.cos(t * 9) * 0.03 * (1 - look);
    } else if (pose === 'standing') {
      // Standing sway and a slow head turn (scanning the classroom).
      body.rotation.z = Math.sin(t * 0.5) * 0.018;
      body.position.y = Math.sin(t * 1.0) * 0.004;
      head.rotation.y = Math.sin(t * 0.33) * 0.4 + Math.sin(t * 0.9) * 0.05;
      R.shoulder.rotation.x = P.sh[0] + Math.sin(t * 0.7) * 0.06;
      L.shoulder.rotation.x = P.sh[0] - Math.sin(t * 0.7) * 0.04;
    } else if (pose === 'relaxed') {
      head.rotation.y = Math.sin(t * 0.3) * 0.2;
      head.rotation.x = P.head + Math.sin(t * 0.6) * 0.03;
      L.elbow.rotation.x = P.el + Math.sin(t * 0.8) * 0.04;
    } else {
      head.rotation.x = P.head + Math.sin(t * 0.7) * 0.03;
      R.elbow.rotation.x = P.el + Math.sin(t * 0.9) * 0.02;
      L.elbow.rotation.x = P.el + Math.sin(t * 6) * 0.025 * (Math.sin(t * 0.8) > 0 ? 1 : 0);
    }
  }
  return { root, body, spine, head, L, R, LL, RL, P, update };
}

export interface Franco {
  root: T.Group;
  /** Invisible box covering head, torso and legs in every pose (the tap target). */
  hit: T.Mesh;
  /** Floor ring that fades in on hover. */
  ring: T.Mesh<T.RingGeometry, T.MeshBasicMaterial>;
  /** Point above the head where the "tap to talk" label projects. */
  anchor: T.Object3D;
  chest: T.Object3D;
  head: T.Group;
  phoneGlow: T.Mesh<T.PlaneGeometry, T.MeshBasicMaterial> | null;
  update(t: number): void;
}

export function makeFranco(pose: Pose): Franco {
  const f = figure(fr, pose, 0, { glasses: true, watch: true });
  const { root, spine, R } = f;
  const badge = mesh(UNIT_BOX, mat.signal, spine, 0.085, 0.36, 0.125);
  badge.scale.set(0.05, 0.034, 0.012);
  badge.castShadow = false;

  // Hit area (covers head, torso and legs in the three poses), hover ring.
  const hit = new T.Mesh(new T.BoxGeometry(1.0, 1.7, 1.1), mat.signal);
  hit.position.set(0, 0.32, 0.12);
  hit.visible = false;
  root.add(hit);
  const ring = new T.Mesh(
    new T.RingGeometry(0.6, 0.68, 48),
    new T.MeshBasicMaterial({ color: 0xc9ced6, transparent: true, opacity: 0, depthWrite: false }),
  );
  ring.rotation.x = -Math.PI / 2;
  root.add(ring);

  let phoneGlow: Franco['phoneGlow'] = null;
  if (pose === 'phone') {
    const phone = new T.Group();
    phone.position.set(0, -0.33, 0.035);
    phone.rotation.x = 0.25;
    R.elbow.add(phone);
    mesh(UNIT_BOX, mat.black, phone).scale.set(0.075, 0.15, 0.012);
    const scr = new T.Mesh(new T.PlaneGeometry(0.064, 0.13), new T.MeshBasicMaterial({ color: 0x1fbf75 }));
    scr.position.z = 0.007;
    phone.add(scr);
    phoneGlow = scr;
  }

  const anchor = new T.Object3D();
  anchor.position.set(0, 1.25, 0);
  root.add(anchor);
  const chest = new T.Object3D();
  chest.position.set(0, 0.45, 0);
  root.add(chest);

  function update(t: number): void {
    if (REDUCE) return;
    f.update(t);
    if (phoneGlow) phoneGlow.material.color.setHex(0x1fbf75).multiplyScalar(0.85 + Math.sin(t * 2.2) * 0.15);
  }
  return { root, hit, ring, anchor, chest, head: f.head, update, phoneGlow };
}

// ---------- "no signal": on hover, Franco turns into TV static ----------
let staticOn: Franco | null = null;

/** Swaps every mesh of `franco` (except hit box and ring) to the static material, or back. */
export function setStatic(franco: Franco, on: boolean): void {
  if (staticOn && (!on || staticOn !== franco)) {
    staticOn.root.traverse((o) => {
      if (o instanceof T.Mesh && o.userData.mat) o.material = o.userData.mat as T.Material;
    });
    staticOn = null;
  }
  if (!on || staticOn === franco) return;
  franco.root.traverse((o) => {
    if (!(o instanceof T.Mesh) || o === franco.hit || o === franco.ring) return;
    o.userData.mat ??= o.material;
    o.material = staticMat;
  });
  staticOn = franco;
}

export const isStaticOn = (): boolean => staticOn !== null;

// ---------- secondary people: same figure, no hit box or label, own cached materials ----------
export interface PersonSpec extends Omit<FigureOptions, 'collar' | 'lapel'> {
  shirt: number;
  pants: number;
  skin: number;
  hair: number;
  pose?: Pose;
  /** Collar / lapel as colours; turned into cached materials. */
  collar?: number | T.Material | null;
  lapel?: number | T.Material | null;
}

export interface Person {
  root: T.Group;
  update(t: number): void;
}

const PRESETS: Omit<PersonSpec, 'pose'>[] = [
  { shirt: 0x3f5f80, pants: 0x262c36, skin: 0xc8a68e, hair: 0x1b1e23 }, // muted blue
  { shirt: 0x9c5a46, pants: 0x2d3038, skin: 0xa97d5e, hair: 0x4a3426 }, // terracotta
  { shirt: 0xb3903d, pants: 0x1f242b, skin: 0xe0bfa3, hair: 0xb8955a }, // mustard
  { shirt: 0x5f7360, pants: 0x3a3f4a, skin: 0xc8a68e, hair: 0x4a3426 }, // grey green
  { shirt: 0x6e4b6c, pants: 0x262c36, skin: 0xb48a6a, hair: 0x1b1e23 }, // plum
];

const asMat = (v: number | T.Material | null | undefined): T.Material | null =>
  v == null ? null : typeof v === 'number' ? pm(v) : v;

export function makePerson({ shirt, pants, skin, hair, pose = 'typing', collar, lapel, ...o }: PersonSpec): Person {
  const f = figure(
    { skin: pm(skin), hair: pm(hair), shirt: pm(shirt), pants: pm(pants), shoes: pm(0x111317) },
    pose,
    Math.random() * 6.28,
    { ...o, collar: asMat(collar), lapel: asMat(lapel) },
  );
  return { root: f.root, update: f.update };
}

export const person = (preset: number, pose: Pose): Person => makePerson({ ...PRESETS[preset % PRESETS.length], pose });
