import * as T from 'three';
import { MOBILE } from './config';

/** Unit geometries shared by the batch and the figures, plus the `mesh()` helper. */

export const UNIT_BOX = new T.BoxGeometry(1, 1, 1);
const cylCache = new Map<string, T.CylinderGeometry>();
/** Unit cylinder (radius 1 at the bottom, `top` at the top, height 1) with `seg` sides, cached. */
export function unitCyl(seg: number, top = 1): T.CylinderGeometry {
  const key = `${seg}:${top}`;
  let g = cylCache.get(key);
  if (!g) {
    g = new T.CylinderGeometry(top, 1, 1, seg);
    cylCache.set(key, g);
  }
  return g;
}
export const TORUS = new T.TorusGeometry(0.03, 0.009, 4, 8);
export const PUFF = new T.IcosahedronGeometry(1, 1);
export const ICO = new T.IcosahedronGeometry(1, 0);
export const SPH = new T.SphereGeometry(1, 14, 10);

/** A mesh under `parent` at (x, y, z); shadows on except on phones. */
export function mesh<G extends T.BufferGeometry, M extends T.Material>(
  geo: G,
  material: M,
  parent: T.Object3D,
  x = 0,
  y = 0,
  z = 0,
): T.Mesh<G, M> {
  const m = new T.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = !MOBILE;
  parent.add(m);
  return m;
}

/** A scaled icosphere blob (fur, hair curls, leaves). */
export function puff(
  m: T.Material,
  parent: T.Object3D,
  x: number,
  y: number,
  z: number,
  sx: number,
  sy = sx,
  sz = sx,
): T.Mesh {
  const p = mesh(PUFF, m, parent, x, y, z);
  p.scale.set(sx, sy, sz);
  return p;
}

/**
 * Local → world (x, z) for props rotated `ry` around (x, z). Convention: a prop "faces" -x in
 * local space (the person sits at +x) and is turned with `ry`.
 */
export const at =
  (x: number, z: number, ry: number) =>
  (lx: number, lz: number): [number, number] => {
    const c = Math.cos(ry);
    const s = Math.sin(ry);
    return [x + lx * c + lz * s, z - lx * s + lz * c];
  };
