// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// `output: 'static'` prerenders every page to HTML at build time.
// Only routes that opt out with `export const prerender = false`
// (currently just /api/chat) are bundled into the Worker.
export default defineConfig({
  // Base URL used for canonical/Open Graph tags. Replace with the real domain.
  site: 'https://TU-DOMINIO.com',
  output: 'static',
  // `prerenderEnvironment: 'node'` prerenders in Node instead of a workerd
  // worker. The workerd path needs a remote proxy session (and Cloudflare
  // credentials) because the AI/IMAGES bindings have no local emulation.
  adapter: cloudflare({ prerenderEnvironment: 'node' }),
});
