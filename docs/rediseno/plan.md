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
- **2026-11-07** — Inglés (fase 9): los textos dibujados dentro de los dioramas que forman parte de la ambientación argentina quedan en español en los dos idiomas: las diapositivas de la pizarra de la universidad ("Bases de Datos II", "SQL en sitios distribuidos", "PARISE CRACK"), el código y la terminal del monitor de la oficina y el dashboard del segundo monitor. Son escenografía, no interfaz, y se dibujan en canvas, así que el HTML de `/en/` queda limpio. Sí se traduce lo que el visitante lee como mensaje: la frase y los rótulos de la sorpresa, el título del reproductor de la tele, la etiqueta "tocá para hablar" y el reloj. El parámetro `?escena=` también sigue en español (es una URL compartible, no un texto). El enlace ES/EN va en la cabecera con el mismo estilo mono de la navegación; v1 tenía solo el redireccionamiento automático, el prototipo no tenía selector.
- **2026-11-07** — Casa: el halo de la luna ya no se derrama sobre la pared. `windowGlow` acepta foco y alcance dentro del vidrio y el plano aditivo mide exactamente la abertura de la ventana (z −1.6..0.6, y 1.0..2.5), con la luna en el borde derecho. Oficina y universidad quedan igual (valores por defecto).
- **2026-11-07** — Sección "Fotos" en Sobre mí, antes de "Qué hago": grilla densa de 5 columnas (2 en celular), apaisadas ocupan dos columnas y verticales dos filas, pie de foto al pasar el mouse. Las fotos viven en el repo, en `public/fotos/`, convertidas a webp de 1600 px de ancho máximo (≈150–300 KB cada una) con `sharp` (ya instalado por Astro); los originales del celular no se suben. Si la galería supera las ~50 fotos o se quieren originales, pasar a un bucket R2 de Cloudflare con dominio propio. En el prototipo, la lista `PHOTOS` dibuja huecos punteados para las fotos que todavía no existen.
- **2026-11-07** — Cazatickets (fase 8): la sorpresa vive en el chunk del mundo (`world/surprise.ts`) y la búsqueda en el principal (`hunt.ts`), que le habla por `handle.ts` como el panel; `HUNT_TOTAL` queda en `state.ts` porque lo comparten los dos chunks. El cierre del chat avisa por `app:panelclose` (ya existía) y el cambio de diorama por un evento nuevo, `app:scene`, que emite `switchScene`: si el horario cambia la escena en medio de la sorpresa, la vista termina y las pantallas vuelven (la toma apuntaba a la pantalla del mapa anterior). La frase y los rótulos de las pantallas salen de `ui.ts` (`hunt.surprise`, `hunt.screenHeader`, `hunt.ticketFound`, `hunt.ticket`) y la firma del nombre del panel (`panel.who.franco`), así la fase 9 los traduce sin tocar el mundo. Advertencia para las capturas: `addInitScript` de Playwright corre también en los iframes del mismo origen que crea Turnstile; sembrar `localStorage` hay que hacerlo solo en `window.top`. Y cada `screenshot` o `evaluate` desde Node cuesta ≈ 1 s con swiftshader: el chat abre ≈ 10 s después del quinto ticket, así que para afirmar qué pasa en el medio conviene registrar eventos y clases de `body` desde adentro de la página (`MutationObserver`) y leer el registro al final. En Astro el mundo arma recién al visitar `mundo`, por eso "Ver sorpresa" espera `worldLoaded()` (`stage.ts`) antes de encuadrar.
- **2026-11-07** — Carrusel de proyectos (fase 7): el prototipo no tiene la demo de AtmOS dentro de la galería (solo el enlace "Ver demo"); el sitio Astro conserva el tipo de media `video` de la v1 y lo muestra como reproductor de YouTube embebido (`youtube-nocookie.com`, `enablejsapi`) dentro de la pista, con los puntos ocultos encima igual que sobre el clip. El `src` del iframe se asigna la primera vez que la galería llega a esa diapositiva: con `loading="lazy"` Chromium lo cargaba igual detrás de la entrada (≈1 MB del reproductor y una advertencia "No available adapters" del propio reproductor en consola).
- **2026-11-07** — Esqueleto Astro (fase 1). El sitio es un solo documento: `src/components/App.astro` compone todas las áreas y lo usan `/` y `/en/` con una prop `lang`. Los módulos de `src/scripts` se comunican por `state.ts` (estado único) y tres eventos en `document` (`app:enter`, `app:navigate`, `app:pageswap`) en vez de llamarse entre sí: el router no conoce la lluvia, los campos de glifos, los reveals ni el mundo; cada uno escucha `app:pageswap`. Así las fases siguientes (audio, mundo, panel, tickets) agregan módulos sin tocar el router. Los textos de interfaz viven en `src/i18n/ui.ts` y los scripts eligen el idioma por `<html lang>`; el contenido (bio, trayectoria, servicios, fotos) vive en `src/data` y se renderiza en build. La entrada es provisoria: sin partículas ni barra de carga real (fase 2), pero con la misma animación de ingreso. `gsap` se importa estático desde npm. Las tarjetas de proyectos ya se renderizan desde `src/data/projects.ts` (galería sin comportamiento hasta la fase 7). Advertencia para las capturas: con swiftshader el filtro SVG de la mancha deja cuadros de más de 500 ms y el *lag smoothing* de GSAP estira la transición; entre un `goBack()` y el siguiente hay que esperar unos 4 s.
- **2026-11-07** — Mundo 3D en Astro (fase 3): `three` y los módulos de `src/scripts/world/` viven en un chunk aparte que `src/scripts/stage.ts` importa recién al navegar a `mundo` (como pide el plan; la decisión de precargar en la entrada queda descartada). Mientras el chunk no existe, los módulos que corren antes (selector de escena, panel, tickets) hablan con el mundo por `src/scripts/world/handle.ts` (`world` nulo hasta que arma, y en modo respaldo). Consecuencia para las capturas: `window.__world` aparece recién después de entrar a `mundo`, no antes de `#enter` como en el prototipo. Un módulo por asunto: `config` (SCENE_X, MOBILE, FOV), `materials`, `primitives` (geometrías unitarias, `mesh`, `at`), `batch`, `textures` (canvas, estática), `walls` (losa, paredes, halo), `lights`, `css3d`, `renderer`, `camera` (rig, órbita, parallax, POV), `dust`, `input` (arrastre, rueda, pinza), `scenes/{office,university,home}` e `index` (armado, loop, vistas).

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

