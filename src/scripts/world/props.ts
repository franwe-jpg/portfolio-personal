import * as T from 'three';
import type { Batch } from './batch';
import { mat } from './materials';
import { at, ICO, TORUS, UNIT_BOX } from './primitives';

/**
 * Static props: everything here goes into a scene's `Batch`, so a whole diorama's furniture
 * costs one draw call per material. Props "face" -x in local space (the person sits at +x)
 * and are turned with `ry` around (x, z); see `at()` in primitives.ts.
 */

/** Swivel chair: 5-spoke base, piston, seat, backrest (at +x local) and armrests. */
export function swivelChair(b: Batch, x: number, z: number, ry = 0): void {
  const w = at(x, z, ry);
  b.cyl(x, 0.06, z, 0.03, 0.34, mat.metal, 6);
  b.cyl(x, 0.0, z, 0.06, 0.06, mat.dark, 6);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + ry;
    b.box(x + Math.cos(a) * 0.17, 0.03, z + Math.sin(a) * 0.17, 0.34, 0.03, 0.04, mat.dark, -a);
  }
  b.box(x, 0.4, z, 0.5, 0.07, 0.5, mat.furn, ry);
  const [bx, bz] = w(0.24, 0);
  b.box(bx, 0.47, bz, 0.06, 0.62, 0.46, mat.furn, ry);
  for (const s of [-1, 1]) {
    const [ax, az] = w(0.04, 0.26 * s);
    b.box(ax, 0.64, az, 0.3, 0.03, 0.04, mat.dark, ry);
    const [px, pz] = w(0.1, 0.26 * s);
    b.box(px, 0.47, pz, 0.03, 0.17, 0.03, mat.dark, ry);
  }
}

/** Classroom chair: 4 legs, seat and backrest. */
export function classChair(b: Batch, x: number, z: number, ry = 0): void {
  const w = at(x, z, ry);
  b.box(x, 0.44, z, 0.42, 0.04, 0.42, mat.furnL, ry);
  for (const [lx, lz] of [
    [-0.18, -0.18],
    [-0.18, 0.18],
    [0.18, -0.18],
    [0.18, 0.18],
  ]) {
    const [px, pz] = w(lx, lz);
    b.box(px, 0, pz, 0.035, 0.44, 0.035, mat.metal, ry);
  }
  const [kx, kz] = w(0.19, 0);
  b.box(kx, 0.48, kz, 0.03, 0.4, 0.42, mat.furnL, ry);
  for (const s of [-1, 1]) {
    const [px, pz] = w(0.19, 0.17 * s);
    b.box(px, 0.44, pz, 0.03, 0.06, 0.03, mat.metal, ry);
  }
}

/** Open notebook: base + tilted screen (bright face towards +x local, where the person is). */
export function notebook(b: Batch, x: number, y: number, z: number, ry = 0, face: T.Material = mat.screen): void {
  const w = at(x, z, ry);
  b.box(x, y, z, 0.3, 0.016, 0.22, mat.dark, ry);
  const [kx, kz] = w(0.04, 0);
  b.box(kx, y + 0.016, kz, 0.14, 0.004, 0.17, mat.trim, ry);
  const th = 0.38;
  const hx = -0.15;
  const hh = 0.105;
  const c = Math.cos(th);
  const s = Math.sin(th);
  const [px, pz] = w(hx - s * hh, 0);
  b.add(UNIT_BOX, mat.dark, px, y + 0.016 + c * hh, pz, 0.014, 0.21, 0.3, 0, ry, th);
  const [fx, fz] = w(hx - s * hh + c * 0.009, 0);
  b.add(UNIT_BOX, face, fx, y + 0.016 + c * hh + s * 0.009, fz, 0.004, 0.19, 0.28, 0, ry, th);
}

/** Centre and yaw of a monitor face, to hang an animated texture over it. */
export interface Face {
  x: number;
  y: number;
  z: number;
  ry: number;
}

