# Reglas del proyecto

## Qué es este repo

Portfolio personal nuevo (rediseño "mundo 3D"). Reemplaza a la primera versión, que vive en el repo de GitHub `franwe-jpg/portfolio-v1` (con su historia completa) y sigue en línea en `v1.francosolersistemas.com` como Worker aparte.

Producción sigue en francosolersistemas.com, que pasa al sitio nuevo. Se despliega con `.github/workflows/deploy.yml` en cada push a `main` (Cloudflare Workers; bindings AI, D1 y Turnstile en `wrangler.jsonc`).

## Git

- Trabajar en ramas de feature. PR hacia `develop`; después PR `develop → main`, que mergea el usuario.
- Conventional commits. Sin atribución a IA.
- Nunca commitear videos de referencia (`*.mp4` está en `.gitignore`); la única excepción son los clips demo cortos de `public/proyectos/`. `demos/prototipos/tv.mp4` no está trackeado: se consigue aparte.

## Fuente de verdad del diseño

- `demos/prototipos/index.html`: un solo archivo, Three.js 0.170 + GSAP 3.12 desde CDN. Se sirve con `node demos/prototipos/serve.mjs` en `http://localhost:4400`.
- Hasta terminar la migración, las decisiones visuales se toman primero en el prototipo. Cuando una fase ya está migrada, el código Astro pasa a ser la verdad para esa parte.

## Plan

- Vive en `docs/rediseno/plan.md`. Una tarea por sesión.
- Al terminar una tarea, marcarla ahí. Mantener actualizado el registro "Decisiones".
- No hacer optimizaciones de rendimiento salvo pedido explícito del usuario (decisión tomada: los números actuales alcanzan; ver mediciones en el plan).

## Dónde está cada cosa

- Datos: `src/data/*.ts` (proyectos, perfil).
- Textos e idiomas: `src/i18n` (`/` español, `/en/` inglés).
- API del chat: `src/pages/api`.

## Verificación obligatoria

Todo cambio visual se verifica con capturas headless de Playwright y cero errores de consola antes de reportarlo.

Receta:

- El script debe ser CommonJS (`.cjs`): `NODE_PATH=/home/franco/.claude/skills/gstack/node_modules` lo ignora ESM.
- Flags de Chromium: `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`.
- Prototipo: abrir `?escena=<oficina|universidad|disponible>&debug`, esperar `window.__world`, clic en `#enter`, clic en `.nav a[data-go="mundo"]`, esperar `document.body.dataset.page === 'mundo'`.
- Primeros planos: asignar `window.__world.rig` (`x, y, z, zoom, az, el`). `rig.x` es x de mundo = x de la escena + `SCENE_X` (oficina -18, universidad 0, casa 18). Una cámara ubicada más allá de una pared renderiza negro.
- Sitio Astro: `npx astro dev` en `http://localhost:4321`. Usar `waitUntil: 'load'` (`networkidle` nunca se cumple).
- Arrancar los servidores desacoplados: `setsid nohup <comando> &`, para que sobrevivan al cierre del turno.
- Las capturas se guardan en el scratchpad de la sesión y se citan con ruta absoluta en el reporte.