- [x] **Layout y router.** Hecho el 2026-11-07: `App.astro` compone la entrada, el escenario, las cuatro páginas, el panel y la búsqueda de tickets (marcado estático) para `/` y `/en/`; en `src/scripts` quedan `state.ts`, `router.ts` (hash, mancha, glitch), `gate.ts` (entrada mínima), `scene.ts`, `rain.ts`, `glyph-field.ts`, `reveals.ts`, `hero.ts`, `cursor.ts`; atrás/adelante verificados con Playwright. Layout Astro con las cuatro páginas (`inicio`, `mundo`, `proyectos`, `sobre`), estado y router en `src/scripts` (historial con `#hash`, transición de mancha, glitch del título).
  - Resultado esperado: navegación entre las cuatro páginas con las mismas transiciones del prototipo, sin mundo 3D todavía.
  - Cómo se verifica: capturas de cada página en escritorio y celular; atrás/adelante del navegador funcionan.
- [x] **Estilos.** Hecho el 2026-11-07: CSS del prototipo copiado línea por línea a `src/styles/{base,gate,world,pages,panel}.css` (solo cambian las URL de los cursores a `/cursores/`); capturas de las cuatro páginas iguales al prototipo en 1280 y 390 px. Mover el CSS del prototipo a `src/styles`, separado por área (base, entrada, mundo, páginas, panel).
  - Resultado esperado: el esqueleto se ve igual al prototipo en las páginas ya migradas.
  - Cómo se verifica: comparación de capturas prototipo vs. Astro.
