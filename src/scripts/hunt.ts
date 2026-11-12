import { audio } from './audio';
import { $$, byId } from './dom';
import { t } from './i18n';
import { closePanel } from './panel';
import { advanceQuote, currentQuote } from './quotes';
import { router } from './router';
import { worldLoaded } from './stage';
import { HUNT_TOTAL, on, state } from './state';
import { world } from './world/handle';

/**
 * Ticket hunt (plan, Fase 8): five tickets hidden around the site (`.tk` slots: the gate, the
 * landing, the world object the loop projects every frame, the projects grid, the about photo).
 * Hovering a hiding spot slides a bit of the ticket out; clicking it collects it, with the
 * chime and the full-screen toast. Progress lives in localStorage. With every ticket found, the
 * world shows the surprise: the visitor's quote (src/scripts/quotes.ts) on the screen of the
 * current scene, the prize line under it and a piano track while it stays on screen.
 */
const HUNT_KEY = 'fs-tickets';
const TOTAL = HUNT_TOTAL;

/**
 * The terms page opens in this same tab. Its link leaves a mark in sessionStorage; when the
 * visitor comes back and the page loads from scratch (no bfcache), the gate enters on its own
 * and the surprise plays again. The mark expires so a much later visit starts normally.
 */
const RESUME_KEY = 'fs-resume-surprise';
const RESUME_TTL = 30 * 60e3;
let resumeAudio: boolean | null = null;

function takeResumeMark(): boolean | null {
  try {
    const raw = sessionStorage.getItem(RESUME_KEY);
    sessionStorage.removeItem(RESUME_KEY);
    if (!raw) return null;
    const mark = JSON.parse(raw) as { at?: unknown; audio?: unknown };
    if (typeof mark.at !== 'number' || Date.now() - mark.at > RESUME_TTL) return null;
    return mark.audio === true;
  } catch {
    return null;
  }
}

/** Audio choice to enter with when the surprise must resume (back from the terms page), or null. */
export const pendingResume = (): boolean | null => resumeAudio;

function loadFound(): Set<string> {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(HUNT_KEY) ?? '[]'));
  } catch {
    return new Set();
  }
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Piano under the surprise ("Gymnopedie No 1", Kevin MacLeod, CC BY 4.0): created on first use,
 * faded in while the quote is on the screens and faded out when the screens recover.
 */
const PIANO_SRC = '/musica/gymnopedie-no-1.mp3';
const PIANO_VOL = 0.7;
let piano: HTMLAudioElement | null = null;
let pianoRamp = 0;
function rampPiano(to: number, ms: number, done?: () => void): void {
  if (!piano) return;
  clearInterval(pianoRamp);
  const from = piano.volume;
  const t0 = performance.now();
  pianoRamp = window.setInterval(() => {
    if (!piano) return;
    const k = Math.min(1, (performance.now() - t0) / ms);
    piano.volume = from + (to - from) * k;
    if (k >= 1) {
      clearInterval(pianoRamp);
      done?.();
    }
  }, 50);
}
function startPiano(): void {
  if (!piano) {
    piano = new Audio(PIANO_SRC);
    piano.loop = true;
    piano.preload = 'none';
  }
  piano.volume = 0;
  void piano.play().catch(() => {
    /* autoplay blocked: the surprise plays silent */
  });
  rampPiano(PIANO_VOL, 1500);
}
function stopPiano(): void {
  if (!piano || piano.paused) return;
  rampPiano(0, 800, () => {
    if (!piano) return;
    piano.pause();
    piano.currentTime = 0;
  });
}

