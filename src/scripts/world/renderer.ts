import * as T from 'three';
import { byId } from '../dom';
import { FOV, MOBILE } from './config';

/** WebGL renderer, scene, fog and the perspective camera of the isometric rig. */
export interface Stage {
  canvas: HTMLCanvasElement;
  stage: HTMLElement;
  renderer: T.WebGLRenderer;
  scene: T.Scene;
  fog: T.Fog;
  camera: T.PerspectiveCamera;
}

export function createStage(): Stage {
  const canvas = byId<HTMLCanvasElement>('world-canvas');
  const stage = byId('stage3d');
  // Transparent clear: the glyph field canvas underneath shows around the diorama.
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  if (!renderer.getContext()) throw new Error('no context');
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, MOBILE ? 1.5 : 2));
  renderer.setClearColor(0x0e1013, 0);
  renderer.shadowMap.enabled = !MOBILE;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  stage.classList.add('has-3d');

  const scene = new T.Scene();
  const fog = new T.Fog(0x0e1013, 40, 74);
  scene.fog = fog;
  const camera = new T.PerspectiveCamera(FOV, 1, 0.1, 400);
  return { canvas, stage, renderer, scene, fog, camera };
}
