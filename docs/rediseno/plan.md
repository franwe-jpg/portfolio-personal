# Plan: migrar el prototipo "mundo 3D" al sitio Astro

## Objetivo y contexto

Llevar el prototipo de `demos/prototipos/index.html` al sitio real en Astro, para que el portfolio nuevo reemplace al actual en francosolersistemas.com. El prototipo ya define el diseño completo: entrada, mundo isométrico con tres dioramas, páginas de proyectos y sobre mí, chat y easter egg. Lo que falta es partirlo en módulos, conectarlo con los datos y la API existentes y dejarlo deployable.

El plan está escrito para que cada tarea se resuelva en una sesión de Claude. Cada tarea dice qué se espera y cómo se verifica. Las reglas permanentes están en `CLAUDE.md`.

## Estado actual

**Prototipo** (`demos/prototipos/index.html`): 4.300 líneas en un solo HTML, con CSS y JS inline. Three.js 0.170 y GSAP 3.12 desde CDN. Contiene:

- Páginas `inicio`, `mundo`, `proyectos` y `sobre`, con transiciones de "mancha" y glitch en el título.
- Tres dioramas (oficina, universidad, casa) con Franco, compañeros, profesor y mascotas; pantallas animadas; escena elegida por horario de Argentina.
- Panel de chat (oficina y universidad) y contacto directo (disponible).
- Easter egg: tickets escondidos y vista sorpresa.
- Audio generado con WebAudio.
- Ilustración SVG de respaldo cuando no hay WebGL.

**Sitio Astro actual** (la primera versión, a reemplazar):

- Componentes en `src/components`: `ChatPanel`, `ProjectsPanel`, `ProfilePanel`, `Intro`, `LandingPage`, `ProjectCard`, `Avatar`, `ViewToggleButton`.
- Lógica en `src/scripts/landing.ts`, estilos en `src/styles/landing.css`.
- Datos en `src/data` (proyectos, perfil). i18n es/en con rutas `/` y `/en/`.
- API `/api/chat` sobre Workers AI, con auditoría en D1 y verificación Turnstile. Esta parte se conserva.

## Mediciones (2026-11-05)

Transferencia por red, comprimida:

| Recurso | En la red | Sin comprimir |
|---|---|---|
| index.html (CSS + JS inline) | 78 KB | 251 KB |
| three 0.170 | 171 KB | 675 KB |
| gsap 3.12 | 25 KB | 71 KB |
| tv.mp4 | 121 KB | 121 KB |
| Imágenes de proyectos | ≈ 250 KB | ≈ 250 KB |
| **Total** | **≈ 0,65 MB** | ≈ 1,4 MB |

Runtime, escena casa (la más cargada): 106 draw calls, 7.700 triángulos, 66 geometrías, 22 programas de shader, heap JS ≈ 14 MB.

Modo celular ya existente: sin sombras, pixel ratio ≤ 1,5, menos personajes. El loop de render solo corre en la página `mundo` con la pestaña visible.

No se midieron fps reales: las capturas headless usan GPU por software. Si hace falta, probar en un celular real.

## Decisiones

- **2026-11-05** — Este repo queda para el sitio nuevo (conserva deploy, dominio, bindings y reglas de `main`). El sitio viejo se archiva en `franwe-jpg/portfolio-v1` con la historia de `main` y `develop`.
- **2026-11-05** — El dominio francosolersistemas.com pasa al portfolio nuevo. El sitio viejo sigue en línea en un subdominio (propuesta: `v1.francosolersistemas.com`) como Worker aparte, con su chat de IA sobre la misma Workers AI de la cuenta (cuota gratuita compartida: 10.000 neuronas/día entre los dos sitios).
- **2026-11-05** — Sin trabajo de optimización por ahora: los números de arriba alcanzan.
- **2026-11-05** — El portfolio viejo entra como proyecto `portfolio-v1`, con seis capturas propias del usuario (`public/proyectos/portfolio-v1-{1..6}.webp`), un clip demo de 45 s (`portfolio-v1-demo.mp4`, excepción en `.gitignore`) y enlace al repo. Para el clip se agregó el tipo de media `clip` en `src/data/projects.ts`, renderizado como `<video>` nativo en `ProjectCard.astro`; en el prototipo, un botón "Ver demo" cambia la imagen por el video.
- **2026-11-05** — Los datos del CV que usa la IA (`src/lib/persona.ts`) se dejan como están en `portfolio-v1`: el sitio sigue en línea con su chat y `portfolio-personal` ya es público con la misma historia. Se sube la historia completa de `main` y `develop`.
- **2026-11-05** — Orden de los proyectos en ambos sitios, del más nuevo al más antiguo: Sistema de Gestión de Restaurante, Portfolio Personal (v1), Aeroclub Trelew, Gestión de Retroalimentación Académica, AtmOS. En el prototipo, la tarjeta pasó a tener una galería con flechas y puntos (todas las imágenes y el clip).
- **2026-11-05** — Plan corto en este archivo. No se usa SDD.

