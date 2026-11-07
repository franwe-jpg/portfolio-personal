import { gsap } from 'gsap';
import * as T from 'three';
import { byId } from '../dom';
import { REDUCE } from '../env';
import { t } from '../i18n';
import { HUNT_TOTAL, SCENES, state } from '../state';
import type { CameraRig } from './camera';
import { MONO } from './config';
import type { SceneLights } from './lights';
import type { PovControl } from './pov';
import { canvasTex, type CanvasTex } from './textures';
import type { Dioramas } from './types';

/**
 * Ticket-hunt surprise (plan, Fase 8): once every ticket is found, the phrase is put on the
 * screen Franco is looking at in each scene (`SUR` textures, swapped in by each diorama's
 * `surprise(on)`), the camera cuts to the scene's `shot` (square on the screen, darker room,
 * slow push-in) and the phrase types itself out. `endSurprise` gives the screens back their
 * usual content. The phrase is `t.hunt.surprise`; the signature is Franco's panel name.
 */
const PHRASE = t.hunt.surprise;
const SIGNATURE = `— ${t.panel.who.franco}`;
const UP = new T.Vector3(0, 1, 0);
const W = 640;
const H = 360;

/** The screen textures: `main` (office code monitor, home TV), `uni` (projection screen, left-aligned), `side` (office second monitor). */
export const SUR = {
  main: canvasTex(W, H, () => {}),
  uni: canvasTex(W, H, () => {}),
  side: canvasTex(W, H, () => {}),
};

function wrapLines(c: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const w of text.split(' ')) {
    const next = line ? `${line} ${w}` : w;
    if (line && c.measureText(next).width > maxW) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** `shown` = how many characters of the phrase are typed so far. */
function drawPhrase(target: CanvasTex, shown: number, { left = false } = {}): void {
  const c = target.ctx;
  const g = c.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, W * 0.7);
  g.addColorStop(0, '#1f2630');
  g.addColorStop(1, '#0b0d10');
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  c.fillStyle = 'rgba(255,255,255,.035)';
  for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 1);
  const x = left ? 48 : W / 2;
  c.textAlign = left ? 'left' : 'center';
  c.textBaseline = 'middle';
  c.font = `600 15px ${MONO}`;
  c.fillStyle = '#ff5a5f';
  c.fillText(t.hunt.screenHeader(HUNT_TOTAL), x, 50);
  const size = left ? 31 : 36;
  const lh = left ? 40 : 46;
  c.font = `500 ${size}px "Instrument Sans", system-ui, sans-serif`;
  c.fillStyle = '#f3f5f7';
  const lines = wrapLines(c, PHRASE, left ? 350 : W - 120);
  const y0 = H / 2 + 4 - ((lines.length - 1) * lh) / 2;
  let rem = shown;
  let caret: { x: number; y: number } | null = null;
  for (const [i, l] of lines.entries()) {
    const part = l.slice(0, Math.max(0, rem));
    if (part) c.fillText(part, x, y0 + i * lh);
    if (!caret && part.length < l.length) {
      const wPart = c.measureText(part).width;
      caret = { x: left ? x + wPart : x + wPart / 2 + (part ? 3 : 0), y: y0 + i * lh };
    }
    rem -= l.length + 1;
  }
  if (caret) {
    c.fillStyle = '#ff5a5f';
    c.fillRect(caret.x + 2, caret.y - size / 2, 3, size);
  } else {
    c.font = `400 13px ${MONO}`;
    c.fillStyle = '#8a94a3';
    c.fillText(SIGNATURE, x, H - 42);
  }
  target.tex.needsUpdate = true;
}

/** Draws the phrase typed up to the fraction `k` on the main and university textures. */
export function drawSurprise(k = 1): void {
  const n = Math.round(PHRASE.length * k);
  drawPhrase(SUR.main, n);
  drawPhrase(SUR.uni, n, { left: true });
}

/** Second monitor (office): the found ticket, big. */
export function drawSideTicket(): void {
  const c = SUR.side.ctx;
  c.fillStyle = '#0b0d10';
  c.fillRect(0, 0, W, H);
  const tx = 110;
  const ty = 85;
  const tw = 420;
  const th = 190;
  c.fillStyle = '#c8222a';
  c.beginPath();
  if (c.roundRect) c.roundRect(tx, ty, tw, th, 12);
  else c.rect(tx, ty, tw, th);
  c.fill();
  c.fillStyle = '#0b0d10';
  for (const x of [tx, tx + tw]) {
    c.beginPath();
    c.arc(x, ty + th / 2, 18, 0, Math.PI * 2);
    c.fill();
  }
  c.strokeStyle = 'rgba(255,217,208,.55)';
  c.setLineDash([6, 5]);
  c.lineWidth = 1.5;
  c.strokeRect(tx + 14, ty + 14, tw - 28, th - 28);
  c.strokeStyle = '#7a0b10';
  c.setLineDash([2, 7]);
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(tx + 320, ty + 16);
  c.lineTo(tx + 320, ty + th - 16);
  c.stroke();
  c.setLineDash([]);
  c.fillStyle = '#fff3ee';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.font = `500 15px ${MONO}`;
  c.fillText(t.hunt.ticketFound, tx + 160, ty + 70);
  c.font = `800 50px ${MONO}`;
  c.fillText(t.hunt.ticket, tx + 160, ty + 122);
  const total = String(HUNT_TOTAL).padStart(2, '0');
  c.font = `800 36px ${MONO}`;
  c.fillText(total, tx + 370, ty + 88);
  c.font = `800 14px ${MONO}`;
  c.fillText(`/ ${total}`, tx + 370, ty + 122);
  SUR.side.tex.needsUpdate = true;
}

