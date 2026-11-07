import * as T from 'three';
import { REDUCE } from '../env';
import { mat } from './materials';
import { mesh, puff, SPH } from './primitives';

/** Animated pets (groups, not batched): the poodle and the cats of the living room. */

export interface Pet {
  root: T.Group;
  update(t: number): void;
}

/** Black smooth-haired poodle, sitting, facing +z local: smooth spheres, floppy ears. */
export function makeDog(): Pet {
  const root = new T.Group();
  const m = mat.dog;
  const blob = (parent: T.Object3D, x: number, y: number, z: number, sx: number, sy = sx, sz = sx) => {
    const p = mesh(SPH, m, parent, x, y, z);
    p.scale.set(sx, sy, sz);
    return p;
  };
  blob(root, 0, 0.14, -0.12, 0.15, 0.13, 0.2); // rump on the seat
  blob(root, 0, 0.26, 0.08, 0.13, 0.17, 0.15); // chest
  blob(root, 0, 0.4, 0.12, 0.07, 0.09, 0.07); // neck
  for (const s of [-1, 1]) {
    blob(root, 0.12 * s, 0.08, -0.1, 0.07, 0.06, 0.1); // thighs
    mesh(new T.CylinderGeometry(0.028, 0.03, 0.3, 7), m, root, 0.08 * s, 0.15, 0.18); // front legs
    blob(root, 0.08 * s, 0.015, 0.21, 0.045, 0.025, 0.065); // front paws
    blob(root, 0.13 * s, 0.015, 0.0, 0.04, 0.025, 0.07); // back paws
  }
  const head = new T.Group();
  head.position.set(0, 0.52, 0.14);
  root.add(head);
  blob(head, 0, 0, 0, 0.1, 0.095, 0.1); // skull
  blob(head, 0, -0.03, 0.1, 0.055, 0.045, 0.08); // muzzle
  for (const s of [-1, 1]) {
    const e = blob(head, 0.095 * s, -0.04, -0.01, 0.028, 0.095, 0.055); // smooth floppy ears
    e.rotation.z = s * 0.2;
  }
  mesh(new T.IcosahedronGeometry(0.02, 0), mat.black, head, 0, -0.01, 0.175).castShadow = false;
  for (const s of [-1, 1]) mesh(new T.IcosahedronGeometry(0.012, 0), mat.eye, head, 0.045 * s, 0.025, 0.085).castShadow = false;
  const tail = new T.Group();
  tail.position.set(0, 0.2, -0.3);
  root.add(tail);
  const tl = mesh(new T.CylinderGeometry(0.012, 0.022, 0.2, 6), m, tail, 0, 0.08, -0.04);
  tl.rotation.x = 0.45;
  const ph = Math.random() * 6;
  function update(t: number): void {
    if (REDUCE) return;
    t += ph;
    head.position.y = 0.52 + Math.sin(t * 2.4) * 0.012;
    head.rotation.z = Math.sin(t * 0.7) * 0.08;
    head.rotation.y = Math.sin(t * 0.45) * 0.15;
    tail.rotation.y = Math.sin(t * 9) * 0.45;
    root.scale.y = 1 + Math.sin(t * 1.9) * 0.01;
  }
  return { root, update };
}

export type CatPose = 'sit' | 'sleep' | 'eat';

/**
 * Cat: 'sleep' (curled up, breathing), 'sit' (sitting, tail moving) or 'eat' (on four legs,
 * head down over the bowl). Faces +z local. `patch` adds spots of another colour on the fur.
 */
