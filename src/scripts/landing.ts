import { MESSAGES } from '../data/messages';
import { LANG_STORAGE_KEY, type Lang } from '../i18n/config';
import { UI } from '../i18n/ui';

// The rendered <html lang> is the single runtime source of truth: the route,
// the markup and this script can never disagree about the active language.
const lang: Lang = document.documentElement.lang === 'en' ? 'en' : 'es';
const t = UI[lang];
const messages = MESSAGES[lang];

const TICK =
  '<svg class="tick" width="16" height="11" viewBox="0 0 16 11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M1 6.2l2.6 2.8L9 2.5"/><path d="M6.4 9l5.4-6.5"/></svg>';

const ICON_PROJECTS =
  '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.3"/><rect x="14" y="3" width="7" height="7" rx="1.3"/><rect x="3" y="14" width="7" height="7" rx="1.3"/><rect x="14" y="14" width="7" height="7" rx="1.3"/></svg>';
const ICON_CHAT =
  '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12c0 4.4-4 8-9 8a9.7 9.7 0 0 1-3-.46L3 21l1.4-4.2A7.9 7.9 0 0 1 3 12c0-4.4 4-8 9-8s9 3.6 9 8z"/></svg>';

const ICON_MOON =
  '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 0 1 11.2 3a7 7 0 1 0 9.8 9.8z"/></svg>';
const ICON_SUN =
  '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.2M12 19.8V22M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2 12h2.2M19.8 12H22M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6"/></svg>';

const STATUS_ONLINE = t.statusOnline;
const STATUS_TYPING = t.statusTyping;
const PLACEHOLDER_OPEN = t.composerPlaceholderOpen;
const NETWORK_ERROR = t.networkError;

/**
 * Timestamps follow the visitor's own device clock. Argentina is only a
 * fallback for the rare runtime that reports no resolvable time zone, so a
 * visitor abroad still sees a sensible hour instead of a blank meta line.
 */
const FALLBACK_TIME_ZONE = 'America/Argentina/Buenos_Aires';

const TIME_FORMATTER = ((): Intl.DateTimeFormat => {
  // hourCycle 'h23' rather than hour12:false: the latter renders midnight as
  // "24:00" in some engines.
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  };
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return new Intl.DateTimeFormat(t.locale, { ...options, timeZone: zone || FALLBACK_TIME_ZONE });
  } catch {
    return new Intl.DateTimeFormat(t.locale, { ...options, timeZone: FALLBACK_TIME_ZONE });
  }
})();

/** Self-hosted emoji dataset for the active language; fetched on first open. */
const EMOJI_DATA_SOURCE = t.emoji.dataSource;

/** Must match the key used by the inline theme script in Layout.astro. */
const THEME_STORAGE_KEY = 'theme';

type Theme = 'light' | 'dark';

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

// ── Theme ───────────────────────────────────────────────────────

interface ThemeController {
  current(): Theme;
  toggle(): void;
  onChange(listener: (theme: Theme) => void): void;
}

/** localStorage throws in some privacy modes, so every access is guarded. */
function readStoredTheme(): Theme | null {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return raw === 'dark' || raw === 'light' ? raw : null;
  } catch {
    return null;
  }
}

function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* Nothing to persist to; the choice still applies for this session. */
  }
}