const ticketSvg = (n: number) => `<svg viewBox="0 0 400 190" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="tkBigG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e5383b"/><stop offset="1" stop-color="#b3141c"/></linearGradient>
      <mask id="tkBigM"><rect width="400" height="190" fill="#fff"/><circle cx="0" cy="95" r="16"/><circle cx="400" cy="95" r="16"/></mask>
    </defs>
    <g mask="url(#tkBigM)">
      <rect width="400" height="190" rx="10" fill="url(#tkBigG)"/>
      <rect x="12" y="12" width="376" height="166" rx="6" fill="none" stroke="#ffd9d0" stroke-opacity=".55" stroke-width="1.5" stroke-dasharray="5 4"/>
      <line x1="300" y1="14" x2="300" y2="176" stroke="#7a0b10" stroke-width="2" stroke-dasharray="2 6" stroke-linecap="round"/>
    </g>
    <g fill="#fff3ee" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, monospace">
      <text x="156" y="76" font-size="15" letter-spacing="6" opacity=".9">${t.hunt.ticketFound}</text>
      <text x="156" y="132" font-size="50" font-weight="800" letter-spacing="4">${t.hunt.ticket}</text>
      <text x="350" y="58" font-size="10" letter-spacing="2" opacity=".75">${t.hunt.ticketNo}</text>
      <text x="350" y="108" font-size="34" font-weight="800">${pad(n)}</text>
      <text x="350" y="134" font-size="13" font-weight="800" letter-spacing="2">/ ${pad(TOTAL)}</text>
    </g>
  </svg>`;

