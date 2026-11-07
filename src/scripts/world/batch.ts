import * as T from 'three';
import { MOBILE } from './config';
import { UNIT_BOX, unitCyl } from './primitives';

const _m = new T.Matrix4();
const _q = new T.Quaternion();
const _e = new T.Euler();
const _p = new T.Vector3();
const _s = new T.Vector3();

/**
 * Static geometry batching: every `add()` bakes a transformed copy of a unit geometry into a
 * bucket per material; `flush()` merges each bucket into one mesh, so a whole diorama's furniture
 * costs one draw call per material.
 */
export class Batch {
  private buckets = new Map<T.Material, T.BufferGeometry[]>();

  constructor(private root: T.Object3D) {}

  add(
    geo: T.BufferGeometry,
    material: T.Material,
    x: number,
    y: number,
    z: number,
    sx = 1,
    sy = 1,
    sz = 1,
    rx = 0,
    ry = 0,
    rz = 0,
  ): this {
    _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    g.deleteAttribute('uv');
    g.applyMatrix4(_m);
    let bucket = this.buckets.get(material);
    if (!bucket) {
      bucket = [];
      this.buckets.set(material, bucket);
    }
    bucket.push(g);
    return this;
  }

  /** Box with its bottom face at `y`. */
  box(x: number, y: number, z: number, w: number, h: number, d: number, material: T.Material, ry = 0): this {
    return this.add(UNIT_BOX, material, x, y + h / 2, z, w, h, d, 0, ry, 0);
  }

  /** Cylinder standing on `y`, radius `r` (top radius `r * top`). */
  cyl(x: number, y: number, z: number, r: number, h: number, material: T.Material, seg = 8, top = 1): this {
    return this.add(unitCyl(seg, top), material, x, y + h / 2, z, r, h, r);
  }

  flush(): void {
    for (const [material, geos] of this.buckets) {
      let n = 0;
      for (const g of geos) n += g.attributes.position.count;
      const pos = new Float32Array(n * 3);
      const nor = new Float32Array(n * 3);
      let o = 0;
      for (const g of geos) {
        pos.set(g.attributes.position.array as Float32Array, o * 3);
        nor.set(g.attributes.normal.array as Float32Array, o * 3);
        o += g.attributes.position.count;
        g.dispose();
      }
      const merged = new T.BufferGeometry();
      merged.setAttribute('position', new T.BufferAttribute(pos, 3));
      merged.setAttribute('normal', new T.BufferAttribute(nor, 3));
      merged.computeBoundingSphere();
      const m = new T.Mesh(merged, material);
      m.castShadow = m.receiveShadow = !MOBILE;
      this.root.add(m);
    }
    this.buckets.clear();
  }
}