## Pendientes inmediatos

- [x] **Crear el repo `portfolio-v1` y subir la historia.** Hecho el 2026-11-06: repo creado por el usuario, historia de `main` y `develop` subida.

  ```bash
  gh repo create franwe-jpg/portfolio-v1 --public --description "Primer portfolio personal (Astro + Cloudflare Workers AI), en línea en v1.francosolersistemas.com."
  git push git@github.com:franwe-jpg/portfolio-v1.git main:main develop:develop
  ```

- [x] **Commit de subdominio en `portfolio-v1`** (hecho el 2026-11-06 en el clon `~/Proyectos/portfolio-v1`, commit `abb0b8f`, pendiente de push): `wrangler.jsonc` con `name: "portfolio-v1"`, ruta `v1.francosolersistemas.com` (`custom_domain: true`), KV `SESSION` nuevo y D1 propia o la misma `database_id`; README con la URL nueva. Hasta ese commit, el primer push a `main` dispara el workflow y falla por falta del secreto: es esperable.

- [x] **Configurar el deploy de `portfolio-v1`** (hecho el 2026-11-06: token en GitHub, deploy OK con KV `portfolio-v1-session` creado, dominio `v1.francosolersistemas.com` activo, secretos `IP_SALT` y `TURNSTILE_SECRET` cargados, hostname agregado al widget): secreto `CLOUDFLARE_API_TOKEN` en GitHub (el mismo token sirve si tiene permiso de Workers), `wrangler secret put IP_SALT`, `PERSONA_FACTS` y `TURNSTILE_SECRET` en el Worker nuevo, agregar `v1.francosolersistemas.com` a los hostnames del widget de Turnstile, y `d1 execute --remote` del esquema si la D1 es nueva. Actions queda habilitado: el workflow despliega en cada push a `main`.
- [ ] **Commitear el trabajo pendiente en `rediseno/prototipo`**: cambios de dioramas en el prototipo, el tipo de media `clip`, y cambios en `src` (fotos de perfil nuevas, proyectos `gestion-restaurante` y `portfolio-v1` con sus capturas y clip).
- [ ] **Decidir dónde vive `tv.mp4`** (está gitignored). Opciones: excepción en `.gitignore` solo para ese archivo, o alojarlo en assets de Cloudflare / R2 y referenciarlo por URL.

## Fases y tareas

Cada tarea cierra con capturas y sin errores de consola (ver "Criterios de terminado").

### Fase 0 — Preparación

- [ ] **Rama y dependencias.** Crear `rediseno/astro` desde `develop`. Agregar `three` y `gsap` como dependencias npm con versión fija.
  - Resultado esperado: `npm run build` pasa; `three` y `gsap` importables desde `src`.
  - Cómo se verifica: `npm run build` y `npm run preview` levantan sin errores.
- [ ] **Limpieza del sitio viejo.** Quitar los componentes que no sobreviven (`ChatPanel`, `ProjectsPanel`, `ProfilePanel`, `Intro`, `LandingPage`, `ProjectCard`, `Avatar`, `ViewToggleButton`) y `landing.ts` / `landing.css`. Conservar `src/pages/api`, `src/data`, `src/i18n` y `src/lib`.
  - Resultado esperado: `/` y `/en/` renderizan una página mínima; `/api/chat` sigue respondiendo.
  - Cómo se verifica: `npm run build`; `curl` a `/api/chat` en dev responde JSON.

### Fase 1 — Esqueleto

- [ ] **Layout y router.** Layout Astro con las cuatro páginas (`inicio`, `mundo`, `proyectos`, `sobre`), estado y router en `src/scripts` (historial con `#hash`, transición de mancha, glitch del título).
  - Resultado esperado: navegación entre las cuatro páginas con las mismas transiciones del prototipo, sin mundo 3D todavía.
  - Cómo se verifica: capturas de cada página en escritorio y celular; atrás/adelante del navegador funcionan.
