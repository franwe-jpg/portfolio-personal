Protafolio personal.

## Development

Astro 7 with the Cloudflare adapter. Pages are prerendered to static HTML;
only `src/pages/api/chat.ts` runs on the Worker.

```sh
npm install
npm run dev      # local dev server on http://localhost:4321
npm run build    # -> dist/client (static assets) + dist/server (Worker)
npm run preview  # preview the built output
```

Apply the schema to the local D1 database once, so `/api/chat` can count quota:

```sh
npx wrangler d1 execute portfolio --local --file=db/schema.sql
```

> **Workers AI is disabled locally.** It has no local emulation: with the `ai`
> binding present the dev server opens a remote proxy session and exits before
> becoming ready unless Cloudflare credentials are configured. The binding is
> therefore commented out in `wrangler.jsonc`, and `/api/chat` answers with a
> `[STUB LOCAL …]` placeholder (guarded by `import.meta.env.DEV`, so a
> production build still fails loudly if the binding is missing).
>
> Before deploying: uncomment the `ai` binding, run `npx wrangler login`, and
> replace the `TU-*` placeholders — including `site` in `astro.config.mjs`,
> which currently points at a fake domain and would emit a wrong canonical URL.

### Database

```sh
npx wrangler d1 create portfolio                       # paste the id into wrangler.jsonc
npx wrangler d1 execute portfolio --local  --file=db/schema.sql
npx wrangler d1 execute portfolio --remote --file=db/schema.sql
```

### Secrets

```sh
npx wrangler secret put IP_SALT   # random string; salts the stored IP hashes
```

### Types

```sh
npm run cf-typegen   # regenerate worker-configuration.d.ts after editing wrangler.jsonc
```

### Deploy

```sh
npm run deploy   # astro build && wrangler deploy
```
