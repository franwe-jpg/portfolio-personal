# Prototipo del rediseño

Prototipo navegable del portfolio: entrada con partículas, mundo isométrico en 3D y secciones con scroll. Todo vive en `index.html` (CSS y JS inline, librerías desde CDN con versión fija).

## Cómo correrlo

```bash
# Terminal 1 (opcional): la API real del chat
npm run dev

# Terminal 2: el servidor del prototipo
node demos/prototipos/serve.mjs
```

Abrí <http://localhost:4400>.

`serve.mjs` no tiene dependencias (Node 22):

- sirve `demos/prototipos/`;
- si un archivo no está ahí, lo busca en `public/` (imágenes de `/proyectos/*`, el PDF del informe);
- reenvía `/api/*` a `http://localhost:4321` (`npm run dev`). Si Astro no está corriendo, responde `502 {"error":"dev server offline"}`;
- `GET /__estado` le dice a la página si `/api/chat` responde, sin pedir una URL que falle.

Abrir `index.html` con doble clic (`file://`) también funciona, pero sin imágenes de proyectos (aparece un recuadro con las iniciales) y con el chat en modo ejemplo.

## Qué es real y qué es de ejemplo

| Parte | Estado |
|---|---|
| Barra de carga | Real: descarga three y GSAP con progreso, carga las fuentes y arma el mundo. |
| Páginas | Real: el sitio no hace scroll; son cuatro estados (`inicio`, `mundo`, `proyectos`, `sobre`) con transición de "mancha" y glitch en el título. Al ingresar siempre se cae en `inicio`; el `#hash` solo sirve para atrás/adelante del navegador. `proyectos` y `sobre` hacen scroll adentro de la página. |
| Horario y escena | Real: hora de Argentina. Lunes a viernes 7–13 oficina, 14–19 universidad, el resto disponible. |
| Chat (oficina y universidad) | Real si `npm run dev` está corriendo (`POST /api/chat`). Si no, responde en modo ejemplo y lo marca. |
| Contacto directo (disponible) | De ejemplo: no envía nada porque todavía no existe `/api/contact`. |
| Audio | Real, generado con WebAudio. Solo arranca después de un clic. |

## Parámetros de URL

| Parámetro | Efecto |
|---|---|
| `?escena=oficina` · `universidad` · `disponible` | Fuerza la escena (también se puede elegir en el selector del mundo). |
| `?sinwebgl=1` | Simula un navegador sin WebGL: muestra la ilustración `fallback-mundo.svg`. |
| `?debug` | Expone `window.__world` (cámara, escenas, puntero) para inspeccionar desde la consola. |
| `#inicio` · `#mundo` · `#proyectos` · `#sobre` | Página activa. Lo escribe la navegación (historial del navegador); al cargar no se respeta: la entrada siempre lleva a `inicio`. |

Se pueden combinar: `?escena=disponible&sinwebgl=1`.

## Archivos

- `index.html`: el prototipo.
- `serve.mjs`: servidor de desarrollo.
- `fallback-mundo.svg`: ilustración estática de la oficina para cuando no hay WebGL.
- `entrada-base.html` y `mundo-cartoon-descartado.html`: referencias anteriores (la segunda está descartada).