- [x] **Textos.** Hecho el 2026-11-07: `src/i18n/ui.ts` reescrito con todos los textos de interfaz del prototipo (inglés reutiliza el español hasta la fase 9); el contenido pasa a `src/data/profile.ts` (bio, datos, trayectoria, servicios, herramientas) y `src/data/photos.ts`; `grep` de textos en `src/components` y `src/scripts` no encuentra copys sueltos. Extraer los textos del prototipo a `src/i18n/ui.ts` (español primero; inglés en la fase 9).
  - Resultado esperado: ningún texto de interfaz hardcodeado en componentes.
  - Cómo se verifica: `grep` de textos en `src/components` y `src/scripts` no encuentra copys sueltos.

### Fase 2 — Entrada

- [x] **Entrada completa.** Hecho el 2026-11-07: `src/scripts/particles.ts` (logo key-cap con el ojo y las partículas, fases boot/solid/leave), `loader.ts` (barra real: `loadThree()` importa `three` dinámicamente desde npm y cachea la promesa, fuentes con `document.fonts.load`, y `registerBootStep(clave, paso)` para que la fase 3 enganche el armado del mundo en el último 10 % de la barra; `gsap` sigue estático porque el router lo necesita de entrada), `audio.ts` (motor WebAudio del prototipo: pad, tick, whoosh, chime; el `AudioContext` se crea solo dentro del clic) y `gate.ts` completo (botón ocupado mientras carga, cursor "trabajando", ícono de pestaña con el ojo). Decisión sobre `three`: la entrada lo precarga para que la barra sea honesta y el mundo arme al instante; como la importación vive en una sola función cacheada, la fase 3 puede llamarla desde la entrada o recién al entrar a `mundo`. Verificado con capturas antes de cargar, con el botón listo y el primer cuadro al entrar, en 1280 y 390 px, y `__app.audio.unlocked` falso antes del clic y verdadero después. Logo key-cap con partículas que siguen el cursor, barra de carga real (descarga de librerías, fuentes, armado del mundo), botón "Ingresar" y toggle de audio.
  - Resultado esperado: misma entrada que el prototipo; el audio arranca solo después de un clic.
  - Cómo se verifica: capturas de la entrada antes y después de cargar; sin errores de consola.

### Fase 3 — Mundo base

- [x] **Renderer y cámara.** Hecho el 2026-11-07: `src/scripts/world/` (config, materials, primitives, batch, textures, walls, lights, css3d, renderer, camera, dust, input, index y `scenes/*` con las tres losas vacías) y `src/scripts/stage.ts`, que importa el mundo de forma dinámica la primera vez que se navega a `mundo` (la descarga arranca con la transición y el cursor ocupado cubre el armado); la entrada ya no precarga `three`. Verificado: el chunk `world` (696 KB, con `three`) aparece en la red solo al entrar a `mundo`; captura de la losa con el mismo encuadre, luz de ventana y polvo que el prototipo, en 1280 y 390 px. Renderer, rig isométrico con órbita y zoom, luces, fog, losa y paredes base, polvo flotante. Import dinámico de `three` al entrar a `mundo`.
  - Resultado esperado: una losa vacía navegable con la misma cámara del prototipo; `three` no se descarga hasta entrar al mundo.
  - Cómo se verifica: captura del mundo; en la pestaña de red, `three` aparece solo al entrar a `mundo`.