function systemTheme(): Theme {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function initTheme(): ThemeController {
  const root = document.documentElement;
  const listeners: ((theme: Theme) => void)[] = [];

  // The inline <head> script already resolved and stamped the theme before
  // the first paint. Read it back instead of recomputing, so there is a
  // single source of truth and never a second paint.
  const stamped = root.getAttribute('data-theme');
  let current: Theme =
    stamped === 'dark' || stamped === 'light' ? stamped : (readStoredTheme() ?? systemTheme());
  root.setAttribute('data-theme', current);

  function apply(theme: Theme): void {
    current = theme;
    root.setAttribute('data-theme', theme);
    for (const listener of listeners) listener(theme);
  }

  // Keep following the OS for as long as the visitor has not chosen.
  const query = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  query?.addEventListener('change', function (event) {
    if (readStoredTheme() === null) apply(event.matches ? 'dark' : 'light');
  });

  return {
    current: function () {
      return current;
    },
    toggle: function () {
      const next: Theme = current === 'dark' ? 'light' : 'dark';
      storeTheme(next);
      apply(next);
    },
    onChange: function (listener) {
      listeners.push(listener);
    },
  };
}

// ── Header menu ─────────────────────────────────────────────────

function initHeaderMenu(theme: ThemeController): void {
  const button = byId<HTMLButtonElement>('hdrMenuBtn');
  const menu = byId('hdrMenu');
  if (!button || !menu) return;

  const icon = menu.querySelector<HTMLElement>('.theme-icon');
  const label = menu.querySelector<HTMLElement>('.theme-label');
  let open = false;

  /** The item is named after the theme it switches TO, not the current one. */
  function syncThemeItem(current: Theme): void {
    const switchesToDark = current === 'light';
    if (label) label.textContent = switchesToDark ? t.themeDark : t.themeLight;
    // Authored icon constants, never network input.
    if (icon) icon.innerHTML = switchesToDark ? ICON_MOON : ICON_SUN;
  }
  syncThemeItem(theme.current());
  theme.onChange(syncThemeItem);

  function items(): HTMLElement[] {
    return Array.from(menu!.querySelectorAll<HTMLElement>('[role="menuitem"]'));
  }

  function focusItem(offset: number, from: HTMLElement | null): void {
    const all = items();
    if (all.length === 0) return;
    const index = from ? all.indexOf(from) : -1;
    const next = (index + offset + all.length) % all.length;
    all[next]?.focus();
  }

  function onKeydown(event: KeyboardEvent): void {
    const active = document.activeElement as HTMLElement | null;
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        closeMenu(true);
        break;
      case 'Tab':
        // Leaving the menu by keyboard closes it, without stealing focus back.
        closeMenu(false);
        break;
      case 'ArrowDown':
        event.preventDefault();
        focusItem(1, active);
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusItem(-1, active);
        break;
      case 'Home':
        event.preventDefault();
        items()[0]?.focus();
        break;
      case 'End': {
        event.preventDefault();
        const all = items();
        all[all.length - 1]?.focus();
        break;
      }
    }
  }

  function onPointerDown(event: Event): void {
    const target = event.target as Node | null;
    // The button has its own toggle handler; ignore it here.
    if (target && (menu!.contains(target) || button!.contains(target))) return;
    closeMenu(false);
  }

  function openMenu(): void {
    if (open) return;
    open = true;
    menu!.hidden = false;
    button!.setAttribute('aria-expanded', 'true');
    items()[0]?.focus();
    document.addEventListener('keydown', onKeydown, true);
    document.addEventListener('pointerdown', onPointerDown, true);
  }

  function closeMenu(restoreFocus: boolean): void {
    if (!open) return;
    open = false;
    // Focus must leave before the menu is hidden, otherwise it lands on a
    // display:none element and the browser drops it on <body>. Closing by
    // Tab or by an outside click still moves on naturally from the button.
    const hadFocus = menu!.contains(document.activeElement);
    if (restoreFocus || hadFocus) button!.focus();
    menu!.hidden = true;
    button!.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', onKeydown, true);
    document.removeEventListener('pointerdown', onPointerDown, true);
  }

  button.addEventListener('click', function () {
    if (open) closeMenu(true);
    else openMenu();
  });

  byId<HTMLButtonElement>('themeMenuItem')?.addEventListener('click', function () {
    theme.toggle();
    closeMenu(true);
  });

  // The item is a plain <a>, so navigation is the browser's job. All this does
  // is record the deliberate pick first, so the automatic geo redirect on the
  // destination page can never undo it.
  byId<HTMLAnchorElement>('langMenuItem')?.addEventListener('click', function (event) {
    const target = (event.currentTarget as HTMLAnchorElement).dataset.lang;
    if (target !== 'es' && target !== 'en') return;
    try {
      localStorage.setItem(LANG_STORAGE_KEY, target);
    } catch {
      /* Privacy mode: the switch still works, it just is not remembered. */
    }
  });
}

