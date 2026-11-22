import * as T from 'three';
import { audio } from '../audio';
import { byId } from '../dom';
import { FINE, REDUCE } from '../env';
import { argNow, CLOCK_NEXT, realMinutes, SCENE_HOUR, sceneFor } from '../schedule';
import { setMode } from '../scene';
import { emit, state } from '../state';
import type { CameraRig } from './camera';
import { SCENE_X } from './config';
import { setStatic } from './figure';
import type { Dioramas } from './types';

/**
 * Pointer on the canvas (mundo view only): drag to orbit with inertia (sideways) and tilt (up and
 * down), wheel and pinch to zoom, two fingers also slide the view and twist it,
 * hover and tap on Franco (static, ring, label, `app:talk`), the wall clock (hover outline, tap
 * spins to the next scene) and the living-room TV (hover border, tap opens the video, the bar
 * above sets the volume).
 */
export interface InputCore {
  canvas: HTMLCanvasElement;
  camera: T.PerspectiveCamera;
  rig: CameraRig;
  dioramas: Dioramas;
  interactive(): boolean;
}

export type TvPart = 'screen' | 'bar' | null;

export interface WorldInput {
  readonly dragging: boolean;
  /** Franco under the pointer. */
  readonly hovered: boolean;
  /** Something with a static outline is hot (the snow texture keeps redrawing). */
  readonly anyHot: boolean;
  locked(): boolean;
  setHover(on: boolean): void;
  setClockHover(on: boolean): void;
  /** `part` is 'screen' (a tap opens the video), 'bar' (precision cursor) or null. */
  setTvHover(part: TvPart): void;
  hitFranco(clientX: number, clientY: number): boolean;
  hitClock(clientX: number, clientY: number): boolean;
}

