import { gsap } from 'gsap';
import * as T from 'three';
import { REDUCE } from '../../env';
import { t as ui } from '../../i18n';
import { state } from '../../state';
import { Batch } from '../batch';
import { makeClock } from '../clock';
import { FPS6, SCENE_X } from '../config';
import type { Css3dLayer } from '../css3d';
import { makeFranco } from '../figure';
import { floorGlow, windowGlow, windowLight } from '../lights';
import { mat } from '../materials';
import { makeCat, makeDog, type Pet } from '../pets';
import { mesh, PUFF, toWorld, unitCyl } from '../primitives';
import { bookcase, classChair, mug, plant, roundTable, rug, sofa, tv, tvUnit } from '../props';
import { createTvBands } from '../screens';
import { SUR } from '../surprise';
import { canvasTex, frameGeometry, staticOutline } from '../textures';
import type { Diorama } from '../types';
import { base } from '../walls';

/** The living-room TV as the pointer sees it: screen (a tap opens the video), volume bar, hover outline. */
export interface TvUi {
  hit: T.Mesh;
  url: string;
  bar: {
    hit: T.Mesh;
    set(v: number): void;
    get(): number;
    /** Bar geometry in scene-local units, for the drag. */
    x0: number;
    w: number;
    z: number;
  };
  setHot(on: boolean): void;
}

export interface HomeDiorama extends Diorama {
  tv: TvUi;
}

const TV_VIDEO = 'Y3FEZJz55T0';
const TV_ORIGIN = 'https://www.youtube-nocookie.com';
const TV_URL = `https://www.youtube.com/watch?v=${TV_VIDEO}`;

/**
 * Home diorama: living room facing the back wall, where the TV plays a YouTube video (the
 * official player on the CSS3D layer, colour bands underneath as fallback) with a draggable
 * volume bar above it; Franco's sofa in front with his back to the camera, L sofa on the left,
 * armchair on the right, dining corner, floor lamp, moon in the window, the black poodle, the
 * white cat on the sofa back, the black cat eating by the left wall, and the wall clock.
 */
