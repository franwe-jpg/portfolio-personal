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
- **2026-11-06** — Reloj de pared en los tres mapas (universidad: pared del fondo x=0; casa: pared del fondo x=3.0, a mitad entre la tele y el extremo derecho; oficina: pared izquierda z=1.0, entre la pizarra y el escritorio de Franco), cara blanca con números y agujas negras, partículas blancas fuertes, y al pasar el mouse un anillo con la misma estática gris de Franco, pegado a la circunferencia. El marco de la tele usa esa misma estática, pegado al bisel, con la misma densidad de ruido (la textura se repite por unidad de escena). Al volver, en el ciclo, al mapa que corresponde a la hora real, el modo vuelve a automático y el reloj marca la hora real otra vez. Marca la hora real de Argentina (UTC-3 fijo) en modo auto; con una escena elegida a mano marca su hora típica (oficina 9:00, universidad 16:00, casa 21:00), con el segundero siempre en marcha. Un anillo de partículas verdes orbita el reloj para invitar al toque; al tocarlo las agujas giran hasta la hora destino, las partículas estallan y la escena cambia con la cortina de celdas: casa → oficina → universidad → casa. Ventanas: resplandor cálido en el vidrio, foco de sol y mancha de luz en el piso en la oficina (más suave en la universidad); en la casa media luna cortada por el marco, halo y luz lunar azulada. El mundo tiene detrás el mismo campo de glifos que las páginas de papel, en tema oscuro, con el canvas WebGL transparente.
- **2026-11-06** — Sorpresa del cazatickets: ya no queda fija en las pantallas al completar la búsqueda. Se muestra solo durante la vista de sorpresa y mientras está abierto el chat que esa vista abre; al cerrar el chat, volver al mundo o cambiar de página, las pantallas vuelven a lo que mostraban (código y terminal en la oficina, diapositiva en la universidad, video en la casa). Se vuelve a ver desde "Ver sorpresa" en el panel rojo de inicio. En la casa el video de YouTube sigue sonando de fondo mientras la tele muestra la frase. Bug corregido: el canvas de glifos usaba la clase `.field`, igual que los campos del formulario de contacto, y rompía el panel de la casa; ahora es `.glyph-field`.
- **2026-11-06** — Tele del living: barra de volumen arrastrable arriba de la pantalla (reemplaza el cartel "EN LÍNEA"), arranca en la mitad; el embed carga muteado para poder autoreproducir y recibe `unMute` + `setVolume` por `postMessage` al cargar y en cada arrastre. Al pasar el mouse por la pantalla aparece un borde pixelado gris y el clic abre el video en YouTube en otra pestaña. El mueble pasa a 3.4 de ancho, sin la consola negra; en el extremo derecho va una consola blanca acostada con la rejilla redonda negra arriba.
- **2026-11-06** — La tele del living pasa un video de YouTube (`Y3FEZJz55T0`) con el reproductor oficial embebido desde `youtube-nocookie.com` (muted, loop, sin controles, sin eventos de puntero). Como un iframe no puede ser textura WebGL, va en una capa CSS3D sobre el canvas, posicionada con la misma cámara (la matemática del `CSS3DRenderer` de Three, inline). Se monta recién al activarse la casa, se pausa con `postMessage` al salir, y se oculta en el modo sorpresa. Debajo queda el canvas de bandas de color como respaldo si el reproductor está bloqueado. `tv.mp4` y el `<video>` quedan eliminados. Advertencia: en Chromium headless con swiftshader, cargar el reproductor hace perder el contexto WebGL; las capturas de la casa se hacen bloqueando `youtube` con `page.route`.
- **2026-11-06** — Cursor: se elimina el anillo grande rezagado; queda solo el círculo chico. En el mundo, la rueda sola hace zoom (antes exigía Ctrl). El puntero es el set real de Windows 7 que trajo el usuario (`demos/prototipos/cursores/`, convertido de .cur/.ani a PNG con sus puntos calientes): flecha normal; mano en enlaces y botones; I en inputs; lapicera en textareas; prohibido en botones deshabilitados; mover al arrastrar el mundo; persona sobre Franco; ubicación sobre el reloj; precisión sobre la barra de volumen; ayuda en la pestaña "ábreme"; flecha alterna en los botones de volver; redimensionar vertical en el asa del panel y horizontal en las flechas de las galerías. Las dos animaciones (ocupado y trabajando en segundo plano, 18 cuadros) se usan como cursor de espera. Licencia del pack (rw-designer, "Cursor Mania"): solo uso personal no comercial, y el dibujo original es de Microsoft; queda a criterio del usuario mantenerlo en producción. La idea de íconos tipo Buscaminas quedó descartada. El círculo chico que sigue al puntero mantiene siempre el mismo tamaño (antes crecía sobre enlaces y tapaba lo de atrás). Cuando una espera supera 0,5 s (carga inicial, cambio de escena, transición de página, respuesta del chat) el puntero nativo se oculta y aparecen los cuadros del anillo "ocupado" de Windows 7 (o "trabajando en segundo plano" durante la carga inicial).
- **2026-11-06** — Las tarjetas de proyectos ya no se inclinan ni hacen zoom al pasar el mouse (dificultaba la lectura). En su lugar, las páginas de papel (`proyectos` y `sobre`) tienen un campo de glifos dormidos en el fondo, con la misma tipografía, glifos y verde que la lluvia de inicio: el cursor lleva un halo que "decodifica" los glifos que pasa (tinta en el centro, verde en el borde) y deja una estela que se apaga. Una veladura de papel sobre la columna de contenido lo atenúa bajo el texto y lo deja pleno en los márgenes. En táctil el halo aparece al tocar y se apaga solo; con `prefers-reduced-motion` queda solo la trama estática.
- **2026-11-07** — Casa: el halo de la luna ya no se derrama sobre la pared. `windowGlow` acepta foco y alcance dentro del vidrio y el plano aditivo mide exactamente la abertura de la ventana (z −1.6..0.6, y 1.0..2.5), con la luna en el borde derecho. Oficina y universidad quedan igual (valores por defecto).
- **2026-11-07** — Sección "Fotos" en Sobre mí, antes de "Qué hago": grilla densa de 5 columnas (2 en celular), apaisadas ocupan dos columnas y verticales dos filas, pie de foto al pasar el mouse. Las fotos viven en el repo, en `public/fotos/`, convertidas a webp de 1600 px de ancho máximo (≈150–300 KB cada una) con `sharp` (ya instalado por Astro); los originales del celular no se suben. Si la galería supera las ~50 fotos o se quieren originales, pasar a un bucket R2 de Cloudflare con dominio propio. En el prototipo, la lista `PHOTOS` dibuja huecos punteados para las fotos que todavía no existen.