- [x] **Escenas por horario y respaldo.** Hecho el 2026-11-07: `src/scripts/scene.ts` cambia de escena detrás de la cortina de celdas (`src/scripts/world/curtain.ts`, DOM puro, también sirve sin mundo) y le avisa al mundo por `handle.ts`; `src/scripts/world/fallback.ts` muestra el SVG cuando no hay WebGL, si el chunk no baja (nota "sin conexión" en `ui.ts`), si el armado falla o si se pierde el contexto. Verificado: capturas con los tres valores de `?escena=`, cambio en vivo con la cortina (la URL pasa a `?escena=disponible`) y `?sinwebgl=1` sin descargar `three` y sin avisos de consola. Elección de escena por hora de Argentina (lunes a viernes 7–13 oficina, 14–19 universidad, resto disponible), selector manual, parámetro `?escena=`, y la ilustración SVG cuando no hay WebGL.
  - Resultado esperado: las tres losas cambian con el selector y con `?escena=`; `?sinwebgl=1` muestra el SVG.
  - Cómo se verifica: capturas con los tres valores de `?escena=` y con `?sinwebgl=1`.

### Fase 4 — Figuras y props

- [x] **Figura base.** Hecho el 2026-11-07: `src/scripts/world/figure.ts` (geometrías, poses, `figure()`, `makeFranco` con hit box, anillo, insignia, celular y ancla del cartel, estática "sin señal" con `setStatic`, presets y `makePerson`); Franco y la gente secundaria ya sentados en los tres mapas; `input.ts` suma hover (estática, cursor persona, cartel caliente) y toque sobre Franco, que emite `app:talk` para el panel de la fase 6; el loop proyecta el cartel y tiñe el borde. Verificado con primeros planos de Franco de frente, de espalda y con la estática, y de la chica de pelo largo, el chico de lentes con chomba, la chica de rulos con saco y el profesor con entradas, iguales al prototipo con el mismo rig. `figure()` con sus poses (`typing`, `writing`, `phone`, `standing`, `relaxed`) y opciones (`glasses`, `watch`, `curly`, `recede`, `long`, `collar`, `lapel`). Franco con su hit box, anillo y estática de tele al pasar el mouse.
  - Resultado esperado: Franco y los presets de gente secundaria idénticos al prototipo.
  - Cómo se verifica: primeros planos de Franco de frente y de espalda, y de un personaje con cada opción.
- [x] **Props y batching.** Hecho el 2026-11-07: `src/scripts/world/props.ts` (sillas, notebook, monitores dobles, taza, cafetera, dispenser, mueble y panel de tele, alfombra, planta, mochila, sofá, pupitre, biblioteca, mesa redonda) y `pets.ts` (`makeDog`, `makeCat` con `sit`, `sleep`, `eat` y manchas); los tres mapas ya tienen todo su mobiliario estático y las mascotas de la casa. Verificado con `renderer.info` contra el prototipo: mallas batcheadas por escena iguales (oficina 21/21, universidad 18/18, casa 20/20); draw calls 152/181/105 contra 164/193/120, y la diferencia son las pantallas, LEDs, relojes, tele y lámpara que llegan con cada diorama de la fase 5. `Batch` por material, muebles (escritorios, sillas, notebooks, monitores, sofás, bibliotecas, pupitres, mesas), plantas, mascotas (`makeDog`, `makeCat` con poses `sit`, `sleep`, `eat` y manchas).
  - Resultado esperado: todos los helpers del prototipo disponibles en un módulo, con el mismo conteo de draw calls.
  - Cómo se verifica: `renderer.info` en una escena de prueba con draw calls equivalentes al prototipo.

### Fase 5 — Dioramas

- [x] **Oficina.** Hecho el 2026-11-07: `scenes/office.ts` completo (islas, puestos, rack con LEDs instanciados, estantes, rincón del café, tele con el panel de producción, pizarra, mesita) más `screens.ts` (código tipeado, terminal, panel; también las diapositivas y las bandas de la tele para las dos tareas siguientes), `clock.ts` (reloj de pared con partículas, giro y contorno de estática; `realMinutes`/`clockMinutes`/`CLOCK_NEXT` en `schedule.ts`) y el toque/hover del reloj en `input.ts`, que llama a `setMode`. Verificado: captura general y primeros planos de las dos islas y de los monitores iguales al prototipo; `renderer.info` idéntico (164 draw calls, 7.812 triángulos, 54 geometrías); un clic real sobre el reloj gira las agujas y cambia a la universidad con la cortina. Dos islas con cuatro puestos (notebook, doble monitor, silla giratoria), Franco enfrentado a la chica de pelo naranja, chico de chomba marrón enfrentado a la chica de rulos, rack con LEDs, rincón del café, tele con panel, pizarra. Monitores de Franco con código tipeado y terminal.
  - Resultado esperado: igual al prototipo, incluidas las pantallas animadas.
  - Cómo se verifica: captura general y primeros planos de las dos islas.