// ── Emoji picker ────────────────────────────────────────────────

function initEmojiPicker(theme: ThemeController): void {
  const button = byId<HTMLButtonElement>('emojiBtn');
  const popover = byId('emojiPopover');
  const input = byId<HTMLInputElement>('composerInput');
  if (!button || !popover || !input) return;

  let picker: HTMLElement | null = null;
  let loading = false;
  let open = false;

  function syncPickerTheme(current: Theme): void {
    if (!picker) return;
    picker.classList.toggle('dark', current === 'dark');
    picker.classList.toggle('light', current === 'light');
  }
  theme.onChange(syncPickerTheme);

  /** Inserts at the caret, honouring the input's maxlength. */
  function insertEmoji(emoji: string): void {
    const start = input!.selectionStart ?? input!.value.length;
    const end = input!.selectionEnd ?? start;
    const next = input!.value.slice(0, start) + emoji + input!.value.slice(end);
    // Assigning `.value` bypasses the maxlength attribute, so enforce it.
    if (input!.maxLength > 0 && next.length > input!.maxLength) return;
    input!.value = next;
    const caret = start + emoji.length;
    input!.focus();
    input!.setSelectionRange(caret, caret);
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    closePicker(true);
  }

  function onPointerDown(event: Event): void {
    const target = event.target as Node | null;
    if (target && (popover!.contains(target) || button!.contains(target))) return;
    closePicker(false);
  }

  /**
   * Loads emoji-picker-element on demand. The dynamic import keeps the
   * package (and its dataset) out of the initial bundle entirely.
   */
  async function ensurePicker(): Promise<HTMLElement | null> {
    if (picker || loading) return picker;
    loading = true;
    try {
      // Both i18n modules are static specifiers so the bundler can see them;
      // only the one for the active language is ever requested.
      const [{ default: Picker }, { default: i18n }] = await Promise.all([
        import('emoji-picker-element/picker.js'),
        lang === 'en'
          ? import('emoji-picker-element/i18n/en.js')
          : import('emoji-picker-element/i18n/es.js'),
      ]);
      const element = new Picker({
        dataSource: EMOJI_DATA_SOURCE,
        locale: t.emoji.locale,
        i18n,
      }) as unknown as HTMLElement;
      element.addEventListener('emoji-click', function (event) {
        const detail = (event as CustomEvent<{ unicode?: string }>).detail;
        if (detail && typeof detail.unicode === 'string') insertEmoji(detail.unicode);
      });
      popover!.appendChild(element);
      picker = element;
      syncPickerTheme(theme.current());
      return picker;
    } catch {
      // Offline or blocked: leave the composer exactly as it was.
      return null;
    } finally {
      loading = false;
    }
  }

  async function openPicker(): Promise<void> {
    if (open || input!.disabled) return;
    open = true;
    button!.setAttribute('aria-expanded', 'true');
    popover!.hidden = false;
    document.addEventListener('keydown', onKeydown, true);
    document.addEventListener('pointerdown', onPointerDown, true);

    const element = await ensurePicker();
    if (!element) {
      closePicker(false);
      return;
    }
    // The visitor may have closed it again while the chunk was loading.
    if (open) focusPicker(element);
  }

  /**
   * The custom element host has no tabindex, so focusing it would be a no-op.
   * Aim for the picker's own search field inside its shadow root and fall
   * back to the host, which at worst leaves focus on the button next to it.
   */
  function focusPicker(element: HTMLElement): void {
    const search = element.shadowRoot?.querySelector<HTMLElement>('input[type="search"], input');
    (search ?? element).focus();
  }

  function closePicker(restoreFocus: boolean): void {
    if (!open) return;
    open = false;
    // Same reason as the header menu: never hide a subtree that still holds
    // focus. The picker keeps focus inside its own shadow root, so ask the
    // popover whether the active element resolves into it.
    const hadFocus = popover!.contains(document.activeElement);
    if (restoreFocus || hadFocus) button!.focus();
    button!.setAttribute('aria-expanded', 'false');
    popover!.hidden = true;
    document.removeEventListener('keydown', onKeydown, true);
    document.removeEventListener('pointerdown', onPointerDown, true);
  }

  button.addEventListener('click', function () {
    if (open) closePicker(true);
    else void openPicker();
  });
}

