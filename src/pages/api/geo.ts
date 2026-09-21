import type { APIRoute } from 'astro';

export const prerender = false;

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // A cached country would hand one visitor another visitor's locale.
      'cache-control': 'no-store',
    },
  });
}

/** Cloudflare sets CF-IPCountry at the edge. 'XX'/'T1' mean unknown or Tor. */
export const GET: APIRoute = ({ request }) => {
  const header = request.headers.get('CF-IPCountry');
  const country = header && header.length === 2 && header !== 'XX' && header !== 'T1' ? header : null;
  return json({ country }, 200);
};

export const ALL: APIRoute = () =>
  new Response(JSON.stringify({ error: 'Method not allowed.' }), {
    status: 405,
    headers: { 'content-type': 'application/json; charset=utf-8', allow: 'GET' },
  });
