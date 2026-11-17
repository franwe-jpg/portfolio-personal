import type { Scene } from '../i18n/ui';
import { audio } from './audio';
import { askChat, HISTORY_TURNS, humanCheck, type Turn } from './chat';
import { sendContact } from './contact';
import { busyCursor } from './cursor';
import { $$, byId, el, wait } from './dom';
import { COARSE, REDUCE } from './env';
import { t } from './i18n';
import { router } from './router';
import { worldLoaded } from './stage';
import { emit, on, state } from './state';
import { mancha } from './transitions';
import { world } from './world/handle';

/**
 * Side panel over the world: AI chat in the office and the university (connected to /api/chat
 * through the Turnstile human check), direct contact at home (a WhatsApp link, or an email form
 * sent to /api/contact behind the same check). Opening it puts the world in the POV view; closing it, or leaving the page, undoes
 * that. On narrow screens it is a bottom sheet whose handle drags it down to a title bar (the close-up of
 * Franco stays on screen) and back up; the close button closes it.
 */
type PanelKind = 'chat' | 'contact';
const KIND_OF: Record<Scene, PanelKind> = { office: 'chat', uni: 'chat', home: 'contact' };
const MAX_Q = 500;
type ApiStatus = 'unknown' | 'live' | 'offline';
type MsgKind = 'franco' | 'me' | 'sys' | 'typing';

const chat = {
  history: [] as Turn[],
  api: 'unknown' as ApiStatus,
  kind: null as PanelKind | null,
  scene: null as Scene | null,
  waiting: false,
  /** A suggested question is being typed into the composer. */
  drafting: false,
  /** The visitor chose the AI chat in the home scene; reset once the scene changes. */
  aiHome: false,
};

/** The home scene is direct contact unless the visitor asked for the AI. */
const kindNow = (): PanelKind => (state.scene === 'home' && chat.aiHome ? 'chat' : KIND_OF[state.scene]);
let lastFocus: HTMLElement | null = null;

const panel = () => byId('panel');
const backdrop = () => byId('panelBackdrop');
const msgs = () => byId<HTMLOListElement>('msgs');
const chatForm = () => byId<HTMLFormElement>('chatForm');
const contactForm = () => byId<HTMLFormElement>('contactForm');
const q = () => byId<HTMLTextAreaElement>('q');

function setConn(api: ApiStatus): void {
  chat.api = api;
  const conn = byId('conn');
  conn.classList.toggle('is-live', api === 'live');
  conn.textContent = api === 'live' ? t.panel.live : api === 'offline' ? t.panel.offline : t.panel.checking;
}

function addMsg(kind: MsgKind, text: string, opts: { who?: string } = {}): HTMLLIElement {
  // appendChild, not append: the generated Cloudflare types merge HTMLRewriter's Element into the DOM one.
  const li = el('li', `msg ${kind}`);
  if (opts.who) li.appendChild(el('span', 'who', opts.who));
  li.appendChild(el('span', undefined, text));
  msgs().appendChild(li);
  const body = byId('panelBody');
  body.scrollTo({ top: body.scrollHeight, behavior: REDUCE ? 'auto' : 'smooth' });
  return li;
}

function seedPanel(): void {
  const scene = state.scene;
  if (scene !== 'home') chat.aiHome = false;
  const kind = kindNow();
  const copy = t.mundo.scenes[scene];
  byId('panelTitle').textContent = kind === 'chat' ? t.panel.title(copy.where) : t.panel.titleContact;
  const sub = byId('panelSub');
  sub.textContent = kind === 'chat' ? '' : t.panel.subContact;
  sub.hidden = kind === 'chat';
  byId('conn').hidden = true;
  chatForm().hidden = kind !== 'chat';
  contactForm().hidden = kind !== 'contact';
  byId('panelBack').hidden = !(kind === 'chat' && scene === 'home');
  if (chat.kind !== kind) {
    // A fresh conversation: the AI forgets what is no longer on screen.
    msgs().replaceChildren();
    chat.history = [];
    chat.kind = kind;
    chat.scene = null;
  }
  if (chat.scene !== scene) {
    const hello = kind === 'chat' && scene === 'home' ? t.panel.helloAiHome : copy.hello;
    addMsg('franco', hello, { who: kind === 'chat' ? t.panel.who.ai : t.panel.who.franco });
    chat.scene = scene;
  }
}

/** Contact mode starts on its channel choice (WhatsApp by default), chat mode on the composer. */
const firstField = () => (chatForm().hidden ? contactForm().querySelector<HTMLElement>('input[name="via"]:checked') : q());

