import { audio } from './audio';
import { $$, byId } from './dom';
import { t } from './i18n';
import { closePanel, openPanel } from './panel';
import { router } from './router';
import { worldLoaded } from './stage';
import { HUNT_TOTAL, on, state } from './state';
import { world } from './world/handle';

/**
 * Ticket hunt (plan, Fase 8): five tickets hidden around the site (`.tk` slots: the gate, the
 * landing, the world object the loop projects every frame, the projects grid, the about photo).
 * Hovering a hiding spot slides a bit of the ticket out; clicking it collects it, with the
 * chime and the full-screen toast. Progress lives in localStorage. With every ticket found, the
 * world shows the surprise: the phrase on the screen of the current scene, then the chat opens.
 */
const HUNT_KEY = 'fs-tickets';
const TOTAL = HUNT_TOTAL;

function loadFound(): Set<string> {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(HUNT_KEY) ?? '[]'));
  } catch {
    return new Set();
  }
}

const pad = (n: number) => String(n).padStart(2, '0');

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
  const closeToast = () => toast.classList.remove('is-on');
  toast.addEventListener('click', (e) => {
    if (!(e.target instanceof Element) || !e.target.closest('.tk-toast-ticket')) {
      closeToast();
      if (finalePending) void showSurprise();
    }
  });

  // Surprise: go to the world and frame the screen of the current scene (monitor, projector or TV).
  let finalePending = false;
  let surpriseRun = 0;
  let onScreens = false;
  // The phrase leaves the screens once the viewing is over: "back", a page change, a scene change
  // or closing the chat that the viewing opened. "Ver sorpresa" in the ticket panel brings it back.
  function clearScreens(): void {
    if (!onScreens) return;
    onScreens = false;
    world?.endSurprise();
  }
  function endSurpriseView(unfocus = true): void {
    if (!inSurprise()) return;
    document.body.classList.remove('surprise-view');
    back.hidden = true;
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
    if (!world) {
      // No 3D (fallback / lite): show the phrase in the announcement instead.
      byId('tkToastMsg').textContent = t.hunt.surprise;
      toast.classList.add('is-on');
      return;
    }
    if (state.page !== 'mundo' || state.panelOpen) return;
    const run = ++surpriseRun;
    document.body.classList.add('surprise-view');
    back.hidden = false;
    onScreens = true;
    await world.surprise();
    // Still watching (no "back", no page change, chat not opened by hand): bring in the chat.
    if (run !== surpriseRun || !inSurprise() || state.page !== 'mundo' || state.panelOpen) return;
    endSurpriseView(false);
    void openPanel();
  }
  back.addEventListener('click', () => {
    audio.tick();
    endSurpriseView();
  });
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
    if (found.has(id)) {
      slot.remove();
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
      for (const node of $$(`.tk[data-tk="${id}"]`)) {
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
    location.reload();
  });
  paint();
}

export const huntApi = { key: HUNT_KEY, total: TOTAL };