- [x] **Universidad.** Hecho el 2026-11-07: `scenes/university.ts` completo (pizarrón con las tres diapositivas de `screens.ts` y la pintada, pantalla de proyección sincronizada, proyector con su cono de luz que se oculta en POV vía `onFocus`, profesor, pupitres, banco de Franco, atril, biblioteca, reloj en la pared del fondo). Verificado: tres capturas del pizarrón (una por diapositiva, con la pantalla a juego), captura de los bancos y `renderer.info` idéntico al prototipo (193 draw calls, 7.254 triángulos, 49 geometrías). Advertencia para las capturas: el loop acota `dt` a 0,05 s por cuadro (igual que el prototipo), así que con swiftshader el tiempo del mundo corre a ≈ un tercio del real y la diapositiva 2 aparece recién a los ~30 s de reloj. Pizarrón con las tres diapositivas de Bases de Datos II (SQL distribuido, álgebra relacional, fragmentación) y la pintada "PARISE CRACK" abajo a la izquierda; pantalla de proyección sincronizada; profesor con entradas; pupitres con notebooks y cuadernos alternados; banco de Franco con notebook y tupper.
  - Resultado esperado: igual al prototipo; las diapositivas rotan cada 6 s.
  - Cómo se verifica: tres capturas del pizarrón (una por diapositiva), captura de los bancos.
- [x] **Casa.** Hecho el 2026-11-07: `scenes/home.ts` completo (tele con las bandas de color de `screens.ts` debajo del reproductor de YouTube en la capa CSS3D, que se monta recién al activarse la casa, se pausa por `postMessage` al salir y se oculta en la sorpresa; borde de estática al pasar el mouse y clic que abre el video; barra de volumen arrastrable; lámpara con su luz; luna, halo y luz lunar; mascotas; reloj en la pared del fondo) y el hover/arrastre/clic de la tele en `input.ts`. El cartel "EN LÍNEA" ya no existe en el prototipo (lo reemplazó la barra de volumen, ver Decisiones del 2026-11-06). Verificado: captura general, primeros planos de los dos sofás y del plato, borde de estática con el hover, `renderer.info` igual al prototipo, y al pasar a `proyectos` el elemento del reproductor queda oculto y pausado. Sofás, tele con el video de YouTube embebido (o bandas de color si falla), lámpara, luna, cartel "EN LÍNEA", caniche negro en el sofá en L, gato blanco con manchas en el respaldo, gato negro comiendo contra la pared izquierda, Franco con el celular.
  - Resultado esperado: igual al prototipo; el video reproduce solo con la escena activa y a la vista.
  - Cómo se verifica: captura general, primeros planos de los dos sofás y del plato; el video pausa al cambiar de página.

### Fase 6 — Interacción