export async function openPanel(): Promise<void> {
  if (!state.entered || state.panelOpen || state.busy) return;
  // The panel belongs to the world: switch to that page first if needed.
  const onWorld = () => state.page === 'mundo';
  if (!onWorld()) {
    await router.go('mundo');
    if (state.panelOpen || !onWorld()) return;
  }
  state.panelOpen = true;
  document.body.classList.add('panel-open');
  lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  audio.tick();
  seedPanel();
  // A token solves in the background while the visitor types the first question.
  if (kindNow() === 'chat') humanCheck.load();
  const delay = world ? world.focusOn() * 0.6 : 0;
  backdrop().hidden = false;
  panel().hidden = false;
  syncMarquee();
  byId('app').setAttribute('inert', '');
  setTimeout(() => {
    requestAnimationFrame(() => {
      backdrop().classList.add('is-open');
      panel().classList.add('is-open');
    });
    setTimeout(focusComposer, REDUCE ? 30 : 380);
  }, delay * 1000);
}

/**
 * Moves focus into the open dialog. On touch screens focusing the composer pops up the
 * keyboard, so focus lands on the close button and the keyboard waits for a tap on the field.
 */
function focusComposer(): void {
  if (COARSE) byId('panelClose').focus({ preventScroll: true });
  else firstField()?.focus({ preventScroll: true });
}

export function closePanel(): void {
  if (!state.panelOpen) return;
  state.panelOpen = false;
  document.body.classList.remove('panel-open');
  panel().classList.remove('is-open', 'is-min');
  backdrop().classList.remove('is-open', 'is-min');
  panel().style.transform = '';
  byId('app').removeAttribute('inert');
  world?.unfocus();
  emit('app:panelclose');
  setTimeout(
    () => {
      if (state.panelOpen) return;
      panel().hidden = true;
      backdrop().hidden = true;
    },
    REDUCE ? 220 : 400,
  );
  (lastFocus && document.contains(lastFocus) ? lastFocus : byId('talk')).focus({ preventScroll: true });
}

/** Keeps Tab inside the dialog; Escape closes it. */
function onKeydown(e: KeyboardEvent): void {
  if (!state.panelOpen) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    closePanel();
    return;
  }
  if (e.key !== 'Tab') return;
  const focusable = $$<HTMLElement>('button, [href], input, textarea, [tabindex]:not([tabindex="-1"])', panel()).filter(
    (node) => !(node as HTMLButtonElement).disabled && !node.closest('[hidden]') && node.offsetParent !== null,
  );
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

/** Height of the bar left on screen when the sheet is down: the handle and the title row with the close button. */
function peekHeight(): number {
  return byId('panelHandle').offsetHeight + panel().querySelector<HTMLElement>('.panel-head')!.offsetHeight;
}

const isMin = () => panel().classList.contains('is-min');

/**
 * Sheet down (mobile): only the title bar stays at the bottom, the camera keeps its close-up of Franco,
 * and the dimmed backdrop goes away. The bar comes back up with a tap or a drag; the close button still closes.
 */
function setMin(min: boolean): void {
  const sheet = panel();
  if (min) sheet.style.setProperty('--peek', `${peekHeight()}px`);
  sheet.classList.toggle('is-min', min);
  backdrop().classList.toggle('is-min', min);
  sheet.style.transform = '';
  // Down: the keyboard goes away with the composer's focus; focus stays in the dialog, on the close button.
  if (min) {
    byId('panelClose').focus({ preventScroll: true });
    return;
  }
  // Up: back to the composer, ready to keep chatting, once the sheet is up (focusing mid-slide held the slide back).
  setTimeout(() => {
    if (state.panelOpen && !isMin()) focusComposer();
  }, REDUCE ? 30 : 380);
}

/** Bottom sheet (mobile): drag the handle down to lower it to its title bar, up (or tap) to raise it again. */
function bindHandle(): void {
  const handle = byId('panelHandle');
  let y0: number | null = null;
  let dy = 0;
  let base = 0;
  let lowest = 0;
  handle.addEventListener('pointerdown', (e) => {
    y0 = e.clientY;
    dy = 0;
    lowest = panel().offsetHeight - peekHeight();
    base = isMin() ? lowest : 0;
    panel().classList.add('is-dragging');
    handle.setPointerCapture(e.pointerId);
  });
  handle.addEventListener('pointermove', (e) => {
    if (y0 === null) return;
    dy = e.clientY - y0;
    panel().style.transform = `translateY(${Math.min(lowest, Math.max(0, base + dy))}px)`;
  });
  const end = () => {
    if (y0 === null) return;
    y0 = null;
    panel().classList.remove('is-dragging');
    if (!isMin()) setMin(dy > 110);
    else setMin(!(dy < -60 || Math.abs(dy) < 6));
  };
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);
  // Lowered, the whole title bar raises the sheet (the close button keeps closing it).
  panel()
    .querySelector('.panel-head')!
    .addEventListener('click', (e) => {
      if (isMin() && !(e.target as HTMLElement).closest('#panelClose, #panelBack')) setMin(false);
    });
}