let surTyping = false;
drawSurprise();
drawSideTicket();
document.fonts?.ready.then(() => {
  drawSideTicket();
  if (!surTyping) drawSurprise();
});

export interface SurpriseCore {
  cam: CameraRig;
  lights: SceneLights;
  dioramas: Dioramas;
  pov: PovControl;
  setLabel(on: boolean): void;
  setHover(on: boolean): void;
}

export interface SurpriseControl {
  /** Phrase on every screen, special shot on the current scene; resolves when the "clip" has ended. */
  surprise(): Promise<void>;
  /** Screens back to what they were showing. */
  endSurprise(): void;
}

export function createSurprise(core: SurpriseCore): SurpriseControl {
  const { cam, dioramas, setLabel, setHover } = core;
  const { hemi, sun, focus } = core.lights;
  const { blendPov, setOnTop, shotPush } = core.pov;
  const { pov } = cam;
  let surRun = 0;

  /** Square on the screen of the current scene, darker room, slow push-in for `hold` s. */
  function surpriseShot(hold: number): number {
    cam.cam.focused = true;
    const d = dioramas[state.scene];
    const sh = d.shot;
    setLabel(false);
    setHover(false);
    d.onFocus?.(true);
    setOnTop(sh?.onTop ? sh.mesh : null);
    if (!sh) return 0;
    const tgt = sh.mesh.getWorldPosition(new T.Vector3());
    const nrm = new T.Vector3(0, 0, 1).applyQuaternion(sh.mesh.getWorldQuaternion(new T.Quaternion())).applyAxisAngle(UP, sh.yaw ?? 0);
    const at = (k: number) => tgt.clone().addScaledVector(nrm, k).addScaledVector(UP, sh.lift ?? 0);
    const dur = REDUCE ? 0 : 1.6;
    shotPush.k = sh.dist * (REDUCE ? 1 : 1.35);
    blendPov(at(shotPush.k), tgt, 40, dur, 'power3.inOut');
    if (!REDUCE) {
      gsap.to(shotPush, {
        k: sh.dist,
        delay: dur,
        duration: hold,
        ease: 'sine.inOut',
        onUpdate: () => {
          pov.pos.copy(at(shotPush.k));
        },
      });
    }
    gsap.killTweensOf([hemi, sun, focus]);
    gsap.to(hemi, { intensity: d.light.hemi * 0.4, duration: dur, ease: 'power2.inOut' });
    gsap.to(sun, { intensity: d.light.sun * 0.4, duration: dur, ease: 'power2.inOut' });
    gsap.to(focus, { intensity: 0, duration: dur, ease: 'power2.inOut' });
    const fv = byId('focusVig');
    fv.style.setProperty('--fx', '50%');
    fv.style.setProperty('--fy', '50%');
    gsap.to(fv, { opacity: 0.9, duration: dur, ease: 'power2.inOut' });
    return dur;
  }

  function surprise(): Promise<void> {
    for (const k of SCENES) dioramas[k].surprise?.(true);
    const typeDur = PHRASE.length * 0.055;
    const tail = 2.2;
    const lead = surpriseShot(typeDur + tail);
    const run = ++surRun;
    return new Promise((resolve) => {
      if (REDUCE) {
        drawSurprise(1);
        setTimeout(resolve, 2500);
        return;
      }
      const st = { k: 0 };
      let last = -1;
      surTyping = true;
      drawSurprise(0);
      gsap.to(st, {
        k: 1,
        delay: lead,
        duration: typeDur,
        ease: 'none',
        onUpdate: () => {
          if (run !== surRun) return;
          const n = Math.round(st.k * PHRASE.length);
          if (n !== last) {
            last = n;
            drawSurprise(st.k);
          }
        },
        onComplete: () => {
          if (run === surRun) {
            surTyping = false;
            drawSurprise(1);
          }
          setTimeout(resolve, tail * 1000);
        },
      });
    });
  }

  function endSurprise(): void {
    surRun++;
    surTyping = false;
    for (const k of SCENES) dioramas[k].surprise?.(false);
  }

  return { surprise, endSurprise };
}
