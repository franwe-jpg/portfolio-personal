import type { Lang } from '../i18n/config';

/**
 * What `curl francosolersistemas.com/hola` prints (and /hi in English), the command shown on the
 * "Sobre mí" page: a fake scare, then the punchline. Terminal clients get ANSI colours; anything
 * else (a browser) gets plain text, so the escape codes never show up as garbage.
 */
const LINES: Record<Lang, [scare: string, punchline: string]> = {
  es: ['Caíste, fuiste hackeado.', 'Na, mentira.'],
  en: ['Gotcha, you have been hacked.', 'Nah, just kidding.'],
};

/** Command-line HTTP clients that render ANSI colours. */
const TERMINAL_UA = /^(curl|wget|httpie|xh)\//i;
const RED_BOLD = (text: string) => `\x1b[1;31m${text}\x1b[0m`;

export function terminalCard(request: Request, lang: Lang): Response {
  const colour = TERMINAL_UA.test(request.headers.get('user-agent') ?? '');
  const [scare, punchline] = LINES[lang];
  const body = `\n  ${colour ? RED_BOLD(scare) : scare} ${punchline}\n\n`;
  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      // The body depends on the client (colours or not).
      vary: 'user-agent',
      'cache-control': 'public, max-age=300',
    },
  });
}