function initConversation(): void {
  const list = byId('list');
  const liveList = byId('liveList');
  const body = byId('body');
  const stage = byId('stage');
  const status = byId('status');
  const hint = byId('hint');
  const composer = byId<HTMLFormElement>('composer');
  const input = byId<HTMLInputElement>('composerInput');
  const send = byId<HTMLButtonElement>('composerSend');
  const emojiButton = byId<HTMLButtonElement>('emojiBtn');

  if (!list || !liveList || !body || !stage || !status || !hint || !composer || !input || !send) {
    return;
  }

  stage.style.height = (messages.length + 2) * 55 + 'svh';

  const nodes: (HTMLElement | null)[] = [];
  let typingEl: HTMLElement | null = null;
  let liveTypingEl: HTMLElement | null = null;
  let shown = -1;
  let typingFor = -1;
  let composerReady = false;
  let requestInFlight = false;
  /** One-way latch: the scroll-driven intro is a first-visit effect only. */
  let conversationComplete = false;

  /** Pins the list to the bottom of the viewport-sized chat body. */
  function reflow(): void {
    if (conversationComplete) {
      // Native scrolling owns the position now; keep new bubbles in view.
      body!.scrollTop = body!.scrollHeight;
      return;
    }
    const offset = list!.scrollHeight - body!.clientHeight;
    list!.style.transform = 'translateY(' + (offset > 0 ? -offset : 0) + 'px)';
  }

  /** Scripted nodes always sit above the live conversation. */
  function insertScripted(node: HTMLElement): void {
    list!.insertBefore(node, liveList);
  }

  function buildMessage(index: number): HTMLElement {
    const message = messages[index];
    const previous = messages[index - 1];
    const row = document.createElement('div');
    row.className =
      'row ' +
      (message.from === 'franco' ? 'in' : 'out') +
      (previous && previous.from === message.from ? ' same' : '');
    // Authored content from src/data/messages.ts, never network input.
    row.innerHTML =
      '<div class="bubble">' +
      message.html +
      '<span class="meta">' +
      clock() +
      (message.from === 'visitor' ? TICK : '') +
      '</span></div>';
    return row;
  }

  function showTyping(index: number): void {
    if (typingFor === index) return;
    hideTyping();
    typingFor = index;
    const message = messages[index];
    typingEl = document.createElement('div');
    typingEl.className = 'row ' + (message.from === 'franco' ? 'in' : 'out');
    typingEl.innerHTML = '<div class="bubble"><span class="typing"><i></i><i></i><i></i></span></div>';
    insertScripted(typingEl);
    if (message.from === 'franco') status!.innerHTML = STATUS_TYPING;
    reflow();
  }

  function hideTyping(): void {
    if (typingEl) {
      typingEl.remove();
      typingEl = null;
    }
    typingFor = -1;
    // A live request owns the status line while it is pending.
    if (!requestInFlight) status!.textContent = STATUS_ONLINE;
  }

  function openComposer(): void {
    composerReady = true;
    input!.disabled = false;
    send!.disabled = false;
    if (emojiButton) emojiButton.disabled = false;
    input!.placeholder = PLACEHOLDER_OPEN;
  }

  /**
   * Fires once, the moment the last scripted message has been shown, and
   * never unwinds. It turns the scroll-driven intro into an ordinary chat:
   * every scripted message stays in the DOM, the typing indicator is gone
   * for good, and `.chat-body` takes over with native scrolling so the
   * visitor can read up and down at their own pace.
   *
   * It also collapses `#stage` back to one viewport. The long scroll track
   * only ever existed to drive the animation, and the page must not keep
   * scrolling past the end of the conversation.
   */
  function completeConversation(): void {
    if (conversationComplete) return;
    conversationComplete = true;

    window.removeEventListener('scroll', onScroll);
    hideTyping();

    // Make sure the whole script is rendered, permanently.
    while (shown < messages.length - 1) {
      shown++;
      const node = buildMessage(shown);
      nodes[shown] = node;
      insertScripted(node);
    }
    openComposer();

    // Hand positioning to native scrolling in one synchronous step: the
    // class kills the transition before the transform is dropped, and the
    // list is scrolled to the bottom where the transform had it. The chat
    // therefore looks identical across the swap.
    body!.classList.add('is-complete');
    list!.style.transform = '';
    body!.scrollTop = body!.scrollHeight;

    // `#sticky` is pinned at the top of the viewport at any scroll offset,
    // so collapsing the stage does not move anything on screen.
    stage!.style.height = '100svh';
    hint!.classList.add('gone');
  }

  function render(target: number): void {
    if (conversationComplete) return;
    while (shown < target) {
      shown++;
      hideTyping();
      const node = buildMessage(shown);
      nodes[shown] = node;
      insertScripted(node);
    }
    while (shown > target) {
      const node = nodes[shown];
      if (node) node.remove();
      nodes[shown] = null;
      shown--;
      hideTyping();
    }
    if (shown >= messages.length - 1) {
      completeConversation();
      return;
    }
    reflow();
  }

  let ticking = false;
  function onScroll(): void {
    if (conversationComplete || ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      if (conversationComplete) return;
      const max = stage!.offsetHeight - window.innerHeight;
      const p = Math.min(1, Math.max(0, (window.scrollY - stage!.offsetTop) / max));
      const raw = p * (messages.length + 0.25);
      const target = Math.min(messages.length - 1, Math.floor(raw) - 1);
      const frac = raw - Math.floor(raw);
      render(target);
      if (conversationComplete) return;
      const next = target + 1;
      if (next < messages.length && frac > 0.45) showTyping(next);
      else if (typingFor !== -1) hideTyping();
      hint!.classList.toggle('gone', p > 0.02);
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () {
    if (conversationComplete) return;
    reflow();
    onScroll();
  });

  // ── Live chat ─────────────────────────────────────────────────

  function clock(): string {
    return TIME_FORMATTER.format(new Date());
  }

  /**
   * Appends a live bubble. `text` is always inserted with textContent: the
   * answer is model output and must never be parsed as markup.
   */
  function appendLive(kind: 'in' | 'out', text: string): void {
    const row = document.createElement('div');
    row.className = 'row ' + kind;

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;

    const meta = document.createElement('span');
    meta.className = 'meta';
    meta.textContent = clock();
    if (kind === 'out') meta.insertAdjacentHTML('beforeend', TICK); // authored constant

    bubble.appendChild(meta);
    row.appendChild(bubble);
    liveList!.appendChild(row);
    reflow();
  }

  function showLiveTyping(): void {
    hideLiveTyping();
    liveTypingEl = document.createElement('div');
    liveTypingEl.className = 'row in';
    liveTypingEl.innerHTML =
      '<div class="bubble"><span class="typing"><i></i><i></i><i></i></span></div>';
    liveList!.appendChild(liveTypingEl);
    status!.innerHTML = STATUS_TYPING;
    reflow();
  }

  function hideLiveTyping(): void {
    if (liveTypingEl) {
      liveTypingEl.remove();
      liveTypingEl = null;
    }
  }

  async function ask(question: string): Promise<string> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        // `lang` only picks which language the endpoint's own messages use.
        body: JSON.stringify({ question, lang }),
      });
      const data = (await response.json().catch(() => null)) as
        | { answer?: unknown; error?: unknown }
        | null;

      if (response.ok && typeof data?.answer === 'string') return data.answer;
      if (typeof data?.error === 'string') return data.error;
      return NETWORK_ERROR;
    } catch {
      return NETWORK_ERROR;
    }
  }

  composer.addEventListener('submit', async function (event) {
    event.preventDefault();
    const question = input!.value.trim();
    if (!composerReady || requestInFlight || question.length === 0) return;

    requestInFlight = true;
    input!.value = '';
    input!.disabled = true;
    send!.disabled = true;
    appendLive('out', question);
    showLiveTyping();

    const answer = await ask(question);

    requestInFlight = false;
    hideLiveTyping();
    status!.textContent = STATUS_ONLINE;
    appendLive('in', answer);
    input!.disabled = false;
    send!.disabled = false;
    input!.focus();
  });

  render(-1);
  onScroll();
}

