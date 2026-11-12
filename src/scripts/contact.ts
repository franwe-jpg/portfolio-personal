import { lang } from './i18n';

/**
 * Client of /api/contact (src/pages/api/contact.ts): `{ name, email, message, lang, turnstileToken? }`
 * answers `{ ok: true }` or `{ error }`. Same result shape as the chat client in chat.ts.
 */
export type ContactResult =
  | { kind: 'sent' }
  /** The endpoint answered with an error; `message` is its own copy when it sent one. */
  | { kind: 'error'; status: number; message: string | null }
  /** The request never reached the endpoint. */
  | { kind: 'offline' };

export async function sendContact(
  fields: { name: string; email: string; message: string },
  turnstileToken: string | null,
): Promise<ContactResult> {
  let res: Response;
  try {
    res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...fields, lang, turnstileToken: turnstileToken ?? undefined }),
    });
  } catch {
    return { kind: 'offline' };
  }
  const isJson = (res.headers.get('content-type') ?? '').includes('application/json');
  if (res.status === 502 || res.status === 404 || !isJson) return { kind: 'offline' };
  const data = (await res.json().catch(() => null)) as { ok?: unknown; error?: unknown } | null;
  if (data === null) return { kind: 'offline' };
  if (res.ok && data.ok === true) return { kind: 'sent' };
  return { kind: 'error', status: res.status, message: typeof data.error === 'string' ? data.error : null };
}