export function initHunt(): void {
  const found = loadFound(); // storage blocked: progress lasts this visit only
  const mark = takeResumeMark();
  if (mark !== null && found.size >= TOTAL) resumeAudio = mark;
  const save = () => {
    try {
      localStorage.setItem(HUNT_KEY, JSON.stringify([...found]));
    } catch {
      /* ignore */
    }
  };
  const tab = byId<HTMLButtonElement>('huntTab');
  const pnl = byId('huntPanel');
  const toast = byId('tkToast');
  const back = byId<HTMLButtonElement>('surpriseBack');
  const hud = byId('surpriseHud');
  const inSurprise = () => document.body.classList.contains('surprise-view');

  function paint(): void {
    const n = found.size;
    byId('huntCount').textContent = t.hunt.count(n, TOTAL);
    $$('#huntPips li').forEach((li, i) => li.classList.toggle('is-found', i < n));
    byId('huntReset').hidden = n === 0;
    byId('huntShow').hidden = n < TOTAL;
  }
  function announce(n: number): void {
    byId('tkToastTicket').innerHTML = ticketSvg(n);
    byId('tkToastMsg').textContent = n >= TOTAL ? t.hunt.foundAll : t.hunt.found(n, TOTAL);
    // Restart the entrance animation on consecutive finds.
    toast.classList.remove('is-on');
    void toast.offsetWidth;
    toast.classList.add('is-on');
  }
  // The found ticket stays on screen until a click lands outside it.
  const closeToast = () => {
    toast.classList.remove('is-on');
    // Fallback mode shows the quote in the toast itself: closing it ends the surprise.
    if (!world) clearScreens();
  };
  toast.addEventListener('click', (e) => {
    if (!(e.target instanceof Element) || !e.target.closest('.tk-toast-ticket')) {
      closeToast();
      if (finalePending) void showSurprise();
    }
  });

  // Surprise: go to the world and frame the screen of the current scene (monitor, projector or TV).
  let finalePending = false;
  let onScreens = false;
  // The quote leaves the screens (and the piano stops) once the viewing is over: "back", a page
  // change, a scene change or closing a chat opened over it. "Ver sorpresa" brings it back.
  function clearScreens(): void {
    if (!onScreens) return;
    onScreens = false;
    stopPiano();
    world?.endSurprise();
  }
  function endSurpriseView(unfocus = true): void {
    if (!inSurprise()) return;
    document.body.classList.remove('surprise-view');
    hud.hidden = true;
    if (unfocus) {
      world?.unfocus();
      clearScreens();
    }
  }
  on('app:panelclose', clearScreens);
  async function showSurprise(): Promise<void> {
    finalePending = false;
    closeToast();
    setOpen(false);
    if (state.page !== 'mundo') await router.go('mundo');
    else if (state.panelOpen) closePanel();
    if (state.page !== 'mundo') return;
    // The world builds on the first visit to mundo: wait for that before framing the shot.
    await worldLoaded();
    const quote = currentQuote();
    if (!world) {
      // No 3D (fallback / lite): show the quote in the announcement instead.
      byId('tkToastMsg').textContent = `${quote.text} — ${quote.source}`;
      toast.classList.add('is-on');
      onScreens = true;
      startPiano();
      return;
    }
    if (state.page !== 'mundo' || state.panelOpen) return;
    document.body.classList.add('surprise-view');
    hud.hidden = false;
    onScreens = true;
    startPiano();
    // The quote, the prize line and the terms link stay until the visitor leaves (back, Escape,
    // another page or scene): the screenshot needs them on screen.
    await world.surprise(quote);
  }
  back.addEventListener('click', () => {
    audio.tick();
    endSurpriseView();
  });
  byId('surpriseTerms').addEventListener('click', () => {
    try {
      sessionStorage.setItem(RESUME_KEY, JSON.stringify({ at: Date.now(), audio: state.audio }));
    } catch {
      /* storage blocked: coming back shows the gate as usual */
    }
  });
  // Restored from the bfcache: the surprise is still on screen, the mark is not needed.
  addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    try {
      sessionStorage.removeItem(RESUME_KEY);
    } catch {
      /* ignore */
    }
  });
  // Back from the terms page: the gate entered on its own; once inicio is up, replay the surprise.
  if (resumeAudio !== null) {
    on('app:enter', () => {
      resumeAudio = null;
      setTimeout(() => void showSurprise(), 500);
    });
  }
  on('app:pageswap', (e) => {
    if (e.detail !== 'mundo') endSurpriseView();
  });
  // Another diorama shows: the shot framed the old one, so the view ends and the screens recover.
  on('app:scene', () => endSurpriseView());
  // Opening the chat re-frames the camera on its own: just drop the surprise UI.
  on('app:talk', () => endSurpriseView(false));
  byId('huntShow').addEventListener('click', () => {
    audio.tick();
    void showSurprise();
  });

  for (const slot of $$('.tk')) {
    const id = slot.dataset.tk ?? '';
    // Visible hints that point at this hiding spot leave together with the ticket.
    const hints = $$(`[data-tk-hint="${id}"]`);
    if (found.has(id)) {
      slot.remove();
      for (const hint of hints) hint.remove();
      continue;
    }
    slot.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (found.has(id)) return;
      found.add(id);
      save();
      paint();
      // A ticket can have more than one hiding spot (the gate one also hides on the about page).
      for (const node of [...$$(`.tk[data-tk="${id}"]`), ...hints]) {
        node.classList.add('is-taken');
        setTimeout(() => node.remove(), 320);
      }
      audio.chime();
      announce(found.size);
      if (found.size >= TOTAL) {
        finalePending = true;
        setTimeout(() => {
          if (finalePending) void showSurprise();
        }, 2600);
      }
    });
  }

  const setOpen = (open: boolean) => {
    pnl.hidden = !open;
    tab.setAttribute('aria-expanded', String(open));
  };
  tab.addEventListener('click', () => {
    audio.tick();
    setOpen(pnl.hidden);
  });
  document.addEventListener('pointerdown', (e) => {
    if (!pnl.hidden && !(e.target instanceof Element && e.target.closest('#hunt'))) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (toast.classList.contains('is-on')) {
      closeToast();
      if (finalePending) void showSurprise();
      return;
    }
    if (inSurprise() && !state.panelOpen) {
      endSurpriseView();
      return;
    }
    if (!pnl.hidden) {
      setOpen(false);
      tab.focus();
    }
  });
  byId('huntReset').addEventListener('click', () => {
    found.clear();
    save();
    // Every restart moves to the next quote of this visitor's order.
    advanceQuote();
    location.reload();
  });
  paint();
}
