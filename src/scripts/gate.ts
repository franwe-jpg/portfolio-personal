import { gsap } from 'gsap';
import { busyCursor } from './cursor';
import { byId } from './dom';
import { REDUCE } from './env';
import { heroIntro } from './hero';
import { router } from './router';
import { emit, state } from './state';

/**
 * Entrance gate, skeleton version: the paper gate appears at once and the
 * enter buttons run the "efecto sumergible" into inicio. The particle logo,
 * the real loading bar and the audio unlock arrive in Fase 2; keep the same
 * entry points (`requestEnter`, `doEnter`) so that phase only fills them in.
 */
const PAPER = '#e7eaee';
const DARK = '#0e1013';

function setThemeColor(color: string): void {
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', color);
}

function reveal(): void {
  document.body.classList.add('entered');
  byId('gate').hidden = true;
  byId('mute').hidden = true;
  byId('loadtxt').style.opacity = '0';
  byId('loadbar').style.opacity = '0';
  setThemeColor(DARK);
  emit('app:enter');
  // First entry always lands on inicio; the hash only matters for back/forward afterwards.
  void router.go('inicio', { instant: true, replace: true });
  byId('heroTitle').focus({ preventScroll: true });
}

function doEnter(withAudio: boolean): void {
  if (state.entered) return;
  state.entered = true;
  state.audio = withAudio;
  byId('audioBtn').setAttribute('aria-pressed', String(withAudio));
  document.body.classList.add('leaving');
  const enterBtn = byId('enter');
  if (enterBtn.hasAttribute('aria-busy')) busyCursor.end();
  enterBtn.removeAttribute('aria-busy');
  const gate = byId('gate');
  const mute = byId('mute');
  const blackout = byId('blackout');
  const copy = byId('gateCopy');

  if (REDUCE) {
    gsap.to([gate, mute], { opacity: 0, duration: 0.25, ease: 'none' });
    gsap.set(blackout, { opacity: 1, delay: 0.25 });
    gsap.delayedCall(0.3, () => {
      reveal();
      heroIntro();
      gsap.to(blackout, { opacity: 0, duration: 0.3, ease: 'none' });
    });
    return;
  }
  // Everything on the gate vanishes together, fast; the page then appears behind a short blackout.
  const tl = gsap.timeline();
  tl.to([copy, mute, byId('loadtxt'), byId('loadbar')], { opacity: 0, duration: 0.2, ease: 'power2.in' }, 0)
    .to(blackout, { opacity: 1, duration: 0.35, ease: 'power2.in' }, 0.55)
    .add(() => {
      reveal();
      heroIntro();
    }, 0.9)
    .to(blackout, { opacity: 0, duration: 1.0, ease: 'expo.out' }, 0.9);
}

export function requestEnter(withAudio: boolean): void {
  if (state.entered) return;
  doEnter(withAudio);
}

export function initGate(): void {
  // Nothing to download yet: the bar reads as done from the start.
  byId('bar').style.transform = 'scaleX(1)';
  byId('loadbar').classList.add('is-done');
  byId('loadbar').style.opacity = '0';
  byId('loadtxt').textContent = '';
  requestAnimationFrame(() => {
    document.body.classList.add('booted');
    if (!state.entered) setThemeColor(PAPER);
  });
  byId('enter').addEventListener('click', () => requestEnter(true));
  byId('mute').addEventListener('click', () => requestEnter(false));
}
