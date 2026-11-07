import { lang } from './i18n';

/**
 * Client of /api/chat (src/pages/api/chat.ts) and the Turnstile human check in front of it,
 * both ported from the first version of the site (landing.ts). The endpoint takes
 * `{ question, lang, turnstileToken?, history? }` and answers `{ answer }` or `{ error }`;
 * in dev without bindings it answers with a stub and skips Turnstile.
 */
export interface Turn {
  question: string;
  answer: string;
}

/** The endpoint keeps only the latest turns; send no more than it reads. */
export const HISTORY_TURNS = 4;

export type ChatResult =
  | { kind: 'answer'; answer: string }
  /** The endpoint answered with an error; `message` is its own copy when it sent one. */
  | { kind: 'error'; status: number; message: string | null }
  /** The request never reached the endpoint (network down, non-JSON reply, 404/502 from a proxy). */
  | { kind: 'offline' };

export async function askChat(question: string, history: Turn[], turnstileToken: string | null): Promise<ChatResult> {
  let res: Response;
  try {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      // `lang` only picks the language of the endpoint's own messages.
      // A missing token is sent anyway: the endpoint replies with its refusal.
      body: JSON.stringify({
        question,
        lang,
        turnstileToken: turnstileToken ?? undefined,
        history: history.slice(-HISTORY_TURNS),
      }),
    });
  } catch {
    return { kind: 'offline' };
  }
  const isJson = (res.headers.get('content-type') ?? '').includes('application/json');
  if (res.status === 502 || res.status === 404 || !isJson) return { kind: 'offline' };
  const data = (await res.json().catch(() => null)) as { answer?: unknown; error?: unknown } | null;
  if (data === null) return { kind: 'offline' };
  if (res.ok && typeof data.answer === 'string') return { kind: 'answer', answer: data.answer };
  return { kind: 'error', status: res.status, message: typeof data.error === 'string' ? data.error : null };
}

// ---------- human check (Turnstile) ----------

/** The slice of the Turnstile API this page uses. */
interface TurnstileApi {
  render(container: HTMLElement, options: Record<string, unknown>): string | undefined;
  reset(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
/** Cloudflare's always-pass test key in dev; the real invisible widget otherwise (same keys as v1). */
const TURNSTILE_SITE_KEY = import.meta.env.DEV ? '1x00000000000000000000AA' : '0x4AAAAAAFEqtk5L30ks3uzR';
/** How long a submit waits for a token that is still being solved. */
const TURNSTILE_WAIT_MS = 5000;
const TURNSTILE_RETRY_MS = 4000;
const TURNSTILE_MAX_RETRIES = 3;

export interface HumanCheck {
  /** Loads the widget (once); called when the chat first shows so a token is ready before the question. */
  load(): void;
  /** A single-use token, or null when none is ready within TURNSTILE_WAIT_MS. */
  takeToken(): Promise<string | null>;
  /** Starts solving the next token in the background. */
  renew(): void;
}

/**
 * Keeps one Turnstile token solved ahead of time, so a question is sent the moment it is
 * submitted. Never blocks the chat: if Turnstile is unavailable the question goes out without
 * a token and the endpoint explains the refusal.
 */
function createHumanCheck(): HumanCheck {
  let api: TurnstileApi | null = null;
  let widgetId: string | null = null;
  let token: string | null = null;
  let loading = false;
  let unavailable = false;
  let retries = 0;
  let waiter: ((value: string | null) => void) | null = null;

  /** Hands a token to a waiting submit, or keeps it for the next one. */
  function deliver(value: string | null): void {
    const pending = waiter;
    waiter = null;
    if (pending) pending(value);
    else token = value;
  }

  function reset(): void {
    token = null;
    if (!api || widgetId === null) return;
    try {
      api.reset(widgetId);
    } catch {
      /* A widget that cannot reset leaves the next submit tokenless. */
    }
  }

  function giveUp(): void {
    unavailable = true;
    deliver(null);
  }

  function load(): void {
    if (loading) return;
    loading = true;
    // Invisible widget: the container only has to exist, never to be seen.
    const container = document.createElement('div');
    container.hidden = true;
    document.body.appendChild(container);

    const script = document.createElement('script');
    script.src = TURNSTILE_SCRIPT;
    script.async = true;
    script.addEventListener('error', giveUp);
    script.addEventListener('load', () => {
      api = window.turnstile ?? null;
      if (!api) return giveUp();
      try {
        widgetId =
          api.render(container, {
            sitekey: TURNSTILE_SITE_KEY,
            // Retries and refreshes are driven from here, not by the widget.
            retry: 'never',
            'refresh-expired': 'manual',
            callback: (value: string) => {
              retries = 0;
              deliver(value);
            },
            'expired-callback': reset,
            'error-callback': () => {
              token = null;
              if (retries < TURNSTILE_MAX_RETRIES) {
                retries += 1;
                setTimeout(reset, TURNSTILE_RETRY_MS);
              } else {
                deliver(null);
              }
              return true;
            },
            'unsupported-callback': giveUp,
          }) ?? null;
        if (widgetId === null) giveUp();
      } catch {
        giveUp();
      }
    });
    document.head.appendChild(script);
  }

  return {
    load,
    takeToken(): Promise<string | null> {
      load();
      if (token) {
        const ready = token;
        token = null;
        return Promise.resolve(ready);
      }
      if (unavailable) return Promise.resolve(null);
      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          waiter = null;
          resolve(null);
        }, TURNSTILE_WAIT_MS);
        waiter = (value) => {
          clearTimeout(timer);
          resolve(value);
        };
      });
    },
    renew(): void {
      // A token that arrived after its submit gave up is still unused: keep it.
      if (token || unavailable) return;
      retries = 0;
      reset();
    },
  };
}

export const humanCheck = createHumanCheck();
