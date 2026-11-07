import * as T from 'three';
import type { Batch } from './batch';
import { MOBILE } from './config';
import { edgeMat, gridMat, mat } from './materials';
import { canvasTex } from './textures';

/** Slab, floor, grid, signal edge and the two walls of a diorama. */

/** A rectangular opening in a wall, along the wall's axis from `a` to `b`, between heights `y0` and `y1`. */
export interface Opening {
  a: number;
  b: number;
  y0: number;
  y1: number;
}

export interface BaseOptions {
  /** Window on the back wall (runs along x at z = -4.9). */
  window?: Opening;
  /** Window on the left wall (runs along z at x = -4.9). */
  wallLeftOpen?: Opening;
  /** Night glass instead of day glass. */
  night?: boolean;
}

export function base(root: T.Object3D, b: Batch, { window: win, wallLeftOpen, night = false }: BaseOptions): void {
  const shape = new T.Shape();
  shape.moveTo(-5, -5);
  shape.lineTo(5, -5);
  shape.lineTo(5, 5);
  shape.lineTo(-5, 5);
  shape.lineTo(-5, -5);
  const g = new T.ExtrudeGeometry(shape, {
    depth: 0.5,
    bevelEnabled: true,
    bevelThickness: 0.14,
    bevelSize: 0.14,
    bevelSegments: 1,
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, -0.64, 0);
  const slab = new T.Mesh(g, mat.slab);
  slab.receiveShadow = !MOBILE;
  root.add(slab);
  b.box(0, -0.02, 0, 10, 0.04, 10, mat.floor);
  // Floor grid + signal edge.
  const pts: number[] = [];
  for (let i = -4; i <= 4; i++) pts.push(i, 0.025, -5, i, 0.025, 5, -5, 0.025, i, 5, 0.025, i);
  const gridGeo = new T.BufferGeometry();
  gridGeo.setAttribute('position', new T.Float32BufferAttribute(pts, 3));
  root.add(new T.LineSegments(gridGeo, gridMat));
  const E = 5.15;
  const edge = new T.BufferGeometry();
  edge.setAttribute(
    'position',
    new T.Float32BufferAttribute(
      [-E, -0.14, -E, E, -0.14, -E, E, -0.14, -E, E, -0.14, E, E, -0.14, E, -E, -0.14, E, -E, -0.14, E, -E, -0.14, -E],
      3,
    ),
  );
  root.add(new T.LineSegments(edge, edgeMat));
  // Walls: left wall runs along z at x=-4.9, back wall along x at z=-4.9.
  const H = 3.2;
  wallRun(b, 'z', -5, 5, -4.9, H, wallLeftOpen ? [wallLeftOpen] : [], mat.wall, night);
  wallRun(b, 'x', -4.8, 5, -4.9, H, win ? [win] : [], mat.wall2, night);
  b.box(-4.9, H, 0, 0.24, 0.04, 10, mat.trim);
  b.box(0.1, H, -4.9, 9.8, 0.04, 0.24, mat.trim);
}

/** A wall with rectangular openings; each opening gets a frame and a glass pane. */
export function wallRun(
  b: Batch,
  axis: 'x' | 'z',
  from: number,
  to: number,
  fixed: number,
  H: number,
  openings: Opening[],
  material: T.Material,
  night: boolean,
): void {
  const T_ = 0.2;
  const put = (a0: number, a1: number, y0: number, y1: number, m: T.Material = material, depth = T_, off = 0) => {
    const len = a1 - a0;
    const mid = (a0 + a1) / 2;
    if (len <= 0.001 || y1 - y0 <= 0.001) return;
    if (axis === 'x') b.box(mid, y0, fixed + off, len, y1 - y0, depth, m);
    else b.box(fixed + off, y0, mid, depth, y1 - y0, len, m);
  };
  let cur = from;
  for (const o of openings) {
    put(cur, o.a, 0, H);
    put(o.a, o.b, 0, o.y0);
    put(o.a, o.b, o.y1, H);
    // frame
    const f = 0.06;
    put(o.a, o.b, o.y0 - f, o.y0, mat.trim, 0.3);
    put(o.a, o.b, o.y1, o.y1 + f, mat.trim, 0.3);
    put(o.a - f, o.a, o.y0, o.y1, mat.trim, 0.3);
    put(o.b, o.b + f, o.y0, o.y1, mat.trim, 0.3);
    const midA = (o.a + o.b) / 2;
    put(midA - 0.025, midA + 0.025, o.y0, o.y1, mat.trim, 0.26);
    put(o.a, o.b, o.y0, o.y1, night ? mat.glassNight : mat.glassDay, 0.04);
    cur = o.b;
  }
  put(cur, to, 0, H);
}

// ---------- ground halo: soft contact shadow + faint floor haze under each slab ----------
let halo: { geo: T.PlaneGeometry; mat: T.MeshBasicMaterial } | null = null;

export function addGroundHalo(root: T.Object3D): void {
  if (!halo) {
    const tex = canvasTex(256, 256, (c, w, h) => {
      const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(70,80,96,.22)');
      g.addColorStop(0.55, 'rgba(70,80,96,.1)');
      g.addColorStop(1, 'rgba(70,80,96,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, w, h);
      // Blurred square the size of the slab footprint (11.4 of the plane's 24 units).
      c.filter = 'blur(16px)';
      c.fillStyle = 'rgba(0,0,0,.72)';
      const s = (11.4 / 24) * w;
      c.fillRect((w - s) / 2, (h - s) / 2, s, s);
    }).tex;
    halo = {
      geo: new T.PlaneGeometry(24, 24),
      mat: new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }),
    };
  }
  const m = new T.Mesh(halo.geo, halo.mat);
  m.rotation.x = -Math.PI / 2;
  m.position.y = -0.82;
  m.renderOrder = -1;
  root.add(m);
}