- [ ] **Estilos.** Mover el CSS del prototipo a `src/styles`, separado por área (base, entrada, mundo, páginas, panel).
  - Resultado esperado: el esqueleto se ve igual al prototipo en las páginas ya migradas.
  - Cómo se verifica: comparación de capturas prototipo vs. Astro.
- [ ] **Textos.** Extraer los textos del prototipo a `src/i18n/ui.ts` (español primero; inglés en la fase 9).
  - Resultado esperado: ningún texto de interfaz hardcodeado en componentes.
  - Cómo se verifica: `grep` de textos en `src/components` y `src/scripts` no encuentra copys sueltos.

### Fase 2 — Entrada

- [ ] **Entrada completa.** Logo key-cap con partículas que siguen el cursor, barra de carga real (descarga de librerías, fuentes, armado del mundo), botón "Ingresar" y toggle de audio.
  - Resultado esperado: misma entrada que el prototipo; el audio arranca solo después de un clic.
  - Cómo se verifica: capturas de la entrada antes y después de cargar; sin errores de consola.

### Fase 3 — Mundo base

- [ ] **Renderer y cámara.** Renderer, rig isométrico con órbita y zoom, luces, fog, losa y paredes base, polvo flotante. Import dinámico de `three` al entrar a `mundo`.
  - Resultado esperado: una losa vacía navegable con la misma cámara del prototipo; `three` no se descarga hasta entrar al mundo.
  - Cómo se verifica: captura del mundo; en la pestaña de red, `three` aparece solo al entrar a `mundo`.
- [ ] **Escenas por horario y respaldo.** Elección de escena por hora de Argentina (lunes a viernes 7–13 oficina, 14–19 universidad, resto disponible), selector manual, parámetro `?escena=`, y la ilustración SVG cuando no hay WebGL.
  - Resultado esperado: las tres losas cambian con el selector y con `?escena=`; `?sinwebgl=1` muestra el SVG.
  - Cómo se verifica: capturas con los tres valores de `?escena=` y con `?sinwebgl=1`.

### Fase 4 — Figuras y props

- [ ] **Figura base.** `figure()` con sus poses (`typing`, `writing`, `phone`, `standing`, `relaxed`) y opciones (`glasses`, `watch`, `curly`, `recede`, `long`, `collar`, `lapel`). Franco con su hit box, anillo y estática de tele al pasar el mouse.
  - Resultado esperado: Franco y los presets de gente secundaria idénticos al prototipo.
  - Cómo se verifica: primeros planos de Franco de frente y de espalda, y de un personaje con cada opción.
- [ ] **Props y batching.** `Batch` por material, muebles (escritorios, sillas, notebooks, monitores, sofás, bibliotecas, pupitres, mesas), plantas, mascotas (`makeDog`, `makeCat` con poses `sit`, `sleep`, `eat` y manchas).
  - Resultado esperado: todos los helpers del prototipo disponibles en un módulo, con el mismo conteo de draw calls.
  - Cómo se verifica: `renderer.info` en una escena de prueba con draw calls equivalentes al prototipo.

### Fase 5 — Dioramas

- [ ] **Oficina.** Dos islas con cuatro puestos (notebook, doble monitor, silla giratoria), Franco enfrentado a la chica de pelo naranja, chico de chomba marrón enfrentado a la chica de rulos, rack con LEDs, rincón del café, tele con panel, pizarra. Monitores de Franco con código tipeado y terminal.
  - Resultado esperado: igual al prototipo, incluidas las pantallas animadas.
  - Cómo se verifica: captura general y primeros planos de las dos islas.
- [ ] **Universidad.** Pizarrón con las tres diapositivas de Bases de Datos II (SQL distribuido, álgebra relacional, fragmentación) y la pintada "PARISE CRACK" abajo a la izquierda; pantalla de proyección sincronizada; profesor con entradas; pupitres con notebooks y cuadernos alternados; banco de Franco con notebook y tupper.
  - Resultado esperado: igual al prototipo; las diapositivas rotan cada 6 s.
  - Cómo se verifica: tres capturas del pizarrón (una por diapositiva), captura de los bancos.