/** Two monitors on an arm, slightly angled towards the person (+x local). */
export function dualMonitors(
  b: Batch,
  x: number,
  y: number,
  z: number,
  ry = 0,
  faces: [T.Material, T.Material] = [mat.screen, mat.screen],
): Face[] {
  const w = at(x, z, ry);
  b.box(x, y, z, 0.26, 0.02, 0.2, mat.dark, ry);
  b.cyl(x, y + 0.02, z, 0.025, 0.42, mat.metal, 6);
  const out: Face[] = [];
  for (const s of [-1, 1]) {
    const a = ry + s * 0.16;
    const c = Math.cos(a);
    const sn = Math.sin(a);
    const [mx, mz] = w(-0.05, s * 0.3);
    b.box(mx, y + 0.27, mz, 0.035, 0.34, 0.56, mat.black, a);
    const fx = mx + 0.02 * c;
    const fz = mz - 0.02 * sn;
    b.box(fx, y + 0.285, fz, 0.006, 0.31, 0.53, faces[s > 0 ? 1 : 0], a);
    out.push({ x: fx + 0.005 * c, y: y + 0.44, z: fz - 0.005 * sn, ry: a });
    const [ax, az] = w(-0.03, s * 0.15);
    b.box(ax, y + 0.4, az, 0.03, 0.03, 0.3, mat.metal, ry);
  }
  return out;
}

export function mug(b: Batch, x: number, y: number, z: number, m: T.Material = mat.paper): void {
  b.cyl(x, y, z, 0.045, 0.1, m, 10);
  b.add(TORUS, m, x + 0.055, y + 0.055, z, 1, 1, 1, 0, 0, 0);
}

/** Coffee machine facing +z: body, tray, cup, red light. */
export function coffeeMachine(b: Batch, x: number, y: number, z: number): void {
  b.box(x, y + 0.2, z, 0.3, 0.24, 0.3, mat.dark);
  b.box(x, y, z - 0.06, 0.3, 0.2, 0.18, mat.dark);
  b.box(x, y + 0.44, z, 0.32, 0.03, 0.32, mat.trim);
  b.box(x, y, z + 0.08, 0.24, 0.02, 0.12, mat.metal);
  b.cyl(x, y + 0.02, z + 0.08, 0.035, 0.07, mat.paper, 8);
  b.box(x, y + 0.16, z + 0.08, 0.03, 0.04, 0.03, mat.metal);
  b.box(x + 0.1, y + 0.33, z + 0.152, 0.02, 0.02, 0.006, mat.red);
  b.box(x - 0.04, y + 0.31, z + 0.152, 0.08, 0.03, 0.006, mat.screen2);
}

export function waterDispenser(b: Batch, x: number, z: number): void {
  b.box(x, 0, z, 0.32, 0.95, 0.32, mat.pale);
  b.box(x, 0.95, z, 0.3, 0.04, 0.3, mat.trim);
  b.cyl(x, 0.99, z, 0.14, 0.42, mat.glassDay, 10);
  b.cyl(x, 1.41, z, 0.05, 0.04, mat.glassDay, 8);
  b.box(x - 0.05, 0.78, z + 0.17, 0.03, 0.05, 0.04, mat.trim);
  b.box(x + 0.05, 0.78, z + 0.17, 0.03, 0.05, 0.04, mat.red);
}

/** Low TV unit (front towards +z). */
export function tvUnit(b: Batch, x: number, z: number, w = 1.7): void {
  b.box(x, 0.06, z, w, 0.44, 0.45, mat.furn);
  b.box(x, 0.5, z, w + 0.04, 0.04, 0.49, mat.furnL);
  b.box(x, 0.2, z + 0.226, w * 0.45, 0.016, 0.01, mat.trim);
  b.box(x, 0.3, z + 0.226, 0.01, 0.2, 0.01, mat.trim);
  for (const s of [-1, 1]) b.box(x + s * (w / 2 - 0.08), 0, z, 0.06, 0.06, 0.4, mat.dark);
}

/** TV panel facing +z; the face is a separate textured plane (returned, not added). */
export function tv(
  b: Batch,
  x: number,
  cy: number,
  z: number,
  w: number,
  h: number,
  tex: T.Texture,
): T.Mesh<T.PlaneGeometry, T.MeshBasicMaterial> {
  b.box(x, cy - h / 2 - 0.02, z, w + 0.04, h + 0.04, 0.04, mat.black);
  const scr = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex, toneMapped: false }));
  scr.position.set(x, cy, z + 0.025);
  return scr;
}

export const rug = (b: Batch, x: number, z: number, w: number, d: number, m: T.Material = mat.rug): void => {
  b.box(x, 0, z, w, 0.02, d, m);
};

export function plant(b: Batch, x: number, z: number, s = 1): void {
  b.cyl(x, 0, z, 0.22 * s, 0.4 * s, mat.pot, 7, 0.82);
  b.add(ICO, mat.plant, x, 0.82 * s, z, 0.36 * s, 0.44 * s, 0.36 * s, 0.2, 0.4, 0);
  b.add(ICO, mat.plant2, x - 0.15 * s, 1.15 * s, z + 0.1 * s, 0.22 * s, 0.28 * s, 0.22 * s, 0.5, 0, 0.3);
}