// ---------- chat ----------
function syncComposer(): void {
  const input = q();
  const len = input.value.trim().length;
  const count = byId('qCount');
  count.textContent = t.panel.composer.count(input.value.length, MAX_Q);
  count.classList.toggle('is-over', input.value.length >= MAX_Q);
  byId<HTMLButtonElement>('sendBtn').disabled = len < 1 || len > MAX_Q || chat.waiting;
  input.style.height = 'auto';
  input.style.height = `${Math.min(140, input.scrollHeight)}px`;
  input.style.overflowY = input.scrollHeight > 140 ? 'auto' : 'hidden';
}

async function ask(question: string): Promise<void> {
  chat.waiting = true;
  syncComposer();
  busyCursor.begin();
  addMsg('me', question, { who: t.panel.who.me });
  const typing = addMsg('typing', t.panel.typing);
  const token = await humanCheck.takeToken();
  const result = await askChat(question, chat.history, token);
  // Tokens are single-use: start solving the next one right away.
  humanCheck.renew();
  typing.remove();
  if (result.kind === 'answer') {
    setConn('live');
    addMsg('franco', result.answer, { who: t.panel.who.ai });
    chat.history.push({ question, answer: result.answer });
    chat.history = chat.history.slice(-HISTORY_TURNS);
  } else if (result.kind === 'offline') {
    setConn('offline');
    addMsg('sys', t.panel.errorNetwork);
  } else {
    addMsg('sys', result.message ?? t.panel.errorStatus(result.status));
  }
  audio.tick();
  chat.waiting = false;
  syncComposer();
  busyCursor.end();
}

function bindChat(): void {
  const input = q();
  input.addEventListener('input', syncComposer);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      chatForm().requestSubmit();
    }
  });
  chatForm().addEventListener('submit', (e) => {
    e.preventDefault();
    const question = input.value.trim();
    // A suggestion still being typed is not a question yet.
    if (!question || question.length > MAX_Q || chat.waiting || chat.drafting) return;
    input.value = '';
    syncComposer();
    void ask(question);
  });
}

// ---------- suggested questions: a moving strip above the composer, as in the first version ----------
/** Marquee speed, in pixels per second; kept constant however many chips are left. */
const SUGGESTION_SPEED = 40;
const TYPE_MS = 22;

const remainingSuggestions = () => $$<HTMLButtonElement>('.suggestion', byId('suggestionsTrack'));

function syncMarquee(): void {
  const track = byId('suggestionsTrack');
  const loop = track.scrollWidth / 2;
  if (loop > 0) track.style.setProperty('--suggestions-duration', `${Math.max(8, loop / SUGGESTION_SPEED)}s`);
}

/** Types the question into the composer; the visitor sends it (or edits it first). */
async function useSuggestion(chip: HTMLButtonElement): Promise<void> {
  if (chat.drafting) return;
  const question = chip.textContent?.trim() ?? '';
  if (!question) return;
  // A suggestion is offered once: drop both copies of the chip.
  for (const twin of remainingSuggestions()) {
    if (twin.dataset.suggestion === chip.dataset.suggestion) twin.remove();
  }
  if (!remainingSuggestions().length) byId('suggestions').hidden = true;
  else syncMarquee();
  const input = q();
  // On touch screens the keyboard only opens when the visitor taps the field itself.
  if (!COARSE) input.focus({ preventScroll: true });
  chat.drafting = true;
  if (REDUCE) {
    input.value = question;
  } else {
    // Paced by the clock, not by ticks: a busy main thread (the world renders behind) skips ahead instead of lagging.
    const start = performance.now();
    let shown = 0;
    while (shown < question.length) {
      shown = Math.min(question.length, Math.floor((performance.now() - start) / TYPE_MS) + 1);
      input.value = question.slice(0, shown);
      syncComposer();
      if (shown < question.length) await wait(TYPE_MS);
    }
  }
  chat.drafting = false;
  syncComposer();
  if (document.activeElement === input) input.setSelectionRange(input.value.length, input.value.length);
}

function bindSuggestions(): void {
  const strip = byId('suggestions');
  // With a mouse, keep focus (and the keyboard on phones) on the composer.
  strip.addEventListener('mousedown', (e) => e.preventDefault());
  // Hold the strip still under a finger so a chip can be picked.
  strip.addEventListener('pointerdown', () => strip.classList.add('is-held'));
  for (const type of ['pointerup', 'pointercancel', 'pointerleave']) {
    strip.addEventListener(type, () => strip.classList.remove('is-held'));
  }
  byId('suggestionsTrack').addEventListener('click', (e) => {
    const chip = (e.target as HTMLElement | null)?.closest<HTMLButtonElement>('.suggestion');
    if (chip) void useSuggestion(chip);
  });
}