export function home(scene: T.Scene, css3d: Css3dLayer): HomeDiorama {
  const root = new T.Group();
  root.position.x = SCENE_X.home;
  scene.add(root);
  const b = new Batch(root);
  base(root, b, { wallLeftOpen: { a: -1.6, b: 0.6, y0: 1.0, y1: 2.5 }, night: true });
  rug(b, 0.2, -2.9, 4.6, 3.0, mat.rug2);
  // TV unit against the back wall; a white console lying at its right end, round black grille on top.
  tvUnit(b, 0, -4.5, 3.4);
  b.box(1.3, 0.54, -4.5, 0.3, 0.065, 0.16, mat.catW);
  b.cyl(1.38, 0.605, -4.5, 0.045, 0.006, mat.black, 16);
  const bands = createTvBands();
  // Reduced motion never mounts the player nor animates the bands: leave one still frame on the screen.
  if (REDUCE) bands.draw(0);
  const tvScreen = tv(b, 0, 1.19, -4.56, 1.86, 1.06, bands.tex.tex);
  root.add(tvScreen);
  // Tapping the screen opens the video on YouTube; on hover, a static border.
  const tvHit = mesh(new T.PlaneGeometry(1.9, 1.1), mat.signal, root, 0, 1.19, -4.5);
  tvHit.visible = false;
  const tvBox = new T.Group();
  tvBox.position.set(0, 1.19, -4.55);
  root.add(tvBox);
  // Static frame around the bezel (bezel is 1.90 x 1.10), no gap.
  const tvOutline = staticOutline(tvBox, frameGeometry(2.02, 1.22, 0.06), 0.03);
  const tvLight = new T.PointLight(0x7fb0ff, 0, 4.5, 1.4);
  tvLight.position.set(0, 1.3, -3.6);
  root.add(tvLight);
  // Franco's two-seat sofa faces -z; his cushion sits at x≈0, in line with the TV.
  const SZ = -1.3;
  sofa(b, 0.5, SZ, Math.PI / 2, 2.3, 2);
  // L sofa against the left side (faces +x) and a one-seat armchair on the right, turned to the TV.
  sofa(b, -2.4, -2.2, 0, 2.1, 2);
  sofa(b, 2.7, -2.7, (3 * Math.PI) / 4, 1.2, 1);
  // Side table with mate and thermos by the sofa's right arm.
  const tx = 2.05;
  const tz = -1.25;
  b.cyl(tx, 0, tz, 0.2, 0.03, mat.dark, 10);
  b.cyl(tx, 0.03, tz, 0.025, 0.5, mat.metal, 6);
  b.cyl(tx, 0.53, tz, 0.33, 0.04, mat.furnL, 12);
  b.cyl(tx - 0.08, 0.57, tz + 0.06, 0.06, 0.11, mat.pot, 9, 0.85);
  b.add(unitCyl(4), mat.pale, tx - 0.06, 0.71, tz + 0.06, 0.008, 0.16, 0.008, 0, 0, -0.25);
  b.cyl(tx + 0.13, 0.57, tz - 0.06, 0.06, 0.3, mat.metal, 10);
  b.cyl(tx + 0.13, 0.87, tz - 0.06, 0.045, 0.05, mat.dark, 10);
  // Floor lamp in the corner, between the L sofa and the TV.
  const lx = -2.5;
  const lz = -3.7;
  b.cyl(lx, 0, lz, 0.18, 0.03, mat.dark, 10);
  b.cyl(lx, 0.03, lz, 0.02, 1.45, mat.metal, 6);
  const shade = mesh(new T.CylinderGeometry(0.13, 0.24, 0.3, 10, 1, true), mat.shade, root, lx, 1.55, lz);
  shade.material.side = T.DoubleSide;
  const lamp = new T.PointLight(0xffc98a, 0, 7, 1.2);
  lamp.position.set(lx, 1.45, lz + 0.05);
  root.add(lamp);
  // Low shelf + plant on the right.
  b.box(3.9, 0, -1.5, 0.7, 0.9, 1.6, mat.furn);
  b.box(3.9, 0.9, -1.5, 0.74, 0.04, 1.64, mat.furnL);
  b.box(3.85, 0.94, -1.95, 0.24, 0.32, 0.18, mat.pale);
  b.box(3.85, 0.94, -1.7, 0.2, 0.24, 0.12, mat.trim);
  b.cyl(3.9, 0.94, -1.05, 0.14, 0.24, mat.pot, 7, 0.8);
  b.add(new T.IcosahedronGeometry(1, 0), mat.plant, 3.9, 1.38, -1.05, 0.24, 0.3, 0.24, 0.3, 0.2, 0);
  // Dining corner at the front right, bookcase on the left wall and a big plant.
  roundTable(b, 2.5, 2.4, 0.55);
  classChair(b, 3.25, 2.4, 0);
  classChair(b, 1.75, 2.4, Math.PI);
  mug(b, 2.35, 0.77, 2.2, mat.pale);
  b.cyl(2.65, 0.77, 2.55, 0.12, 0.05, mat.paper, 10, 0.8);
  b.box(2.4, 0.77, 2.65, 0.26, 0.015, 0.2, mat.plum, 0.3);
  bookcase(b, -4.78, 2.3, 0, 2.0, 3);
  plant(b, -3.9, 4.0, 1.1);
  // Slippers in front of the sofa and a book near the armchair.
  b.box(0.95, 0, -1.95, 0.12, 0.04, 0.26, mat.pot, 0.15);
  b.box(1.13, 0, -1.93, 0.12, 0.04, 0.26, mat.pot, -0.1);
  b.box(1.7, 0.02, -2.0, 0.22, 0.04, 0.3, mat.plum, 0.4);
  // Cat bowl by the left wall, under the window, on its little mat.
  b.box(-4.5, 0, 0.3, 0.4, 0.012, 0.5, mat.rug2);
  b.cyl(-4.6, 0.012, 0.3, 0.09, 0.045, mat.pale, 10, 0.8);
  b.add(PUFF, mat.pot, -4.6, 0.05, 0.3, 0.065, 0.02, 0.065, 0, 0, 0);
  b.flush();

  const franco = makeFranco('phone');
  franco.root.position.set(0, 0.52, SZ - 0.06);
  franco.root.rotation.y = Math.PI; // faces -z, towards the TV
  root.add(franco.root);
  franco.ring.position.y = -0.49;
  franco.ring.position.z = 0.3;
  const phoneLight = new T.PointLight(0x1fbf75, 0, 1.6, 1.2);
  phoneLight.position.set(0, 0.95, SZ - 0.5);
  root.add(phoneLight);
  // Pets: black poodle on the L sofa (left side) looking towards the TV, white cat with orange
  // patches high on the back of Franco's sofa, black cat eating from its bowl by the left wall.
  const pets: Pet[] = [];
  const dog = makeDog();
  dog.root.position.set(-2.34, 0.48, -1.71);
  dog.root.rotation.y = 2.3;
  root.add(dog.root);
  pets.push(dog);
  const catW = makeCat(mat.catW, 'sit', mat.catO);
  catW.root.position.set(-0.25, 1.0, SZ + 0.4);
  catW.root.rotation.y = 0.6;
  root.add(catW.root);
  pets.push(catW);
  const catB = makeCat(mat.catB, 'eat');
  catB.root.position.set(-4.27, 0, 0.3);
  catB.root.rotation.y = -Math.PI / 2;
  root.add(catB.root);
  pets.push(catB);

  // Window on the left wall: half the moon shows past the back edge of the frame (z=-1.6),
  // its halo only on the glass (the quad is the opening itself, with the moon at its right edge),
  // and a cool moonlight patch on the floor.
  const moon = mesh(new T.CircleGeometry(0.3, 28, Math.PI / 2, Math.PI), mat.moon, root, -4.77, 1.95, -1.6);
  moon.rotation.y = Math.PI / 2;
  moon.castShadow = false;
  windowGlow(root, -4.78, 1.75, -0.5, 2.2, 1.5, '170,196,240', 0.7, Math.PI / 2, [1, 0.37], 0.4);
  floorGlow(root, -3.6, -0.5, 2.4, 3.0, '150,182,238', 0.4);
  const moonIn = windowLight(root, 0xa9c0ee, [-7.4, 4.0, -0.9], [-2.4, 0, -0.3], 0.5);
  for (const [y, z] of [
    [1.4, -1.2],
    [2.3, -0.9],
    [1.75, -0.3],
    [2.35, 0.45],
  ]) {
    const s = mesh(new T.PlaneGeometry(0.025, 0.025), mat.moon, root, -4.77, y, z);
    s.rotation.y = Math.PI / 2;
    s.castShadow = false;
  }
  // TV volume bar above the screen: draggable; starts at the middle.
  const BAR_W = 1.7;
  const BAR_Y = 2.3;
  const BAR_Z = -4.76;
  mesh(new T.BoxGeometry(BAR_W + 0.06, 0.07, 0.025), mat.dark, root, 0, BAR_Y, BAR_Z - 0.01).castShadow = false;
  const barFill = mesh(new T.BoxGeometry(1, 0.035, 0.02), mat.catW, root, 0, BAR_Y, BAR_Z);
  barFill.castShadow = false;
  const barKnob = mesh(new T.BoxGeometry(0.05, 0.15, 0.04), mat.catW, root, 0, BAR_Y, BAR_Z + 0.01);
  barKnob.castShadow = false;
  const volIcon = canvasTex(128, 64, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#e7eaee';
    c.fillRect(18, 24, 12, 16);
    c.beginPath();
    c.moveTo(30, 24);
    c.lineTo(48, 10);
    c.lineTo(48, 54);
    c.lineTo(30, 40);
    c.closePath();
    c.fill();
    c.strokeStyle = '#e7eaee';
    c.lineWidth = 4;
    c.lineCap = 'round';
    for (const [r, a] of [
      [14, 0.7],
      [24, 0.6],
    ]) {
      c.beginPath();
      c.arc(52, 32, r, -a, a);
      c.stroke();
    }
  });
  const volMesh = new T.Mesh(
    new T.PlaneGeometry(0.32, 0.16),
    new T.MeshBasicMaterial({ map: volIcon.tex, transparent: true, toneMapped: false, depthWrite: false }),
  );
  volMesh.position.set(-BAR_W / 2 - 0.25, BAR_Y, BAR_Z);
  root.add(volMesh);
  const barHit = mesh(new T.BoxGeometry(BAR_W + 0.3, 0.36, 0.1), mat.signal, root, 0, BAR_Y, BAR_Z);
  barHit.visible = false;
  let tvVol = 0.5;
  // The TV plays a YouTube video: the official embedded player sits on the CSS3D layer right over
  // the screen plane (muted, looping, no controls). Underneath, the colour-band canvas stays as
  // fallback while the iframe has not loaded or if it is blocked.
  let tvSurprise = false;
  let tvActive = false;
  let tvEl: HTMLDivElement | null = null;
  let tvFrame: HTMLIFrameElement | null = null;
  const tvCmd = (func: string, args: unknown[] = []) =>
    tvFrame?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), TV_ORIGIN);
  function setVolume(v: number): void {
    tvVol = Math.max(0, Math.min(1, v));
    barFill.scale.x = Math.max(0.001, tvVol * BAR_W);
    barFill.position.x = -BAR_W / 2 + (tvVol * BAR_W) / 2;
    barKnob.position.x = -BAR_W / 2 + tvVol * BAR_W;
    tvCmd('unMute');
    tvCmd('setVolume', [Math.round(tvVol * 100)]);
  }
  setVolume(tvVol);
  const bar: TvUi['bar'] = { hit: barHit, set: setVolume, get: () => tvVol, x0: -BAR_W / 2, w: BAR_W, z: BAR_Z };
  function mountTv(): void {
    if (tvEl || REDUCE) return;
    tvEl = document.createElement('div');
    // 930x530 CSS px scaled to the 1.86x1.06 screen: sharp even in the POV close-up.
    tvEl.style.width = '930px';
    tvEl.style.height = '530px';
    tvFrame = document.createElement('iframe');
    tvFrame.title = ui.mundo.tvTitle;
    // Scenery, not a control: it must not be a Tab stop (the stage is aria-hidden anyway).
    tvFrame.tabIndex = -1;
    tvFrame.allow = 'autoplay; encrypted-media; picture-in-picture';
    tvFrame.referrerPolicy = 'strict-origin-when-cross-origin';
    tvFrame.src = `${TV_ORIGIN}/embed/${TV_VIDEO}?autoplay=1&mute=1&loop=1&playlist=${TV_VIDEO}&controls=0&rel=0&playsinline=1&iv_load_policy=3&disablekb=1&enablejsapi=1`;
    // Once the player is up, hand it the bar's volume (the embed itself loads muted so it can autoplay).
    // During the surprise the player stays paused and muted (the piano plays instead).
    tvFrame.addEventListener('load', () =>
      setTimeout(() => {
        if (tvSurprise) {
          tvCmd('pauseVideo');
          tvCmd('mute');
          return;
        }
        tvCmd('playVideo');
        setVolume(tvVol);
      }, 900),
    );
    tvEl.appendChild(tvFrame);
    css3d.add(tvEl, { position: toWorld(root, 0, 1.19, -4.56 + 0.03), scale: 1.86 / 930 });
  }
  // Plays only with the diorama active and the world in view; paused, a still frame remains.
  function onActive(on: boolean): void {
    tvActive = on;
    if (on) {
      mountTv();
      if (tvEl) {
        tvEl.style.display = tvSurprise ? 'none' : '';
        if (tvSurprise) {
          tvCmd('pauseVideo');
          tvCmd('mute');
        } else tvCmd('playVideo');
      }
    } else if (tvEl) {
      tvCmd('pauseVideo');
      tvEl.style.display = 'none';
    }
  }
  let tvLast = -1;
  // Back wall, halfway between the TV and the right end of the wall.
  const clock = makeClock(root, 3.0, 2.4, -4.77);
  // POV: the centre of the TV screen, straight ahead of Franco.
  const pov = { target: toWorld(root, 0, 1.19, -4.56), back: new T.Vector3(0, 0, 1) };
  // The surprise covers the player and pauses it muted (the piano plays instead); off, the
  // player shows again with the bar's volume, and resumes only if this diorama is the active one.
  const surprise = (on: boolean) => {
    tvSurprise = on;
    if (tvEl) tvEl.style.display = on ? 'none' : '';
    if (on) {
      tvCmd('pauseVideo');
      tvCmd('mute');
    } else {
      setVolume(tvVol);
      if (tvActive) tvCmd('playVideo');
    }
    tvScreen.material.map = on ? SUR.main.tex : bands.tex.tex;
    tvScreen.material.needsUpdate = true;
  };
  // Surprise shot: the TV, straight on, between the sofa and the screen.
  const shot = { mesh: tvScreen, dist: 1.9, lift: 0.04 };
  // Hunt ticket: out of the TV's left edge.
  const tkSpot = new T.Vector3(-0.97, 1.12, -4.53);
  const tvUi: TvUi = {
    hit: tvHit,
    url: TV_URL,
    bar,
    setHot(on) {
      if (!REDUCE) gsap.to(tvOutline.material, { opacity: on ? 1 : 0, duration: 0.15, overwrite: true });
      else tvOutline.material.opacity = on ? 1 : 0;
    },
  };

  const update = (t: number) => {
    franco.update(t);
    for (const p of pets) p.update(t);
    if (REDUCE) return;
    const on = state.scene === 'home';
    phoneLight.intensity = (on ? 1.4 : 0) * (0.85 + Math.sin(t * 2.2) * 0.15);
    tvLight.intensity = (on ? 1.2 : 0) * (1 + Math.sin(t * 7.3) * 0.08 + Math.sin(t * 3.1) * 0.07);
    if (!tvSurprise && t - tvLast >= FPS6) {
      tvLast = t;
      bands.draw(t);
    }
  };
  return {
    root,
    franco,
    update,
    pov,
    onActive,
    surprise,
    shot,
    tkSpot,
    clock,
    tv: tvUi,
    lights: [
      [lamp, 5.5],
      [phoneLight, 1.4],
      [tvLight, 1.2],
      [moonIn, 60],
    ],
    light: { hemi: 1.35, sun: 1.3, sunColor: 0x9fb4d0 },
  };
}
