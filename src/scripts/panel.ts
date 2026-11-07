import type { Scene } from '../i18n/ui';
import { audio } from './audio';
import { askChat, HISTORY_TURNS, humanCheck, type Turn } from './chat';
import { busyCursor } from './cursor';
import { $$, byId, el } from './dom';
import { REDUCE } from './env';
import { t } from './i18n';
import { router } from './router';
import { emit, on, state } from './state';
import { world } from './world/handle';

/**
 * Side panel over the world: AI chat in the office and the university (connected to /api/chat
 * through the Turnstile human check), direct contact at home (form, mock until /api/contact
 * exists). Opening it puts the world in the POV view; closing it, or leaving the page, undoes
 * that. On narrow screens it is a bottom sheet whose handle drags down to close.
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
};
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

function addMsg(kind: MsgKind, text: string, opts: { who?: string; mock?: boolean; tag?: string } = {}): HTMLLIElement {
  // appendChild, not append: the generated Cloudflare types merge HTMLRewriter's Element into the DOM one.
  const li = el('li', `msg ${kind}${opts.mock ? ' mock' : ''}`);
  if (opts.who) li.appendChild(el('span', 'who', opts.who));
  li.appendChild(el('span', undefined, text));
  if (opts.tag) {
    li.appendChild(el('br'));
    li.appendChild(el('span', 'tag', opts.tag));
  }
  msgs().appendChild(li);
  const body = byId('panelBody');
  body.scrollTo({ top: body.scrollHeight, behavior: REDUCE ? 'auto' : 'smooth' });
  return li;
}

function seedPanel(): void {
  const scene = state.scene;
  const kind = KIND_OF[scene];
  const copy = t.mundo.scenes[scene];
  byId('panelTitle').textContent = kind === 'chat' ? t.panel.title(copy.where) : t.panel.titleContact;
  const sub = byId('panelSub');
  sub.textContent = kind === 'chat' ? '' : t.panel.subContact;
  sub.hidden = kind === 'chat';
  byId('conn').hidden = true;
  chatForm().hidden = kind !== 'chat';
  contactForm().hidden = kind !== 'contact';
  if (chat.kind !== kind) {
    msgs().replaceChildren();
    chat.kind = kind;
    chat.scene = null;
  }
  if (chat.scene !== scene) {
    addMsg('franco', copy.hello, { who: kind === 'chat' ? t.panel.who.ai : t.panel.who.franco });
    chat.scene = scene;
  }
}

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
  if (KIND_OF[state.scene] === 'chat') humanCheck.load();
  const delay = world ? world.focusOn() * 0.6 : 0;
  backdrop().hidden = false;
  panel().hidden = false;
  byId('app').setAttribute('inert', '');
  setTimeout(() => {
    requestAnimationFrame(() => {
      backdrop().classList.add('is-open');
      panel().classList.add('is-open');
    });
    setTimeout(() => (chatForm().hidden ? byId('cName') : q()).focus({ preventScroll: true }), REDUCE ? 30 : 380);
  }, delay * 1000);
}

export function closePanel(): void {
  if (!state.panelOpen) return;
  state.panelOpen = false;
  document.body.classList.remove('panel-open');
  panel().classList.remove('is-open');
  backdrop().classList.remove('is-open');
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

/** Bottom sheet: drag the handle down to close (mobile). */
function bindHandle(): void {
  const handle = byId('panelHandle');
  let y0: number | null = null;
  let dy = 0;
  handle.addEventListener('pointerdown', (e) => {
    y0 = e.clientY;
    dy = 0;
    panel().classList.add('is-dragging');
    handle.setPointerCapture(e.pointerId);
  });
  handle.addEventListener('pointermove', (e) => {
    if (y0 === null) return;
    dy = Math.max(0, e.clientY - y0);
    panel().style.transform = `translateY(${dy}px)`;
  });
  const end = () => {
    if (y0 === null) return;
    y0 = null;
    panel().classList.remove('is-dragging');
    if (dy > 110) closePanel();
    else panel().style.transform = '';
  };
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);
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
    if (!question || question.length > MAX_Q || chat.waiting) return;
    input.value = '';
    syncComposer();
    void ask(question);
  });
}

// ---------- direct contact (mock until /api/contact exists) ----------
const TELEGRAM_HANDLE = /^@?[A-Za-z][A-Za-z0-9_]{4,31}$/;
const MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function setErr(input: HTMLElement, err: HTMLElement, text: string): void {
  err.textContent = text;
  if (text) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
}

function bindContact(): void {
  const form = contactForm();
  const viaInputs = $$<HTMLInputElement>('input[name="via"]', form);
  const via = () => viaInputs.find((r) => r.checked)?.value ?? 'telegram';
  const handle = byId<HTMLInputElement>('cHandle');
  function syncVia(): void {
    const tg = via() === 'telegram';
    byId('cHandleLbl').textContent = tg ? t.panel.form.handle : t.panel.form.mailHandle;
    handle.placeholder = tg ? t.panel.form.handlePlaceholder : t.panel.form.mailPlaceholder;
    handle.type = tg ? 'text' : 'email';
    handle.autocomplete = tg ? 'off' : 'email';
    handle.inputMode = tg ? 'text' : 'email';
    setErr(handle, byId('cHandleErr'), '');
  }
  for (const r of viaInputs) {
    r.addEventListener('change', () => {
      audio.tick();
      syncVia();
    });
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = byId<HTMLInputElement>('cName');
    const msg = byId<HTMLTextAreaElement>('cMsg');
    const n = name.value.trim();
    const hv = handle.value.trim();
    const m = msg.value.trim();
    const tg = via() === 'telegram';
    const okHandle = tg ? TELEGRAM_HANDLE.test(hv) : MAIL.test(hv);
    setErr(name, byId('cNameErr'), n ? '' : t.panel.form.errName);
    setErr(handle, byId('cHandleErr'), okHandle ? '' : tg ? t.panel.form.errTelegram : t.panel.form.errMail);
    setErr(msg, byId('cMsgErr'), m ? '' : t.panel.form.errMessage);
    const bad = ([[!n, name], [!okHandle, handle], [!m, msg]] as [boolean, HTMLElement][]).find(([b]) => b);
    if (bad) {
      bad[1].focus();
      return;
    }
    const handleShown = tg && !hv.startsWith('@') ? `@${hv}` : hv;
    addMsg('me', t.panel.form.summary(m, n, tg ? t.panel.form.telegram : t.panel.form.mail, handleShown), { who: t.panel.who.me });
    setTimeout(
      () => {
        addMsg('franco', t.panel.form.ack(n, tg ? t.panel.form.ackVia.telegram : t.panel.form.ackVia.mail), {
          who: t.panel.who.franco,
          mock: true,
          tag: t.panel.form.ackTag,
        });
        audio.tick();
      },
      REDUCE ? 100 : 500,
    );
    msg.value = '';
  });
}

export function initPanel(): void {
  byId('talk').addEventListener('click', () => emit('app:talk', 'button'));
  byId('fallbackTalk').addEventListener('click', () => emit('app:talk', 'button'));
  on('app:talk', () => void openPanel());
  byId('panelClose').addEventListener('click', closePanel);
  backdrop().addEventListener('click', closePanel);
  document.addEventListener('keydown', onKeydown);
  // Leaving the world page closes the panel (the world unfocuses with it).
  on('app:navigate', closePanel);
  bindHandle();
  bindChat();
  bindContact();
  setConn('unknown');
}

export const panelApi = { open: openPanel, close: closePanel };
