import * as T from 'three';
import { byId } from '../dom';

/**
 * CSS3D layer: DOM elements placed in the scene with the same camera (the TV's YouTube player).
 * Same matrices as three's CSS3DRenderer; 1 scene unit = 1 CSS px before the object's scale.
 */
export interface Css3dLayer {
  add(el: HTMLElement, opts: { position: T.Vector3; scale: number; rotationY?: number }): T.Object3D;
  render(camera: T.PerspectiveCamera, w: number, h: number): void;
}

export function createCss3d(): Css3dLayer {
  const dom = byId('css3d');
  const cam = byId('css3dCam');
  const objs: { el: HTMLElement; o: T.Object3D }[] = [];
  const e = (v: number) => (Math.abs(v) < 1e-10 ? 0 : v);
  const camMatrix = (m: T.Matrix4) => {
    const a = m.elements;
    return `matrix3d(${e(a[0])},${e(-a[1])},${e(a[2])},${e(a[3])},${e(a[4])},${e(-a[5])},${e(a[6])},${e(a[7])},${e(a[8])},${e(-a[9])},${e(a[10])},${e(a[11])},${e(a[12])},${e(-a[13])},${e(a[14])},${e(a[15])})`;
  };
  const objMatrix = (m: T.Matrix4) => {
    const a = m.elements;
    return `translate(-50%,-50%)matrix3d(${e(a[0])},${e(a[1])},${e(a[2])},${e(a[3])},${e(-a[4])},${e(-a[5])},${e(-a[6])},${e(-a[7])},${e(a[8])},${e(a[9])},${e(a[10])},${e(a[11])},${e(a[12])},${e(a[13])},${e(a[14])},${e(a[15])})`;
  };
  function add(el: HTMLElement, { position, scale, rotationY = 0 }: { position: T.Vector3; scale: number; rotationY?: number }) {
    el.classList.add('css3d-obj');
    const o = new T.Object3D();
    o.position.copy(position);
    o.rotation.y = rotationY;
    o.scale.setScalar(scale);
    o.updateMatrixWorld(true);
    el.style.transform = objMatrix(o.matrixWorld);
    cam.appendChild(el);
    objs.push({ el, o });
    return o;
  }
  function render(camera: T.PerspectiveCamera, w: number, h: number) {
    if (!objs.length) return;
    const fov = camera.projectionMatrix.elements[5] * h * 0.5;
    dom.style.perspective = `${fov}px`;
    cam.style.transform = `translateZ(${fov}px)${camMatrix(camera.matrixWorldInverse)}translate(${w * 0.5}px,${h * 0.5}px)`;
  }
  return { add, render };
}