- [x] **Vista POV.** Hecho el 2026-11-07: `src/scripts/world/pov.ts` (puerto exacto de `focusOn`/`unfocus`/`blendPov` del prototipo: cámara detrás y sobre la cabeza de Franco, corrida a un hombro, mirando `d.pov.target`; el objetivo se centra en el área libre del panel en escritorio y en la franja alta en móvil; luces al 65 %, spot sobre Franco y viñeta `#focusVig`; `setOnTop` y `shotPush` quedan como costura para la toma sorpresa de la fase 8) y `focusOn()`/`unfocus()` en `WorldApi`. La etiqueta "tocá para hablar" y la estática al pasar el mouse ya estaban en `input.ts` desde la fase 3; el panel (tarea siguiente) llama a `focusOn` al abrirse y a `unfocus` al cerrarse o al navegar. Verificado: capturas en POV de las tres escenas en Astro y en el prototipo, posición de cámara igual a tres decimales, fov 50/50/46, sin errores de consola. Al tocar a Franco la cámara pasa detrás de él y mira lo que él mira (monitores, profesor y pantalla, tele); etiqueta "tocá para hablar"; estática de tele con el mouse encima.
  - Resultado esperado: misma transición y encuadres del prototipo en las tres escenas.
  - Cómo se verifica: captura en POV de cada escena.
- [x] **Panel de chat y contacto.** Hecho el 2026-11-07: `src/scripts/panel.ts` (puerto del panel del prototipo: abre desde `app:talk` —Franco en el mundo, `#talk`, `#fallbackTalk`—, pasa a `mundo` si hace falta, `focusOn` al abrir y `unfocus` al cerrar o al navegar, `inert` sobre `#app`, trampa de foco, Escape, backdrop, hoja inferior con manija arrastrable en móvil, burbujas, composer con contador y autoalto, formulario de contacto con validación y respuesta de ejemplo hasta que exista `/api/contact`; emite `app:panelclose` para la fase 8) y `src/scripts/chat.ts` (cliente de `/api/chat` con `question`, `lang`, `turnstileToken` e `history` de 4 turnos, más la verificación Turnstile invisible traída de la v1: misma clave de sitio —de prueba en dev, real en producción—, token resuelto por adelantado, reintentos y degradación sin token cuando el widget no carga). Textos nuevos en `ui.ts` (`panel.*`). Decisión: sin "modo ejemplo" con respuestas inventadas (el prototipo lo tenía por no tener backend); si el endpoint no responde se muestra una burbuja de sistema con el mensaje de red de la v1, y los errores del endpoint muestran su propio texto como en el prototipo. Verificado: captura del panel con respuesta real de Workers AI vía el dev server (el cuerpo del POST interceptado trae `question`, `lang` y `turnstileToken`), en 1280 y 390 px igual al prototipo; modo contacto en "disponible" con el resumen y la respuesta de ejemplo; al cerrar, `pov.mix` vuelve a 0 y el foco a `#talk`; sin errores de consola en dev y en preview. Panel de chat conectado a `/api/chat` (oficina y universidad), con Turnstile y auditoría en D1 como hoy; modo contacto directo en "disponible".
  - Resultado esperado: una pregunta real recibe respuesta de Workers AI; en dev sin bindings, usa el stub existente.
  - Cómo se verifica: captura del panel con una respuesta; registro en D1 en dev.

### Fase 7 — Proyectos y Sobre mí

- [x] **Página de proyectos.** Hecho el 2026-11-07: `src/scripts/gallery.ts` (puerto del carrusel del prototipo: flechas, puntos, pista con `translateX`, pausa del clip y del embed en cada movimiento, puntos ocultos sobre el video, imagen rota reemplazada por las iniciales) y el embed de YouTube de AtmOS como `<iframe>` de `youtube-nocookie.com` que recibe su `src` recién al llegar a esa diapositiva. Verificado: captura completa en 1280 y 390 px igual al prototipo, estado de la galería afirmado con Playwright (índice, puntos, `pause()` llamado al mover), los siete enlaces responden 200 (el de Space Apps verificado desde Chromium: Node rechaza su cadena TLS), sin errores de consola en `preview`. Tarjetas desde `src/data/projects.ts` (incluido `portfolio-v1`), carrusel con imágenes y video de YouTube, overlay de "próximamente".
  - Resultado esperado: los cinco proyectos actuales con sus medios y enlaces.
  - Cómo se verifica: captura de la página completa; cada enlace responde.
