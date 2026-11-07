import * as T from 'three';
import type { Scene } from '../../i18n/ui';
import { audio } from '../audio';
import { byId } from '../dom';
import { FINE, REDUCE } from '../env';
import { argNow, CLOCK_NEXT, realMinutes, SCENE_HOUR, sceneFor } from '../schedule';
import { setMode } from '../scene';
import { emit, state } from '../state';
import type { CameraRig } from './camera';
import { setStatic } from './figure';
import type { Diorama } from './types';

/**
 * Pointer on the canvas (mundo view only): drag to orbit with inertia, wheel and pinch to zoom,
 * hover and tap on Franco (static, ring, label, `app:talk`). The clock and the TV hook in with
 * their scenes (plan, Fase 5).
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
  /** Franco under the pointer. */
  readonly hovered: boolean;
  /** Something with a static outline is hot (the snow texture keeps redrawing). */
  readonly anyHot: boolean;
  locked(): boolean;
  setHover(on: boolean): void;
  setClockHover(on: boolean): void;
  hitFranco(clientX: number, clientY: number): boolean;
  hitClock(clientX: number, clientY: number): boolean;
}

export function bindInput(core: InputCore): WorldInput {
  const { canvas, camera, rig, dioramas } = core;
  const { orbit, view } = rig;
  const cursor = byId('cursor');
  const label = byId('francoLabel');
  const drag = { active: false, id: -1, sx: 0, sy: 0, lx: 0, ly: 0, moved: false, lastT: 0, v: 0 };
  const pointers = new Map<number, { x: number; y: number }>();
  let pinch0 = 0;
  let zoom0 = 1;
  let hovered = false;
  const raycaster = new T.Raycaster();
  const ndc = new T.Vector2();
  const locked = () => state.busy || state.panelOpen || !core.interactive();

  function aim(clientX: number, clientY: number): void {
    const r = canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
  }
  function hitMesh(m: T.Object3D | null | undefined, clientX: number, clientY: number): boolean {
    if (!m) return false;
    aim(clientX, clientY);
    return raycaster.intersectObject(m, false).length > 0;
  }
  const hitFranco = (x: number, y: number) => hitMesh(dioramas[state.scene].franco.hit, x, y);
  const hitClock = (x: number, y: number) => hitMesh(dioramas[state.scene].clock?.hit, x, y);

  let clockHot = false;
  let clockBusy = false;
  function setClockHover(on: boolean): void {
    if (clockHot === on) return;
    clockHot = on;
    dioramas[state.scene].clock?.setHot(on);
    cursor.classList.toggle('is-hot', on);
    canvas.classList.toggle('cur-location', on);
    if (!FINE) canvas.style.cursor = on ? 'pointer' : '';
    if (on) audio.tick();
  }
  // Tap: the hands spin to the next scene's hour, then the scene changes (home → office 9:00 → university 16:00 → home 21:00).
  async function clockTap(): Promise<void> {
    const clock = dioramas[state.scene].clock;
    if (!clock || clockBusy || state.busy) return;
    clockBusy = true;
    audio.tick();
    const next = CLOCK_NEXT[state.scene];
    // The scene the schedule picks right now shows the real time again, the others their signature hour.
    const isNow = next === sceneFor(argNow());
    await clock.spinTo(isNow ? realMinutes() : SCENE_HOUR[next] * 60);
    clockBusy = false;
    setClockHover(false);
    setMode(isNow ? 'auto' : next);
  }

  function setHover(on: boolean): void {
    if (hovered === on) return;
    hovered = on;
    if (FINE) setStatic(dioramas[state.scene].franco, on);
    label.classList.toggle('is-hot', on);
    cursor.classList.toggle('is-hot', on);
    canvas.classList.toggle('cur-person', on);
    if (!FINE) canvas.style.cursor = on ? 'pointer' : '';
    if (on) audio.tick();
  }

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
    if (e.pointerType === 'mouse' && !locked()) {
      const onClock = hitClock(e.clientX, e.clientY);
      setClockHover(onClock);
      setHover(!onClock && hitFranco(e.clientX, e.clientY));
    }
  });
  const endDrag = (e: PointerEvent, cancelled: boolean) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch0 = 0;
    if (!drag.active || e.pointerId !== drag.id) return;
    drag.active = false;
    cursor.classList.remove('is-grabbing');
    canvas.classList.remove('cur-move');
    if (drag.moved) {
      orbit.vAz = REDUCE ? 0 : drag.v;
      return;
    }
    if (cancelled || locked()) return;
    if (hitClock(e.clientX, e.clientY)) {
      void clockTap();
      return;
    }
    if (hitFranco(e.clientX, e.clientY)) {
      if (e.pointerType !== 'mouse') {
        setHover(true);
        setTimeout(() => setHover(false), 900);
      }
      emit('app:talk', 'world');
    }
  };
  canvas.addEventListener('pointerup', (e) => endDrag(e, false));
  canvas.addEventListener('pointercancel', (e) => endDrag(e, true));
  canvas.addEventListener('pointerleave', () => {
    if (!drag.active) {
      setHover(false);
      setClockHover(false);
    }
  });
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
    get hovered() {
      return hovered;
    },
    get anyHot() {
      return clockHot;
    },
    locked,
    setHover,
    setClockHover,
    hitFranco,
    hitClock,
  };
}