// ---------- direct contact: WhatsApp link, or email through /api/contact ----------
const MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function setErr(input: HTMLElement, err: HTMLElement, text: string): void {
  err.textContent = text;
  if (text) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
}

function bindContact(): void {
  const form = contactForm();
  const viaInputs = $$<HTMLInputElement>('input[name="via"]', form);
  const via = () => viaInputs.find((r) => r.checked)?.value ?? 'whatsapp';
  const name = byId<HTMLInputElement>('cName');
  const mail = byId<HTMLInputElement>('cHandle');
  const msg = byId<HTMLTextAreaElement>('cMsg');
  // WhatsApp shows only the button to Franco's chat; email shows the form.
  function syncVia(): void {
    const wa = via() === 'whatsapp';
    byId('cWa').hidden = !wa;
    byId('cMail').hidden = wa;
    // Only the email form needs a Turnstile token; WhatsApp visitors never load the widget.
    if (!wa) humanCheck.load();
  }
  for (const r of viaInputs) {
    r.addEventListener('change', () => {
      audio.tick();
      syncVia();
    });
  }
  syncVia();
  byId('cAi').addEventListener('click', () => {
    audio.tick();
    chat.aiHome = true;
    seedPanel();
    syncMarquee();
    humanCheck.load();
    focusComposer();
  });
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  let sending = false;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (via() !== 'mail' || sending) return;
    const n = name.value.trim();
    const hv = mail.value.trim();
    const m = msg.value.trim();
    const okMail = MAIL.test(hv);
    setErr(name, byId('cNameErr'), n ? '' : t.panel.form.errName);
    setErr(mail, byId('cHandleErr'), okMail ? '' : t.panel.form.errMail);
    setErr(msg, byId('cMsgErr'), m ? '' : t.panel.form.errMessage);
    const bad = ([[!n, name], [!okMail, mail], [!m, msg]] as [boolean, HTMLElement][]).find(([b]) => b);
    if (bad) {
      bad[1].focus();
      return;
    }
    void send(n, hv, m);
  });

  async function send(n: string, hv: string, m: string): Promise<void> {
    sending = true;
    busyCursor.begin();
    if (submit) {
      submit.disabled = true;
      submit.textContent = t.panel.form.sending;
    }
    const token = await humanCheck.takeToken();
    const result = await sendContact({ name: n, email: hv, message: m }, token);
    // Tokens are single-use: start solving the next one right away.
    humanCheck.renew();
    if (result.kind === 'sent') {
      addMsg('me', t.panel.form.summary(m, n, hv), { who: t.panel.who.me });
      addMsg('franco', t.panel.form.ack(n, hv), { who: t.panel.who.franco });
      msg.value = '';
    } else {
      // The fields stay filled so the visitor can retry or copy the text.
      addMsg('sys', result.kind === 'offline' ? t.panel.errorNetwork : (result.message ?? t.panel.errorStatus(result.status)));
    }
    audio.tick();
    if (submit) {
      submit.disabled = false;
      submit.textContent = t.panel.form.send;
    }
    busyCursor.end();
    sending = false;
  }
}

export function initPanel(): void {
  byId('talk').addEventListener('click', () => emit('app:talk', 'button'));
  byId('fallbackTalk').addEventListener('click', () => emit('app:talk', 'button'));
  on('app:talk', () => void openPanel());
  // "¿Querés preguntarme más cosas?" (Qué hago): the blob grows from the click, the world loads
  // and Franco's chat opens with the camera on him, as if he had been tapped.
  const ask = document.getElementById('askMore');
  ask?.addEventListener('click', async (event: MouseEvent) => {
    event.preventDefault();
    if (!state.entered || state.busy) return;
    mancha().origin(event.clientX || innerWidth / 2, event.clientY || innerHeight / 2);
    await router.go('mundo');
    if (state.page !== 'mundo') return;
    await worldLoaded();
    if (state.page === 'mundo') emit('app:talk', 'button');
  });
  byId('panelClose').addEventListener('click', closePanel);
  byId('panelBack').addEventListener('click', () => {
    audio.tick();
    chat.aiHome = false;
    seedPanel();
    focusComposer();
  });
  backdrop().addEventListener('click', closePanel);
  document.addEventListener('keydown', onKeydown);
  // Leaving the world page closes the panel (the world unfocuses with it).
  on('app:navigate', closePanel);
  bindHandle();
  bindChat();
  bindSuggestions();
  bindContact();
  setConn('unknown');
}

export const panelApi = { open: openPanel, close: closePanel };