- [x] **Página sobre mí.** Hecho el 2026-11-07: ya estaba completa y basada en datos desde la fase 1 (bio, datos, trayectoria, fotos, servicios, herramientas y contacto desde `src/data`, reveals por `IntersectionObserver` en `reveals.ts`); verificada contra el prototipo con el mismo recorrido: 20 reveals, 6 fotos con pie al pasar el mouse, 8 chips, 5 servicios y 6 hitos iguales, capturas en 1280 y 390 px, y `grep` de datos personales en `src/components` y `src/scripts` sin resultados (solo el arte 3D de `screens.ts`, a propósito). Servicios, trayectoria y foto desde `src/data/profile.ts`, sección "Fotos" desde `src/data/photos.ts` (archivos en `public/fotos/`), con reveals al scrollear.
  - Resultado esperado: igual al prototipo, con datos del archivo y no hardcodeados.
  - Cómo se verifica: captura de la página; `grep` de datos personales en componentes no encuentra copys sueltos.

### Fase 8 — Easter egg

- [x] **Tickets y sorpresa.** Hecho el 2026-11-07: `src/scripts/hunt.ts` (puerto del módulo del prototipo: cinco ranuras `.tk` —entrada, inicio, mundo, proyectos, sobre; la de la entrada también en el contacto—, hover que asoma el ticket, clic que lo junta con `chime` y la tarjeta grande a pantalla completa, progreso en `localStorage` bajo `fs-tickets`, pestaña y panel rojo "Ábreme" con pips y contador, "Ver sorpresa" y "Reiniciar", vista sorpresa que lleva a `mundo`, muestra la frase y abre el chat al terminar, y cierre por "Volver al mundo", Escape, cambio de página, cambio de escena o cierre del chat) y `src/scripts/world/surprise.ts` (texturas `SUR`, frase tipeada, ticket grande en el segundo monitor, toma sorpresa sobre `shot` de cada escena con empuje lento, `surprise()`/`endSurprise()` en `WorldApi`); las tres escenas implementan `surprise(on)` y el loop proyecta el ticket del mundo desde `tkSpot`. Verificado contra el prototipo con el mismo recorrido en Playwright: ticket de la entrada (tarjeta "01", `fs-tickets` = `["entrada"]`, las dos ranuras desaparecen), quinto ticket en el mundo en oficina, universidad y casa (misma posición de cámara, fov 40, viñeta 0,9, las tres pantallas con la textura 640×360), chat abierto solo al terminar el clip (≈9 s), pantallas restauradas al cerrar el chat (480×300 / 384×216 / 256×144), "Ver sorpresa" desde inicio y celular 390 px; sin errores de consola en dev. Tickets escondidos (entrada, cada escena), persistencia en `localStorage`, vista sorpresa cuando se juntan todos, pantallas con el contenido sorpresa.
  - Resultado esperado: igual al prototipo.
  - Cómo se verifica: captura de un ticket encontrado y de la vista sorpresa.

### Fase 9 — Inglés, SEO y accesibilidad

- [x] **Inglés.** Hecho el 2026-11-07: bloque `en` completo en `src/i18n/ui.ts` (loader, entrada, cabecera, sonido, inicio, mundo con escenas y estados, proyectos, sobre mí, cazatickets, panel con formulario y errores); `profile`, `projects` y `photos` ya estaban en inglés. Del arte 3D se traducen la frase y los rótulos de la sorpresa, el título del reproductor de la tele (`mundo.tvTitle`), la etiqueta de Franco y el reloj; quedan en español a propósito las diapositivas de la pizarra, el código y la terminal del monitor y el dashboard (ver Decisiones). Enlace ES/EN en la cabecera (guarda la elección en `localStorage`, así el redireccionamiento por país no la deshace). Verificado: capturas de las cuatro páginas, el panel de chat y el de contacto en `/en/` a 1280 y 390, cero errores de consola; en el HTML de `/en/` la única palabra con tilde es el `aria-label` del enlace a la versión en español. Ruta `/en/` con todos los textos nuevos traducidos, incluido el chat y los dioramas que muestran texto.
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
