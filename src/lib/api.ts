import { env } from 'cloudflare:workers';
import { DEFAULT_LANG, LANGS, type Lang } from '../i18n/config';

/** Helpers shared by the API endpoints (src/pages/api): JSON replies, language, IP hashing and Turnstile. */

/** Used only when the IP_SALT secret is not configured. */
const FALLBACK_SALT = 'portfolio-personal-fallback-salt';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
/** Turnstile tokens are at most 2048 characters; anything longer is not one. */
const MAX_TURNSTILE_TOKEN_CHARS = 2048;
const SITEVERIFY_TIMEOUT_MS = 5000;

export function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export const methodNotAllowed = (): Response =>
  new Response(JSON.stringify({ error: 'Method not allowed.' }), {
    status: 405,
    headers: { 'content-type': 'application/json; charset=utf-8', allow: 'POST' },
  });

/** Falls back to the default rather than rejecting an unexpected value. */
export function resolveLang(value: unknown): Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value)
    ? (value as Lang)
    : DEFAULT_LANG;
}

/** Salted SHA-256 of the client IP. The raw IP is never persisted. */
export async function hashIp(ip: string): Promise<string> {
  const salt = env.IP_SALT ?? FALLBACK_SALT;
  const bytes = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export type HumanCheck = 'passed' | 'rejected' | 'unavailable';

/**
 * Verifies the Turnstile token sent by the page. `unavailable` means the check
 * itself could not run (missing secret, siteverify down), not that the visitor
 * failed it.
 */
export async function verifyHuman(token: unknown, ip: string | null): Promise<HumanCheck> {
  // There is no widget secret in `astro dev`, so skip the check there. Guarded
  // by DEV: a production deploy with a missing secret must fail closed below.
  if (import.meta.env.DEV && !env.TURNSTILE_SECRET) return 'passed';
  if (!env.TURNSTILE_SECRET) return 'unavailable';

  if (typeof token !== 'string' || token.length === 0 || token.length > MAX_TURNSTILE_TOKEN_CHARS) {
    return 'rejected';
  }

  const form = new FormData();
  form.append('secret', env.TURNSTILE_SECRET);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);

  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(SITEVERIFY_TIMEOUT_MS),
    });
    if (!response.ok) return 'unavailable';
    const outcome = (await response.json()) as { success?: unknown; 'error-codes'?: unknown };
    if (outcome.success === true) return 'passed';
    // A failure on Cloudflare's side is not the visitor's fault.
    const codes = Array.isArray(outcome['error-codes']) ? outcome['error-codes'] : [];
    return codes.includes('internal-error') ? 'unavailable' : 'rejected';
  } catch {
    return 'unavailable';
  }
}
