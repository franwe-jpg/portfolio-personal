import * as T from 'three';
import { mesh } from './primitives';

/** Canvas-backed textures: animated screens, glows, the clock face and the TV static. */

export interface CanvasTex {
  tex: T.CanvasTexture;
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
}

export type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

export function canvasTex(w: number, h: number, draw: Draw): CanvasTex {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d context unavailable');
  draw(ctx, w, h);
  const tex = new T.CanvasTexture(canvas);
  tex.colorSpace = T.SRGBColorSpace;
  tex.anisotropy = 4;
  return { tex, ctx, canvas };
}

/** Rounded rectangle path (plain rect where `roundRect` is missing). */
export function rrect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  if (c.roundRect) {
    c.beginPath();
    c.roundRect(x, y, w, h, r);
  } else {
    c.beginPath();
    c.rect(x, y, w, h);
  }
}

// ---------- "no signal" static: covers Franco on hover, outlines the clock and the TV ----------
export const SN = 64;
export const snow = canvasTex(SN, SN, () => {});
snow.tex.magFilter = snow.tex.minFilter = T.NearestFilter;
snow.tex.generateMipmaps = false;
// Outlines larger than one tile repeat the noise instead of smearing it.
snow.tex.wrapS = snow.tex.wrapT = T.RepeatWrapping;
const snowImg = snow.ctx.createImageData(SN, SN);

export function drawSnow(): void {
  const d = snowImg.data;
  for (let i = 0; i < SN * SN; i++) {
    const row = (i / SN) | 0;
    // Faint scan lines every fourth row.
    const v = (40 + Math.random() * 190) * (row % 4 === 3 ? 0.55 : 1);
    d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v;
    d[i * 4 + 3] = 255;
  }
  snow.ctx.putImageData(snowImg, 0, 0);
  snow.tex.needsUpdate = true;
}
drawSnow();

export const staticMat = new T.MeshBasicMaterial({ map: snow.tex });

/**
 * Outline that appears around something hoverable: the same TV static that covers Franco
 * (redrawn while any hover is on), hugging the shape with no margin.
 */
export function staticOutline(
  parent: T.Object3D,
  geo: T.BufferGeometry,
  z: number,
): T.Mesh<T.BufferGeometry, T.MeshBasicMaterial> {
  const m = mesh(
    geo,
    new T.MeshBasicMaterial({ map: snow.tex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }),
    parent,
    0,
    0,
    z,
  );
  m.castShadow = m.receiveShadow = false;
  return m;
}

/** A flat rectangular frame (outer w×h, border t) for the static outline of a screen. */
export function frameGeometry(w: number, h: number, t: number): T.ShapeGeometry {
  const sh = new T.Shape();
  sh.moveTo(-w / 2, -h / 2);
  sh.lineTo(w / 2, -h / 2);
  sh.lineTo(w / 2, h / 2);
  sh.lineTo(-w / 2, h / 2);
  sh.closePath();
  const hole = new T.Path();
  hole.moveTo(-w / 2 + t, -h / 2 + t);
  hole.lineTo(w / 2 - t, -h / 2 + t);
  hole.lineTo(w / 2 - t, h / 2 - t);
  hole.lineTo(-w / 2 + t, h / 2 - t);
  hole.closePath();
  sh.holes.push(hole);
  return new T.ShapeGeometry(sh);
}
