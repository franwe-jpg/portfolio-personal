// Zero-dependency dev server for the redesign prototype.
//   node demos/prototipos/serve.mjs
// Serves demos/prototipos/ on http://localhost:4400, falls back to public/ for
// missing paths (project images, PDFs) and proxies /api/* to `npm run dev`.
import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(HERE, '../../public');
const PORT = Number(process.env.PORT) || 4400;
const UPSTREAM_HOST = 'localhost';
const UPSTREAM_PORT = 4321;
const UPSTREAM_TIMEOUT_MS = 60_000;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.pdf': 'application/pdf',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

/** Resolves a URL path inside `root`, or null if it escapes it. */
function inside(root, urlPath) {
  const target = path.resolve(root, '.' + urlPath);
  return target === root || target.startsWith(root + path.sep) ? target : null;
}

async function findFile(urlPath) {
  for (const root of [HERE, PUBLIC]) {
    let file = inside(root, urlPath);
    if (!file) continue;
    try {
      let info = await stat(file);
      if (info.isDirectory()) {
        file = path.join(file, 'index.html');
        info = await stat(file);
      }
      if (info.isFile()) return { file, size: info.size };
    } catch {
      // Not in this root; try the next one.
    }
  }
  return null;
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(body) });
  res.end(body);
}

function proxy(req, res) {
  const upstreamOrigin = `http://${UPSTREAM_HOST}:${UPSTREAM_PORT}`;
  const headers = { ...req.headers, host: `${UPSTREAM_HOST}:${UPSTREAM_PORT}` };
  if (headers.origin) headers.origin = upstreamOrigin;
  if (headers.referer) headers.referer = upstreamOrigin + '/';

  const upstream = http.request(
    { hostname: UPSTREAM_HOST, port: UPSTREAM_PORT, path: req.url, method: req.method, headers, timeout: UPSTREAM_TIMEOUT_MS },
    (up) => {
      res.writeHead(up.statusCode ?? 502, up.headers);
      up.pipe(res);
    },
  );
  const fail = () => {
    if (!res.headersSent) sendJson(res, 502, { error: 'dev server offline' });
    else res.destroy();
  };
  upstream.on('timeout', () => upstream.destroy(new Error('upstream timeout')));
  upstream.on('error', fail);
  req.pipe(upstream);
}

/**
 * GET /__estado: lets the page learn whether /api/chat is reachable without
 * requesting a URL that fails (a failed request shows up as a console error).
 */
function upstreamStatus(res) {
  const probe = http.request(
    { hostname: UPSTREAM_HOST, port: UPSTREAM_PORT, path: '/api/chat', method: 'GET', headers: { accept: 'application/json' }, timeout: 1500 },
    (up) => {
      up.resume();
      const json = String(up.headers['content-type'] ?? '').includes('application/json');
      sendJson(res, 200, { proxy: true, upstream: true, api: json && up.statusCode !== 404 });
    },
  );
  probe.on('timeout', () => probe.destroy(new Error('timeout')));
  probe.on('error', () => { if (!res.headersSent) sendJson(res, 200, { proxy: true, upstream: false, api: false }); });
  probe.end();
}

const server = http.createServer(async (req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
  } catch {
    res.writeHead(400).end('Bad request');
    return;
  }

  if (urlPath === '/__estado') {
    upstreamStatus(res);
    return;
  }

  if (urlPath === '/api' || urlPath.startsWith('/api/')) {
    proxy(req, res);
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { allow: 'GET, HEAD' }).end();
    return;
  }

  const found = await findFile(urlPath === '/' ? '/index.html' : urlPath);
  if (!found) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found');
    return;
  }

  const type = TYPES[path.extname(found.file).toLowerCase()] ?? 'application/octet-stream';
  res.writeHead(200, {
    'content-type': type,
    'content-length': found.size,
    'cache-control': type.startsWith('text/html') ? 'no-store' : 'no-cache',
  });
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  createReadStream(found.file).on('error', () => res.destroy()).pipe(res);
});

server.listen(PORT, () => {
  console.log(`Prototipo en http://localhost:${PORT}`);
  console.log(`/api/* -> http://${UPSTREAM_HOST}:${UPSTREAM_PORT} (npm run dev)`);
});