- [ ] **Casa.** Sofás, tele con `tv.mp4` (o bandas de color si falla), lámpara, luna, cartel "EN LÍNEA", caniche negro en el sofá en L, gato blanco con manchas en el respaldo, gato negro comiendo contra la pared izquierda, Franco con el celular.
  - Resultado esperado: igual al prototipo; el video reproduce solo con la escena activa y a la vista.
  - Cómo se verifica: captura general, primeros planos de los dos sofás y del plato; el video pausa al cambiar de página.

### Fase 6 — Interacción

- [ ] **Vista POV.** Al tocar a Franco la cámara pasa detrás de él y mira lo que él mira (monitores, profesor y pantalla, tele); etiqueta "tocá para hablar"; estática de tele con el mouse encima.
  - Resultado esperado: misma transición y encuadres del prototipo en las tres escenas.
  - Cómo se verifica: captura en POV de cada escena.
- [ ] **Panel de chat y contacto.** Panel de chat conectado a `/api/chat` (oficina y universidad), con Turnstile y auditoría en D1 como hoy; modo contacto directo en "disponible".
  - Resultado esperado: una pregunta real recibe respuesta de Workers AI; en dev sin bindings, usa el stub existente.
  - Cómo se verifica: captura del panel con una respuesta; registro en D1 en dev.

### Fase 7 — Proyectos y Sobre mí

- [ ] **Página de proyectos.** Tarjetas desde `src/data/projects.ts` (incluido `portfolio-v1`), carrusel con imágenes y video de YouTube, overlay de "próximamente".
  - Resultado esperado: los cinco proyectos actuales con sus medios y enlaces.
  - Cómo se verifica: captura de la página completa; cada enlace responde.
- [ ] **Página sobre mí.** Servicios, trayectoria y foto desde `src/data/profile.ts`, con reveals al scrollear.
  - Resultado esperado: igual al prototipo, con datos del archivo y no hardcodeados.
  - Cómo se verifica: captura de la página; `grep` de datos personales en componentes no encuentra copys sueltos.

### Fase 8 — Easter egg

- [ ] **Tickets y sorpresa.** Tickets escondidos (entrada, cada escena), persistencia en `localStorage`, vista sorpresa cuando se juntan todos, pantallas con el contenido sorpresa.
  - Resultado esperado: igual al prototipo.
  - Cómo se verifica: captura de un ticket encontrado y de la vista sorpresa.

### Fase 9 — Inglés, SEO y accesibilidad

- [ ] **Inglés.** Ruta `/en/` con todos los textos nuevos traducidos, incluido el chat y los dioramas que muestran texto.
  - Resultado esperado: `/en/` completo, sin textos en español.
  - Cómo se verifica: capturas de las cuatro páginas en `/en/`.
- [ ] **SEO y meta.** Título, descripción, Open Graph, favicon, `robots`, `sitemap`.
  - Resultado esperado: metadatos correctos en ambos idiomas.
  - Cómo se verifica: `curl` del HTML y validación de las etiquetas.
- [ ] **Accesibilidad.** `prefers-reduced-motion` respetado, navegación por teclado en las cuatro páginas y en el panel, foco visible, `alt` en todas las imágenes.
  - Resultado esperado: sin trampas de foco; con movimiento reducido no hay animaciones continuas.
  - Cómo se verifica: recorrido con `Tab` grabado en capturas; captura con `prefers-reduced-motion: reduce`.

### Fase 10 — Cierre

- [ ] **Limpieza y README.** Decidir si `demos/prototipos` se borra o queda como archivo de referencia. Actualizar el README con el sitio nuevo.
  - Resultado esperado: README describe el sitio nuevo; sin código muerto.
  - Cómo se verifica: lectura del README; `npm run build` sin advertencias.
- [ ] **PR y deploy.** PR `develop → main`, deploy por CI, revisión en producción y prueba en un celular real.
  - Resultado esperado: francosolersistemas.com sirve el sitio nuevo.
  - Cómo se verifica: capturas de producción en escritorio y celular; chat respondiendo en producción.

## Criterios de "terminado" (para toda tarea)

- Cero errores de consola en las capturas.
- Capturas adjuntas al reporte, con ruta absoluta.
- Verificado en español e inglés cuando la tarea toca textos.
- Verificado en viewport de celular (390 px) además de escritorio.
- `npm run build` pasa.

## Fuera de alcance

- Optimizaciones de rendimiento.
- Contenido nuevo que no esté en el prototipo.
