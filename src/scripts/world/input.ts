import type * as T from 'three';
import type { Scene } from '../../i18n/ui';
import { byId } from '../dom';
import { REDUCE } from '../env';
import { state } from '../state';
import type { CameraRig } from './camera';
import type { Diorama } from './types';

/**
 * Pointer on the canvas (mundo view only): drag to orbit with inertia, wheel and pinch to zoom.
 * Hover and taps on Franco, the clock and the TV come with their tasks (plan, Fases 4–6).
 */
export interface InputCore {
  canvas: HTMLCanvasElement;
  camera: T.PerspectiveCamera;
  rig: CameraRig;
  dioramas: Record<Scene, Diorama>;
  interactive(): boolean;
}

export interface WorldInput {
  readonly dragging: boolean;
  locked(): boolean;
}

export function bindInput(core: InputCore): WorldInput {
  const { canvas, rig } = core;
  const { orbit, view } = rig;
  const cursor = byId('cursor');
  const drag = { active: false, id: -1, sx: 0, sy: 0, lx: 0, ly: 0, moved: false, lastT: 0, v: 0 };
  const pointers = new Map<number, { x: number; y: number }>();
  let pinch0 = 0;
  let zoom0 = 1;
  const locked = () => state.busy || state.panelOpen || !core.interactive();

  canvas.addEventListener('pointerdown', (e) => {
    if (locked()) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, c] = [...pointers.values()];
      pinch0 = Math.hypot(a.x - c.x, a.y - c.y);
      zoom0 = view.userZoom;
      drag.active = false;
      return;
    }
    Object.assign(drag, {
      active: true,
      id: e.pointerId,
      sx: e.clientX,
      sy: e.clientY,
      lx: e.clientX,
      ly: e.clientY,
      moved: false,
      lastT: performance.now(),
      v: 0,
    });
    orbit.vAz = 0;
    if (e.pointerType === 'mouse') {
      canvas.setPointerCapture(e.pointerId);
      cursor.classList.add('is-grabbing');
      canvas.classList.add('cur-move');
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2 && pinch0) {
      const [a, c] = [...pointers.values()];
      view.userZoom = Math.max(0.75, Math.min(1.8, (zoom0 * Math.hypot(a.x - c.x, a.y - c.y)) / pinch0));
      return;
    }
    if (drag.active && e.pointerId === drag.id) {
      const dx = e.clientX - drag.lx;
      const dy = e.clientY - drag.ly;
      if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6) drag.moved = true;
      if (drag.moved) {
        const now = performance.now();
        const k = 0.0042;
        orbit.goalAz -= dx * k;
        drag.v = ((-dx * k) / Math.max(1, now - drag.lastT)) * 16;
        drag.lastT = now;
        if (e.pointerType === 'mouse') orbit.goalEl = Math.max(-0.12, Math.min(0.16, orbit.goalEl + dy * 0.0025));
      }
      drag.lx = e.clientX;
      drag.ly = e.clientY;
      return;
    }
  });
  const endDrag = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch0 = 0;
    if (!drag.active || e.pointerId !== drag.id) return;
    drag.active = false;
    cursor.classList.remove('is-grabbing');
    canvas.classList.remove('cur-move');
    if (drag.moved) orbit.vAz = REDUCE ? 0 : drag.v;
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('pointerenter', () => {
    if (core.interactive()) cursor.classList.add('is-grab');
  });
  canvas.addEventListener('pointerout', () => cursor.classList.remove('is-grab'));
  // The wheel zooms (plain, Ctrl/⌘ and trackpad pinch alike): nothing scrolls on this page.
  canvas.addEventListener(
    'wheel',
    (e) => {
      if (locked()) return;
      e.preventDefault();
      view.userZoom = Math.max(0.75, Math.min(1.8, view.userZoom * Math.exp(-e.deltaY * 0.0025)));
    },
    { passive: false },
  );

  return {
    get dragging() {
      return drag.active;
    },
    locked,
  };
}
