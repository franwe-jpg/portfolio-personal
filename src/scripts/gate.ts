import { gsap } from 'gsap';
import { audio } from './audio';
import { busyCursor } from './cursor';
import { byId } from './dom';
import { COARSE, REDUCE } from './env';
import { heroIntro } from './hero';
import { t } from './i18n';
import { loader, onProgressLabel, renderProgress, startLoading } from './loader';
import { createParticles, type Particles } from './particles';
import { router } from './router';
import { emit, state } from './state';

/**
 * Entrance gate: the particle mark boots, the loader fills the bar, and the
 * enter buttons run the "efecto sumergible" into inicio. Entering before the
 * loader is done marks the button busy and enters as soon as it finishes.
 * `app:enter` is the signal the rest of the app listens to.
 */
const PAPER = '#e7eaee';
const DARK = '#0e1013';

let particles: Particles | null = null;
let pending: { audio: boolean } | null = null;

function setThemeColor(color: string): void {
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', color);
}

function reveal(): void {
  document.body.classList.add('entered');
  byId('gate').hidden = true;
  byId('mute').hidden = true;
  particles?.stop();
  byId('loadtxt').style.opacity = '0';
  byId('loadbar').style.opacity = '0';
  setThemeColor(DARK);
  emit('app:enter');
  // First entry always lands on inicio; the hash only matters for back/forward afterwards.
  void router.go('inicio', { instant: true, replace: true });
  byId('heroTitle').focus({ preventScroll: true });
}

function doEnter(): void {
  if (state.entered || !pending) return;
  state.entered = true;
  document.body.classList.add('leaving');
  const enterBtn = byId('enter');
  if (enterBtn.hasAttribute('aria-busy')) busyCursor.end();
  enterBtn.removeAttribute('aria-busy');
  audio.set(pending.audio);
  const gate = byId('gate');
  const mute = byId('mute');
  const blackout = byId('blackout');
  const copy = byId('gateCopy');
  particles?.leave();

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
  // Everything on the gate vanishes together, fast, so the particle burst is the only thing left on screen;
  // the page then appears behind a short blackout.
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
  // Inside the click handler: this is the only place audio may be unlocked.
  if (withAudio) audio.unlock();
  // iOS 13+: the gyroscope only reports after a permission granted from a tap.
  const orientation = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
  if (COARSE && typeof orientation.requestPermission === 'function') {
    orientation.requestPermission().catch(() => {});
  }
  pending = { audio: withAudio };
  if (loader.state === 'ready' || loader.state === 'failed') {
    doEnter();
    return;
  }
  byId('enter').setAttribute('aria-busy', 'true');
  busyCursor.begin('working');
  renderProgress();
}

/** Tab icon: while the visitor is on another tab, the icon becomes the green eye, half closed, looking back at them. */
function initTabIcon(): void {
  // Both icon links (the .ico fallback and the SVG) swap, whichever one the browser picked.
  const links = [...document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]')].map((link) => ({ link, home: link.href }));
  if (!links.length) return;
  const eye =
    'data:image/svg+xml,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
        `<circle cx="32" cy="32" r="32" fill="#1fbf75"/>` +
        `<clipPath id="o"><rect x="0" y="20" width="64" height="24"/></clipPath>` +
        `<g clip-path="url(#o)"><circle cx="32" cy="32" r="30" fill="#fff"/>` +
        `<circle cx="24" cy="31" r="14" fill="#10120d"/><circle cx="19" cy="26" r="4" fill="#fff"/></g>` +
        `<clipPath id="c"><circle cx="32" cy="32" r="32"/></clipPath>` +
        `<g clip-path="url(#c)"><rect x="0" y="18.5" width="64" height="2" fill="rgba(16,18,13,.55)"/><rect x="0" y="43.5" width="64" height="2" fill="rgba(16,18,13,.55)"/></g>` +
        `</svg>`,
    );
  document.addEventListener('visibilitychange', () => {
    for (const { link, home } of links) link.href = document.hidden ? eye : home;
  });
}

export function initGate(): void {
  initTabIcon();
  const enterTxt = byId('enterTxt');
  onProgressLabel((pct, loading) => {
    if (pending) enterTxt.textContent = loading ? t.loader.enterLoading(pct) : t.gate.enter;
  });
  particles = createParticles();
  // The rest of the gate (paper background, name, buttons) appears only once the cap is solid.
  void particles.booted.then(() => {
    document.body.classList.add('booted');
    if (!state.entered) setThemeColor(PAPER);
  });
  // Start loading only after the gate has painted its first particle frame.
  void particles.firstPaint.then(() => {
    const go = () => {
      void startLoading().then(() => {
        if (pending) doEnter();
      });
    };
    if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 500 });
    else setTimeout(go, 60);
  });
  byId('enter').addEventListener('click', () => requestEnter(true));
  byId('mute').addEventListener('click', () => requestEnter(false));
}