## Pendientes inmediatos

- [x] **Crear el repo `portfolio-v1` y subir la historia.** Hecho el 2026-11-06: repo creado por el usuario, historia de `main` y `develop` subida.

  ```bash
  gh repo create franwe-jpg/portfolio-v1 --public --description "Primer portfolio personal (Astro + Cloudflare Workers AI), en línea en v1.francosolersistemas.com."
  git push git@github.com:franwe-jpg/portfolio-v1.git main:main develop:develop
  ```

- [x] **Commit de subdominio en `portfolio-v1`** (hecho el 2026-11-06 en el clon `~/Proyectos/portfolio-v1`, commit `abb0b8f`, pendiente de push): `wrangler.jsonc` con `name: "portfolio-v1"`, ruta `v1.francosolersistemas.com` (`custom_domain: true`), KV `SESSION` nuevo y D1 propia o la misma `database_id`; README con la URL nueva. Hasta ese commit, el primer push a `main` dispara el workflow y falla por falta del secreto: es esperable.

- [x] **Configurar el deploy de `portfolio-v1`** (hecho el 2026-11-06: token en GitHub, deploy OK con KV `portfolio-v1-session` creado, dominio `v1.francosolersistemas.com` activo, secretos `IP_SALT` y `TURNSTILE_SECRET` cargados, hostname agregado al widget): secreto `CLOUDFLARE_API_TOKEN` en GitHub (el mismo token sirve si tiene permiso de Workers), `wrangler secret put IP_SALT`, `PERSONA_FACTS` y `TURNSTILE_SECRET` en el Worker nuevo, agregar `v1.francosolersistemas.com` a los hostnames del widget de Turnstile, y `d1 execute --remote` del esquema si la D1 es nueva. Actions queda habilitado: el workflow despliega en cada push a `main`.
- [x] **Commitear el trabajo pendiente en `rediseno/prototipo`.** Hecho el 2026-11-07: los cambios de `src` ya estaban en `6fc3c2f`; el resto (relojes, cursores, tele con YouTube, campos de glifos, sección de fotos y luna) va en un commit y en el PR `rediseno/prototipo → develop`.
- [x] **Decidir dónde vive `tv.mp4`.** Resuelto el 2026-11-06: ya no se usa. La tele pasa un video de YouTube con el reproductor oficial embebido (ver Decisiones).

## Fases y tareas

Cada tarea cierra con capturas y sin errores de consola (ver "Criterios de terminado").

### Fase 0 — Preparación

- [x] **Rama y dependencias.** Hecho el 2026-11-07: `rediseno/astro` creada desde `rediseno/prototipo` (que ya contiene `develop`, con el PR #3 abierto); `three@0.170.0` y `gsap@3.12.5` fijadas en `package.json`, `npm run build` y `npm run preview` pasan.
  - Resultado esperado: `npm run build` pasa; `three` y `gsap` importables desde `src`.
  - Cómo se verifica: `npm run build` y `npm run preview` levantan sin errores.
- [x] **Limpieza del sitio viejo.** Hecho el 2026-11-07: borrados `src/components/*`, `src/scripts/landing.ts` y `src/styles/landing.css`. `Layout.astro` conserva metadatos, hreflang y la redirección por idioma (sin el script de tema claro/oscuro ni el CSS viejo); `/` y `/en/` muestran nombre y rol desde `src/data/profile.ts`. Se conservan `src/pages/api`, `src/data`, `src/i18n`, `src/lib` y `src/assets`.
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
- [ ] **Casa.** Sofás, tele con el video de YouTube embebido (o bandas de color si falla), lámpara, luna, cartel "EN LÍNEA", caniche negro en el sofá en L, gato blanco con manchas en el respaldo, gato negro comiendo contra la pared izquierda, Franco con el celular.
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
- [ ] **Página sobre mí.** Servicios, trayectoria y foto desde `src/data/profile.ts`, sección "Fotos" desde `src/data/photos.ts` (archivos en `public/fotos/`), con reveals al scrollear.
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