export function bindInput(core: InputCore): WorldInput {
  const { canvas, camera, rig, dioramas } = core;
  const { orbit, view, pan } = rig;
  const cursor = byId('cursor');
  const label = byId('francoLabel');
  const drag = { active: false, id: -1, sx: 0, sy: 0, lx: 0, ly: 0, moved: false, lastT: 0, v: 0 };
  const pointers = new Map<number, { x: number; y: number }>();
  let pinch0 = 0;
  let zoom0 = 1;
  /** Two-finger gesture, previous sample: midpoint (slide) and angle (twist). */
  const two = { mx: 0, my: 0, ang: 0, twist: 0, az0: 0 };
  const _right = new T.Vector3();
  const _up = new T.Vector3();
  let hovered = false;
  const raycaster = new T.Raycaster();
  const ndc = new T.Vector2();
  const locked = () => state.busy || state.panelOpen || !core.interactive();
  /** The surprise view: the canvas takes no taps (TV, clock, Franco); only its buttons leave it. */
  const inSurprise = () => document.body.classList.contains('surprise-view');

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

  const tvUi = () => (state.scene === 'home' ? dioramas.home.tv : null);
  let tvHot = false;
  /** Pointer dragging the volume bar, or -1. Only that pointer moves the volume and ends the drag. */
  let volId = -1;
  const _barPlane = new T.Plane(new T.Vector3(0, 0, 1), 0);
  const _barPt = new T.Vector3();
  function setTvHover(part: TvPart): void {
    const on = !!part;
    canvas.classList.toggle('cur-link', part === 'screen');
    canvas.classList.toggle('cur-precision', part === 'bar');
    if (tvHot === on) return;
    tvHot = on;
    tvUi()?.setHot(on);
    cursor.classList.toggle('is-hot', on);
    if (!FINE) canvas.style.cursor = on ? 'pointer' : '';
    if (on) audio.tick();
  }
  /**
   * A finger grabs the bar from this far (CSS px): on a phone the bar projects to a strip a few
   * pixels tall, which a fingertip misses, and the touch then starts an orbit drag instead.
   */
  const BAR_SLOP = 22;
  const _barA = new T.Vector3();
  const _barB = new T.Vector3();
  function hitBar(tv: NonNullable<ReturnType<typeof tvUi>>, clientX: number, clientY: number, touch: boolean): boolean {
    if (hitMesh(tv.bar.hit, clientX, clientY)) return true;
    // The screen and the clock keep their own taps.
    if (!touch || hitMesh(tv.hit, clientX, clientY) || hitClock(clientX, clientY)) return false;
    const r = canvas.getBoundingClientRect();
    tv.bar.hit.getWorldPosition(_barA);
    _barB.copy(_barA);
    _barA.x -= tv.bar.w / 2;
    _barB.x += tv.bar.w / 2;
    _barA.project(camera);
    _barB.project(camera);
    const ax = r.left + (_barA.x * 0.5 + 0.5) * r.width;
    const ay = r.top + (-_barA.y * 0.5 + 0.5) * r.height;
    const dx = (_barB.x - _barA.x) * 0.5 * r.width;
    const dy = -(_barB.y - _barA.y) * 0.5 * r.height;
    const k = Math.max(0, Math.min(1, ((clientX - ax) * dx + (clientY - ay) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(clientX - ax - dx * k, clientY - ay - dy * k) <= BAR_SLOP;
  }
  function volumeFromPointer(clientX: number, clientY: number): void {
    const bar = tvUi()?.bar;
    if (!bar) return;
    aim(clientX, clientY);
    _barPlane.constant = -bar.z;
    if (!raycaster.ray.intersectPlane(_barPlane, _barPt)) return;
    bar.set((_barPt.x - SCENE_X.home - bar.x0) / bar.w);
  }

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

  /**
   * Two fingers: the midpoint slides the look-at point so the map follows the fingers (screen
   * axes, at the target's depth), and turning the fingers past a small dead zone twists the
   * orbit. The twist maps from the gesture's start, not per event: each finger reports on its own,
   * so the angle swings back and forth between events and an incremental dead zone would drift.
   * The loop clamps the slide (`clampPan`).
   */
  function twoFinger(a: { x: number; y: number }, c: { x: number; y: number }): void {
    const mx = (a.x + c.x) / 2;
    const my = (a.y + c.y) / 2;
    const dist = view.dist / (rig.rig.zoom * view.userZoom);
    const perPx = (2 * dist * Math.tan((camera.fov * Math.PI) / 360)) / view.h;
    _right.setFromMatrixColumn(camera.matrixWorld, 0);
    _up.setFromMatrixColumn(camera.matrixWorld, 1);
    const dx = (mx - two.mx) * perPx;
    const dy = (my - two.my) * perPx;
    pan.gx += -_right.x * dx + _up.x * dy;
    pan.gy += -_right.y * dx + _up.y * dy;
    pan.gz += -_right.z * dx + _up.z * dy;
    two.mx = mx;
    two.my = my;
    const ang = Math.atan2(c.y - a.y, c.x - a.x);
    let d = ang - two.ang;
    if (d > Math.PI) d -= Math.PI * 2;
    else if (d < -Math.PI) d += Math.PI * 2;
    two.ang = ang;
    two.twist += d;
    const TWIST_DEAD = 0.12;
    orbit.goalAz = two.az0 + Math.sign(two.twist) * Math.max(0, Math.abs(two.twist) - TWIST_DEAD);
  }
  canvas.addEventListener('pointerdown', (e) => {
    if (locked()) return;
    // A primary pointer starts a new gesture with no other finger down: drop any pointer whose
    // up/cancel never arrived, or every later tap would count as the second finger of a pinch.
    if (e.isPrimary) pointers.clear();
    const tv = inSurprise() ? null : tvUi();
    // Only a lone finger grabs the bar: a second finger landing near it belongs to a pinch.
    if (tv && volId < 0 && pointers.size === 0 && hitBar(tv, e.clientX, e.clientY, e.pointerType !== 'mouse')) {
      volId = e.pointerId;
      canvas.setPointerCapture(e.pointerId);
      volumeFromPointer(e.clientX, e.clientY);
      audio.tick();
      return;
    }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, c] = [...pointers.values()];
      pinch0 = Math.hypot(a.x - c.x, a.y - c.y);
      zoom0 = view.userZoom;
      Object.assign(two, { mx: (a.x + c.x) / 2, my: (a.y + c.y) / 2, ang: Math.atan2(c.y - a.y, c.x - a.x), twist: 0, az0: orbit.goalAz });
      drag.active = false;
      orbit.vAz = 0;
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
    if (e.pointerId === volId) {
      volumeFromPointer(e.clientX, e.clientY);
      return;
    }
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2 && pinch0) {
      const [a, c] = [...pointers.values()];
      view.userZoom = Math.max(0.75, Math.min(1.8, (zoom0 * Math.hypot(a.x - c.x, a.y - c.y)) / pinch0));
      twoFinger(a, c);
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
        orbit.goalEl = Math.max(-0.12, Math.min(0.16, orbit.goalEl + dy * 0.0025));
      }
      drag.lx = e.clientX;
      drag.ly = e.clientY;
      return;
    }
    if (e.pointerType === 'mouse' && !locked() && !inSurprise()) {
      const onClock = hitClock(e.clientX, e.clientY);
      const tv = tvUi();
      const tvPartNow: TvPart =
        onClock || !tv
          ? null
          : hitMesh(tv.bar.hit, e.clientX, e.clientY)
            ? 'bar'
            : hitMesh(tv.hit, e.clientX, e.clientY)
              ? 'screen'
              : null;
      setClockHover(onClock);
      setTvHover(tvPartNow);
      setHover(!onClock && !tvPartNow && hitFranco(e.clientX, e.clientY));
    }
  });
  const endDrag = (e: PointerEvent, cancelled: boolean) => {
    if (e.pointerId === volId) {
      volId = -1;
      return;
    }
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
    if (cancelled || locked() || inSurprise()) return;
    if (hitClock(e.clientX, e.clientY)) {
      void clockTap();
      return;
    }
    const tv = tvUi();
    if (tv && hitMesh(tv.hit, e.clientX, e.clientY)) {
      audio.tick();
      window.open(tv.url, '_blank', 'noopener');
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
      setTvHover(null);
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
      return clockHot || tvHot;
    },
    locked,
    setHover,
    setClockHover,
    setTvHover,
    hitFranco,
    hitClock,
  };
}