export function backpack(b: Batch, x: number, z: number, ry: number, m: T.Material): void {
  b.box(x, 0, z, 0.28, 0.36, 0.16, m, ry);
  const w = at(x, z, ry);
  const [sx, sz] = w(0, -0.095);
  b.box(sx, 0.08, sz, 0.2, 0.22, 0.03, mat.dark, ry);
  const [tx, tz] = w(0, 0.02);
  b.box(tx, 0.36, tz, 0.16, 0.03, 0.08, mat.dark, ry);
}

/** Sofa facing +x local, `seats` cushions along z. The arms sit outside `len`. */
export function sofa(b: Batch, x: number, z: number, ry: number, len: number, seats = 2): void {
  const w = at(x, z, ry);
  const put = (lx: number, y: number, lz: number, sx: number, h: number, sz: number, m: T.Material) => {
    const [px, pz] = w(lx, lz);
    b.box(px, y, pz, sx, h, sz, m, ry);
  };
  const inner = len - 0.4;
  const cw = (inner - 0.06 * (seats - 1)) / seats;
  put(0, 0.06, 0, 0.95, 0.32, inner, mat.sofa);
  put(-0.4, 0.38, 0, 0.22, 0.62, inner, mat.sofa);
  for (let i = 0; i < seats; i++) {
    const lz = -inner / 2 + cw / 2 + i * (cw + 0.06);
    put(0.06, 0.38, lz, 0.8, 0.1, cw, mat.cushion);
    put(-0.24, 0.48, lz, 0.14, 0.42, cw - 0.08, mat.cushion);
  }
  for (const s of [-1, 1]) put(0, 0.06, s * (inner / 2 + 0.1), 0.95, 0.6, 0.2, mat.sofa);
  for (const lx of [-0.38, 0.38]) for (const s of [-1, 1]) put(lx, 0, s * (inner / 2 + 0.07), 0.06, 0.06, 0.06, mat.dark);
}

/** Student desk (top 0.55 × 1.0, at 0.72). */
export function studentDesk(b: Batch, x: number, z: number): void {
  b.box(x, 0.72, z, 0.55, 0.04, 1.0, mat.furnL);
  for (const sx of [-0.24, 0.24]) for (const sz of [-0.46, 0.46]) b.box(x + sx, 0, z + sz, 0.04, 0.72, 0.04, mat.furn);
  b.box(x - 0.24, 0.5, z, 0.03, 0.2, 0.9, mat.furn);
}

/** Bookcase with books: the back sits at local x 0 and the shelves come out towards +x local. */
export function bookcase(b: Batch, x: number, z: number, ry: number, w = 2.2, levels = 4): void {
  const at_ = at(x, z, ry);
  const put = (lx: number, y: number, lz: number, sx: number, h: number, sz: number, m: T.Material) => {
    const [px, pz] = at_(lx, lz);
    b.box(px, y, pz, sx, h, sz, m, ry);
  };
  const H = levels * 0.55 + 0.04;
  put(0.02, 0, 0, 0.04, H, w, mat.furn);
  for (let i = 0; i <= levels; i++) put(0.18, i * 0.55, 0, 0.32, 0.04, w, mat.furnL);
  for (const s of [-1, 1]) put(0.18, 0, s * (w / 2 - 0.02), 0.32, H - 0.06, 0.04, mat.furnL);
  const bm = [mat.furn, mat.pale, mat.trim, mat.paper, mat.furnL, mat.dark, mat.plum];
  for (let s = 0; s < levels; s++) {
    let lz = -w / 2 + 0.12;
    while (lz < w / 2 - 0.3) {
      const bw = 0.07 + ((lz * 37 + s * 11 + w) % 5) * 0.02;
      const bh = 0.32 + ((lz * 53 + s * 7) % 4) * 0.04;
      if (((lz * 13 + s + 9) | 0) % 7 !== 3) {
        put(0.18, s * 0.55 + 0.04, lz + bw / 2, 0.26, bh, bw, bm[(Math.abs(lz * 29 + s * 3) | 0) % bm.length]);
      }
      lz += bw + 0.015;
    }
  }
}

/** Round pedestal table. */
export function roundTable(b: Batch, x: number, z: number, r = 0.6): void {
  b.cyl(x, 0, z, 0.26, 0.03, mat.dark, 10);
  b.cyl(x, 0.03, z, 0.035, 0.7, mat.metal, 6);
  b.cyl(x, 0.73, z, r, 0.04, mat.furnL, 14);
}
