import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import type { Lang } from '../../i18n/config';
import { hashIp, json, methodNotAllowed, resolveLang, verifyHuman } from '../../lib/api';

export const prerender = false;

/**
 * Contact form of the home scene ("Mail" option): `{ name, email, message, lang, turnstileToken }`
 * answers `{ ok: true }` or `{ error }`. Each accepted message is stored in D1 first and then
 * emailed to Franco through the `send_email` binding, with the visitor as Reply-To, so answering
 * from the inbox goes straight back to them. A message counts as delivered once either step works.
 */

const MAX_NAME = 80;
const MAX_EMAIL = 120;
const MAX_MESSAGE = 1000;
/** Messages per network per day; enough for a real visitor, too few to be worth spamming. */
const DAILY_LIMIT = 5;
const MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Sender on the site's domain (Email Routing must be enabled on it). */
const FROM = { email: 'contacto@francosolersistemas.com', name: 'Portfolio · contacto' };

// Visitor-facing copy, in the language of the page; the 400-level errors stay English on purpose.
const COPY: Record<Lang, { quota: string; unavailable: string; human: string }> = {
  es: {
    quota: `Por hoy llegamos al límite de ${DAILY_LIMIT} mensajes desde tu red. Escribime por WhatsApp y te respondo igual.`,
    unavailable: 'No pude enviar tu mensaje en este momento. Probá de nuevo en un rato o escribime por WhatsApp.',
    human: 'No pude verificar que seas una persona. Recargá la página y probá de nuevo.',
  },
  en: {
    quota: `We've hit today's limit of ${DAILY_LIMIT} messages from your network. Message me on WhatsApp and I will still reply.`,
    unavailable: 'I could not send your message right now. Try again in a while or message me on WhatsApp.',
    human: "I couldn't verify that you're a person. Reload the page and try again.",
  },
};

/** One line, no control characters: the name also goes into the subject header. */
const oneLine = (text: string) => text.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim();

function field(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text.length > 0 && text.length <= max ? text : null;
}

export const POST: APIRoute = async ({ request }) => {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }
  const body = (payload ?? {}) as { name?: unknown; email?: unknown; message?: unknown; lang?: unknown; turnstileToken?: unknown };
  const lang = resolveLang(body.lang);

  const rawName = field(body.name, MAX_NAME);
  const email = field(body.email, MAX_EMAIL);
  const message = field(body.message, MAX_MESSAGE);
  if (!rawName) return json({ error: `Field "name" must be 1 to ${MAX_NAME} characters.` }, 400);
  if (!email || !MAIL.test(email)) return json({ error: 'Field "email" must be a valid address.' }, 400);
  if (!message) return json({ error: `Field "message" must be 1 to ${MAX_MESSAGE} characters.` }, 400);
  const name = oneLine(rawName);

  const clientIp = request.headers.get('CF-Connecting-IP');
  const human = await verifyHuman(body.turnstileToken, clientIp);
  if (human === 'unavailable') return json({ error: COPY[lang].unavailable }, 503);
  if (human === 'rejected') return json({ error: COPY[lang].human }, 403);

  const ipHash = await hashIp(clientIp ?? 'unknown');
  const now = new Date();
  const since = new Date(now.getTime() - 24 * 3600e3).toISOString();

  // Rate limit and storage. A D1 failure does not stop the email: the message can still arrive.
  let id: number | null = null;
  try {
    const sent = await env.DB.prepare('SELECT COUNT(*) AS n FROM contact_message WHERE ip_hash = ?1 AND created_at >= ?2')
      .bind(ipHash, since)
      .first<{ n: number }>();
    if ((sent?.n ?? 0) >= DAILY_LIMIT) return json({ error: COPY[lang].quota }, 429);
    const row = await env.DB.prepare(
      `INSERT INTO contact_message (created_at, ip, ip_hash, lang, name, email, message)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7) RETURNING id`,
    )
      .bind(now.toISOString(), clientIp, ipHash, lang, name, email, message)
      .first<{ id: number }>();
    id = row?.id ?? null;
  } catch (error) {
    console.error('contact: D1 write failed', error);
  }

  const emailed = await notify({ name, email, message, lang, at: now });
  if (emailed && id !== null) {
    try {
      await env.DB.prepare('UPDATE contact_message SET emailed = 1 WHERE id = ?1').bind(id).run();
    } catch {
      // The flag is bookkeeping only: the message is stored and was emailed.
    }
  }

  if (id === null && !emailed) return json({ error: COPY[lang].unavailable }, 503);
  return json({ ok: true }, 200);
};

/** Emails the message to Franco. Returns false (and logs why) when it could not be sent. */
async function notify(m: { name: string; email: string; message: string; lang: Lang; at: Date }): Promise<boolean> {
  if (!env.CONTACT_TO) {
    // Expected in `astro dev` without the secret; in production it is a setup error, but the message is in D1.
    if (!import.meta.env.DEV) console.error('contact: CONTACT_TO secret is not set; message stored only');
    return false;
  }
  const when = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    dateStyle: 'short',
    timeStyle: 'short',
    hourCycle: 'h23',
  }).format(m.at);
  try {
    await env.CONTACT_EMAIL.send({
      from: FROM,
      to: env.CONTACT_TO,
      replyTo: { email: m.email, name: m.name },
      subject: `Mensaje de ${m.name} desde el portfolio`,
      text:
        `${m.message}\n\n` +
        `— ${m.name} <${m.email}>\n` +
        `${when} (hora Argentina) · página en ${m.lang === 'es' ? 'español' : 'inglés'}\n\n` +
        'Respondé este mail para contestarle directamente.',
    });
    return true;
  } catch (error) {
    console.error('contact: email failed', error);
    return false;
  }
}

export const ALL: APIRoute = methodNotAllowed;
