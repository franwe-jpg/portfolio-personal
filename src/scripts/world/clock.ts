import { gsap } from 'gsap';
import * as T from 'three';
import { COARSE, REDUCE } from '../env';
import { clockMinutes } from '../schedule';
import { state } from '../state';
import { mat } from './materials';
import { mesh } from './primitives';
import { canvasTex, staticOutline } from './textures';

/**
 * Wall clock (faces +z, `ry` turns it to another wall): white face with black numerals and
 * hands, a ring of orbiting white particles that invites the tap, a static outline on hover,
 * and a spin that carries the hands to another hour.
 */
export interface Clock {
  group: T.Group;
  /** Invisible disc around the face: the tap target. */
  hit: T.Mesh;
  update(t: number): void;
  /** Spins the hands forward to `target` (minutes since midnight); resolves when they land. */
  spinTo(target: number): Promise<void>;
  setHot(on: boolean): void;
}

interface Seed {
  a: number;
  r: number;
  v: number;
  p: number;
}

export function makeClock(root: T.Object3D, x: number, y: number, z: number, ry = 0): Clock {
  const g = new T.Group();
  g.position.set(x, y, z);
  g.rotation.y = ry;
  root.add(g);
  const R = 0.34;
  const rim = mesh(new T.CylinderGeometry(R + 0.035, R + 0.035, 0.06, 36), mat.black, g, 0, 0, -0.03);
  rim.rotation.x = Math.PI / 2;
  const faceTex = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = '#f6f7f9';
    c.fillRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const r = w / 2;
    c.strokeStyle = '#15181d';
    c.lineCap = 'round';
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const big = i % 5 === 0;
      c.lineWidth = big ? 4 : 1.5;
      c.beginPath();
      c.moveTo(cx + Math.sin(a) * (r - 6), cy - Math.cos(a) * (r - 6));
      c.lineTo(cx + Math.sin(a) * (r - (big ? 20 : 13)), cy - Math.cos(a) * (r - (big ? 20 : 13)));
      c.stroke();
    }
    c.fillStyle = '#15181d';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = '700 32px "Instrument Sans", system-ui, sans-serif';
    for (let n = 1; n <= 12; n++) {
      const a = (n / 12) * Math.PI * 2;
      c.fillText(String(n), cx + Math.sin(a) * (r - 44), cy - Math.cos(a) * (r - 44) + 2);
    }
  });
  const face = mesh(
    new T.CircleGeometry(R, 36),
    new T.MeshStandardMaterial({
      map: faceTex.tex,
      emissive: 0xffffff,
      emissiveMap: faceTex.tex,
      emissiveIntensity: 0.32,
      roughness: 0.6,
      flatShading: false,
    }),
    g,
    0,
    0,
    0.002,
  );
  face.castShadow = false;
  const hand = (len: number, w: number, zz: number) => {
    const geo = new T.BoxGeometry(w, len, 0.01);
    geo.translate(0, len / 2 - 0.05, 0);
    const m = mesh(geo, mat.black, g, 0, 0, zz);
    m.receiveShadow = false;
    return m;
  };
  const hour = hand(0.19, 0.032, 0.02);
  const minute = hand(0.27, 0.024, 0.032);
  const second = hand(0.29, 0.009, 0.044);
  mesh(new T.CylinderGeometry(0.022, 0.022, 0.06, 10), mat.black, g, 0, 0, 0.03).rotation.x = Math.PI / 2;
  const hit = mesh(new T.CircleGeometry(R + 0.22, 16), mat.signal, g, 0, 0, 0.06);
  hit.visible = false;
  // Static ring right against the rim (rim radius R + 0.035), no gap.
  const ringGeo = new T.RingGeometry(R + 0.035, R + 0.095, 48);
  {
    // One noise tile per scene unit, like the TV frame.
    const uv = ringGeo.attributes.uv;
    const d = (R + 0.095) * 2;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * d, uv.getY(i) * d);
  }
  const outline = staticOutline(g, ringGeo, 0.03);
  // Particles: a loose ring in the wall plane, each one pulsing; the burst pushes them outwards.
  const N = COARSE ? 40 : 64;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const seed: Seed[] = [];
  for (let i = 0; i < N; i++) {
    seed.push({
      a: Math.random() * Math.PI * 2,
      r: R + 0.14 + Math.random() * 0.2,
      v: (0.2 + Math.random() * 0.45) * (Math.random() < 0.5 ? -1 : 1),
      p: Math.random() * Math.PI * 2,
    });
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(pos, 3));
  geo.setAttribute('color', new T.BufferAttribute(col, 3));
  const pts = new T.Points(
    geo,
    new T.PointsMaterial({
      size: 0.09,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: T.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
  pts.frustumCulled = false;
  g.add(pts);
  const anim: { spin: { m: number } | null; burst: number; hot: number } = { spin: null, burst: 0, hot: 0 };

  function update(t: number): void {
    const m = anim.spin ? anim.spin.m : clockMinutes(state.mode);
    hour.rotation.z = -(m / 720) * Math.PI * 2;
    minute.rotation.z = -((m % 60) / 60) * Math.PI * 2;
    second.rotation.z = -(((m * 60) % 60) / 60) * Math.PI * 2;
    if (REDUCE && anim.hot === 0 && anim.burst === 0 && t > 1) return;
    for (let i = 0; i < N; i++) {
      const sd = seed[i];
      const a = sd.a + t * sd.v;
      const r = sd.r * (1 + anim.burst * 1.8);
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = Math.sin(a) * r;
      pos[i * 3 + 2] = 0.07 + Math.sin(t * 2 + sd.p) * 0.03;
      const tw = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2.6 + sd.p));
      const k = tw * (1 - anim.burst * 0.75) * (1.1 + anim.hot * 0.6);
      col[i * 3] = 0.9 * k;
      col[i * 3 + 1] = 0.93 * k;
      col[i * 3 + 2] = 1.0 * k;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
  }

  // Spin the hands forward to `target`: at least a third of a turn of the hour hand, so the move
  // always reads as a jump to another moment of the day.
  function spinTo(target: number): Promise<void> {
    const from = anim.spin ? anim.spin.m : clockMinutes(state.mode);
    let delta = (((target - from) % 720) + 720) % 720;
    if (delta < 240) delta += 720;
    anim.spin = { m: from };
    if (REDUCE) {
      anim.spin = null;
      return Promise.resolve();
    }
    gsap.to(anim, {
      burst: 1,
      duration: 0.45,
      ease: 'expo.out',
      onComplete: () => {
        gsap.to(anim, { burst: 0, duration: 0.7, ease: 'power2.inOut' });
      },
    });
    return new Promise((resolve) =>
      gsap.to(anim.spin, {
        m: from + delta,
        duration: 1.15,
        ease: 'power3.inOut',
        onComplete: () => {
          anim.spin = null;
          resolve();
        },
      }),
    );
  }

  function setHot(on: boolean): void {
    if (!REDUCE) {
      gsap.to(anim, { hot: on ? 1 : 0, duration: 0.3, overwrite: true });
      gsap.to(outline.material, { opacity: on ? 1 : 0, duration: 0.15, overwrite: true });
    } else {
      anim.hot = on ? 1 : 0;
      outline.material.opacity = on ? 1 : 0;
    }
  }

  return { group: g, hit, update, spinTo, setHot };
}