function initPanels(): void {
  const chatScreen = byId('chatScreen');
  const projectsScreen = byId('projectsScreen');
  if (!chatScreen || !projectsScreen) return;

  let currentView: 'chat' | 'projects' = 'chat';

  function setLabels(view: 'chat' | 'projects'): void {
    document.querySelectorAll('.view-toggle-btn .vt-label').forEach(function (el) {
      el.textContent = view === 'chat' ? t.viewProjects : t.viewChat;
    });
    document.querySelectorAll('.view-toggle-btn .vt-icon').forEach(function (el) {
      el.innerHTML = view === 'chat' ? ICON_PROJECTS : ICON_CHAT;
    });
  }

  /**
   * Symmetric swap: the entering panel is always re-seated above the frame
   * before animating in, and the leaving panel always exits downwards.
   */
  function slideSwap(entering: HTMLElement, leaving: HTMLElement): void {
    entering.classList.add('no-anim');
    entering.style.transform = 'translateY(-100%)';
    void entering.offsetHeight;
    entering.classList.remove('no-anim');
    leaving.style.transform = 'translateY(100%)';
    requestAnimationFrame(function () {
      entering.style.transform = 'translateY(0)';
    });
  }

  function toggleView(): void {
    if (currentView === 'chat') {
      slideSwap(projectsScreen!, chatScreen!);
      currentView = 'projects';
    } else {
      slideSwap(chatScreen!, projectsScreen!);
      currentView = 'chat';
    }
    setLabels(currentView);
  }

  document.querySelectorAll('.view-toggle-btn').forEach(function (btn) {
    btn.addEventListener('click', toggleView);
  });

  document.addEventListener('click', function (event) {
    const target = event.target as HTMLElement | null;
    if (!target || !target.closest('[data-action="proyectos"]')) return;
    event.preventDefault();
    if (currentView === 'chat') toggleView();
  });
}

function initCarousels(): void {
  document.querySelectorAll<HTMLElement>('.proj-carousel').forEach(function (carousel) {
    const track = carousel.querySelector<HTMLElement>('.proj-track');
    const slides = carousel.querySelectorAll('.proj-track > *');
    const dots = carousel.querySelectorAll('.proj-dots span');
    const prev = carousel.querySelector('.prev');
    const next = carousel.querySelector('.next');
    if (!track || slides.length === 0) return;

    let idx = 0;
    function go(i: number): void {
      idx = (i + slides.length) % slides.length;
      track!.style.transform = 'translateX(-' + idx * 100 + '%)';
      dots.forEach(function (dot, j) {
        dot.classList.toggle('active', j === idx);
      });
    }

    prev?.addEventListener('click', function () {
      go(idx - 1);
    });
    next?.addEventListener('click', function () {
      go(idx + 1);
    });
  });
}

const theme = initTheme();
initHeaderMenu(theme);
initEmojiPicker(theme);
initConversation();
initPanels();
initCarousels();
