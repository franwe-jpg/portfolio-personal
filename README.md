# Portfolio personal — mundo 3D

Sitio de [francosolersistemas.com](https://francosolersistemas.com): un portfolio que no hace scroll. Se entra por una pantalla de carga, se cae en `inicio` y desde ahí se navega entre cuatro estados: el **mundo** (un diorama isométrico en 3D donde Franco está en la oficina, en la universidad o en casa según la hora de Argentina, y se le puede hablar por un chat con IA), **proyectos** y **sobre mí**. Hay versión en español (`/`) e inglés (`/en/`). Y hay un easter egg.

La primera versión del portfolio sigue en línea en [v1.francosolersistemas.com](https://v1.francosolersistemas.com), desde el repo [`franwe-jpg/portfolio-v1`](https://github.com/franwe-jpg/portfolio-v1).

## Stack

- **Astro 7** con `@astrojs/cloudflare`: todas las páginas se prerenderizan a HTML estático; solo `/api/*` corre en el Worker.
- **Three.js 0.170** para el mundo 3D y **GSAP 3.12** para las animaciones. El chunk del mundo se descarga recién al entrar a `mundo`.
- **Cloudflare Workers** para servir el sitio, con **Workers AI** (`llama-3.1-8b-instruct-fp8`) detrás del chat, **D1** para la cuota diaria y el registro de preguntas, y **Turnstile** como verificación humana.
- Sin framework de UI: componentes `.astro` y módulos TypeScript que se comunican por un estado único y eventos en `document`.

## Estructura

```text
src/
├── components/   Áreas del único documento: Loader, Gate, Header, PageInicio, PageMundo,
│                 PageProyectos, PageSobre, Panel (chat y contacto), Hunt, Cursor…
├── scripts/      Lógica del cliente: router, state (estado y eventos), gate, rain,
│                 glyph-field, panel, chat, hunt, audio, cursor, scene, stage…
│   └── world/    El mundo 3D: cámara, luces, materiales, figuras, mascotas, pantallas,
│                 reloj, sorpresa y las tres escenas (scenes/office, university, home)
├── styles/       base, gate, pages, panel, world (CSS plano)
├── data/         Contenido: profile.ts, projects.ts, photos.ts (ES y EN)
├── i18n/         config.ts (idiomas y rutas) y ui.ts (todo texto de interfaz, tipado)
├── lib/          persona.ts: prompt del sistema y límites del chat
├── layouts/      Layout.astro: head, metadatos, JSON-LD y redirección por idioma
├── pages/        index.astro (/), en/index.astro (/en/) y api/ (chat.ts, geo.ts)
└── assets/       Imágenes importadas desde componentes
public/
├── fotos/        Fotos de la sección "Fotos" (webp, ≤ 1600 px)
├── proyectos/    Capturas y clips de las tarjetas de proyectos
├── cursores/     Set de cursores (PNG por cuadro)
├── og.png, favicon.ico, apple-touch-icon.png   Generados por scripts/brand-assets.mjs
├── sitemap.xml, robots.txt, _headers           Estáticos, se editan a mano
└── fallback-mundo.svg                          Ilustración cuando no hay WebGL
db/schema.sql     Tablas de D1: question_quota y chat_log
demos/prototipos/ Prototipo original en un solo HTML; queda como referencia (ver su README)
scripts/          brand-assets.mjs
docs/rediseno/    Plan de la migración y registro de decisiones
```

## Cómo correrlo

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # dist/client (estático) + dist/server (Worker)
npm run preview    # sirve el build
npm run cf-typegen # regenera worker-configuration.d.ts tras editar wrangler.jsonc
```

Secretos que usa `/api/chat`, en `.dev.vars` (ignorado por git) y en producción con `wrangler secret put`:

- `IP_SALT`: sal para el hash de las IPs que se guardan en D1.
- `TURNSTILE_SECRET`: clave secreta del widget de Turnstile. Si falta en desarrollo, la verificación se salta.

Bindings declarados en `wrangler.jsonc`: `AI` (Workers AI), `DB` (D1 `portfolio`), `SESSION` (KV) y `ASSETS`. Workers AI no tiene emulación local: con el binding activo, `astro dev` abre una sesión remota (hace falta `npx wrangler login`); sin él, `/api/chat` responde con un stub marcado. La base local se crea con `npx wrangler d1 execute portfolio --local --file=db/schema.sql`.

### Parámetros de URL

| Parámetro | Efecto |
|---|---|
| `?escena=oficina` · `universidad` · `disponible` | Fuerza la escena en vez de seguir el horario. |
| `?debug` | Expone `window.__app` y `window.__world` para inspeccionar desde la consola. |
| `?sinwebgl=1` | Simula un navegador sin WebGL y muestra `fallback-mundo.svg`. |

## Cómo agregar contenido

**Una foto.** Convertir el original a webp de 1600 px de ancho como máximo (con `sharp`, que ya instala Astro) y guardarlo en `public/fotos/`. Agregar la entrada en `src/data/photos.ts`: `src`, `width` y `height` en `PHOTO_BASE` (la proporción decide la celda; `wide`/`tall` la fuerzan) y el pie de foto en `PHOTO_COPY`, en español e inglés, en la misma posición. La lista va de la más nueva a la más vieja.

**Un proyecto.** Capturas en webp (y, si hay, un clip corto `.mp4` con su póster) en `public/proyectos/`. Agregar el proyecto en `src/data/projects.ts`: `id`, `media` y `links` en `PROJECT_BASE`, y el título, la descripción, los `alt` y las etiquetas de los enlaces en el bloque de cada idioma. Los `.mp4` de esa carpeta son la única excepción al `*.mp4` de `.gitignore`.

**Textos de interfaz.** Todo pasa por `src/i18n/ui.ts`; la interfaz `UiCopy` hace que una clave faltante en un idioma sea un error de compilación.

## Marca, SEO y deploy

- `node scripts/brand-assets.mjs` regenera `public/og.png`, `favicon.ico` y `apple-touch-icon.png` a partir de la tecla "FS". Necesita las fuentes Instrument Sans y JetBrains Mono visibles para fontconfig (instaladas o vía `FONTCONFIG_FILE`).
- `public/sitemap.xml` es estático: si cambian las rutas o el `lastmod`, se edita a mano.
- Cada push a `main` despliega con `.github/workflows/deploy.yml` (`npm run deploy`: build + `wrangler deploy`). El flujo de ramas es feature → `develop` → `main`.

## Licencias de terceros

- Los cursores de `public/cursores/` son el set de Windows 7 "Cursor Mania" publicado en rw-designer: licencia de uso personal no comercial, con el dibujo original de Microsoft.
- Las fuentes Instrument Sans y JetBrains Mono se cargan desde Google Fonts (OFL).
- La música de la sorpresa del cazatickets (`public/musica/gymnopedie-no-1.mp3`) es "Gymnopedie No 1" de Kevin MacLeod (incompetech.com), licencia Creative Commons: By Attribution 4.0 (https://creativecommons.org/licenses/by/4.0/), recodificada a 80 kbps.