export function makeCat(m: T.Material, pose: CatPose = 'sit', patch: T.Material | null = null): Pet {
  const root = new T.Group();
  const blob = (parent: T.Object3D, x: number, y: number, z: number, sx: number, sy = sx, sz = sx) =>
    puff(m, parent, x, y, z, sx, sy, sz);
  const ear = new T.ConeGeometry(0.026, 0.06, 4);
  let tail: T.Group | null = null;
  let head: T.Group | null = null;
  if (pose === 'eat') {
    blob(root, 0, 0.17, 0, 0.09, 0.09, 0.17);
    for (const [sx, sz] of [
      [-0.05, -0.11],
      [0.05, -0.11],
      [-0.05, 0.1],
      [0.05, 0.1],
    ]) {
      mesh(new T.CylinderGeometry(0.018, 0.02, 0.17, 5), m, root, sx, 0.085, sz);
    }
    head = new T.Group();
    head.position.set(0, 0.15, 0.2);
    head.rotation.x = 0.75;
    root.add(head);
    blob(head, 0, 0, 0, 0.08, 0.075, 0.08);
    for (const s of [-1, 1]) {
      const e = mesh(ear, m, head, 0.055 * s, 0.075, 0);
      e.castShadow = false;
    }
    if (patch) {
      puff(patch, root, 0.05, 0.22, -0.04, 0.06, 0.05, 0.08);
      puff(patch, head, -0.04, 0.04, 0.02, 0.05, 0.04, 0.05);
    }
    tail = new T.Group();
    tail.position.set(0, 0.22, -0.16);
    root.add(tail);
    const tl = mesh(new T.CylinderGeometry(0.008, 0.02, 0.28, 5), m, tail, 0, 0.1, -0.08);
    tl.rotation.x = 0.6;
  } else if (pose === 'sleep') {
    blob(root, 0, 0.07, 0, 0.21, 0.08, 0.17);
    const sleepHead = blob(root, 0.1, 0.085, 0.12, 0.08, 0.065, 0.08);
    for (const s of [-1, 1]) {
      const e = mesh(ear, m, root, 0.1 + 0.045 * s, 0.14, 0.11);
      e.castShadow = false;
    }
    sleepHead.castShadow = false;
    const seg = new T.CylinderGeometry(0.014, 0.018, 0.13, 5);
    for (let i = 0; i < 3; i++) {
      const a = 0.9 + i * 0.75;
      const s = mesh(seg, m, root, -0.2 * Math.cos(a) * 0.9, 0.035, 0.19 * Math.sin(a));
      s.rotation.z = Math.PI / 2;
      s.rotation.y = Math.PI / 2 - a;
    }
  } else {
    blob(root, 0, 0.17, -0.02, 0.1, 0.17, 0.13);
    blob(root, 0, 0.12, 0.08, 0.09, 0.1, 0.08);
    head = new T.Group();
    head.position.set(0, 0.37, 0.06);
    root.add(head);
    blob(head, 0, 0, 0, 0.085, 0.08, 0.085);
    for (const s of [-1, 1]) {
      const e = mesh(ear, patch && s > 0 ? patch : m, head, 0.055 * s, 0.075, 0);
      e.castShadow = false;
    }
    for (const s of [-1, 1]) {
      const e = mesh(new T.PlaneGeometry(0.02, 0.012), mat.eye, head, 0.03 * s, 0.01, 0.082);
      e.castShadow = false;
    }
    for (const s of [-1, 1]) mesh(new T.CylinderGeometry(0.02, 0.022, 0.2, 5), m, root, 0.05 * s, 0.1, 0.12);
    if (patch) {
      puff(patch, root, 0.065, 0.2, -0.05, 0.06, 0.07, 0.08);
      puff(patch, root, -0.06, 0.1, 0.02, 0.05, 0.06, 0.06);
      puff(patch, head, 0.045, 0.04, 0.03, 0.05, 0.045, 0.05);
    }
    tail = new T.Group();
    tail.position.set(0, 0.06, -0.1);
    root.add(tail);
    const tl = mesh(new T.CylinderGeometry(0.008, 0.02, 0.3, 5), m, tail, 0, 0, -0.15);
    tl.rotation.x = -Math.PI / 2;
  }
  const ph = Math.random() * 6;
  function update(t: number): void {
    if (REDUCE) return;
    t += ph;
    if (pose === 'sleep') {
      const s = 1 + Math.sin(t * 1.1) * 0.03;
      root.scale.set(s, s, s);
    } else if (pose === 'eat') {
      if (head) head.rotation.x = 0.75 + Math.sin(t * 5) * 0.07;
      if (tail) tail.rotation.y = Math.sin(t * 0.8) * 0.35;
    } else if (tail) {
      tail.rotation.y = Math.sin(t * 1.3) * 0.6 + Math.sin(t * 2.9) * 0.15;
      tail.rotation.x = 0.15 + Math.sin(t * 0.9) * 0.1;
    }
  }
  return { root, update };
}
