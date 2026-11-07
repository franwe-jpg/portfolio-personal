# Referencia: unseen.co/world

Análisis de una grabación de pantalla de 70 s (1920×1040, 60 fps, **sin pista de audio**).
Fotogramas: 1 por segundo + tiras a 8 fps alrededor de cada transición.
El filtro `select='gt(scene,0.3)'` no detectó ningún corte: **todas las transiciones son continuas**
(fundidos, máscaras y movimientos de cámara). Con umbral 0.08 aparecen los picos en
10.5 s, 24.4 s, 30.9 s, 41.4 s, 49.3 s, 57.1 s y 64.1 s, que coinciden con las transiciones descritas abajo.

> Objetivo: tomar **técnicas**, no identidad. Nada de logo de ojos, textos, nombres, assets ni código.

---

## 1. Secuencia de pantallas

| Tiempo | Pantalla | Qué pasa |
|---|---|---|
| 0–10 s | **Entrada** (`/world/`) | Fondo rosado pálido liso. Logo animado (ojos) que sigue el cursor y parpadea. Nombre del estudio, descripción de 3 líneas, botón píldora "Ingresar ↘" y link "ENTRAR SIN AUDIO" al pie. |
| 10.2–12.5 s | Entrada → Mundo | Fundido a gris y a negro (~375 ms). Aparece el título con glitch (cortes horizontales, aberración cromática, parpadeo) y una esfera wireframe de fondo. |
| 12.5–16 s | **Portada del mundo** | Título de dos palabras: una en grotesca, otra en serif itálica. Icono de globo + "Arrastrá para explorar". Header fijo con logo, 3 links y botón de menú circular. Pie: botón de audio (barras de ecualizador) a la izquierda y © a la derecha. |
| 16–24 s | **Exploración libre** | La portada se disuelve y aparecen tarjetas (fotos, polaroids, renders) flotando sobre una esfera. Se arrastra y la "cámara" gira dentro de la esfera. |
| 24–30 s | **Foco en una tarjeta** | Clic en una tarjeta: se centra y se agranda, el resto se oscurece. Aparece un pie en mayúsculas mono debajo y flechas (manos que señalan) a izquierda y derecha para ir a la anterior o la siguiente. |
| 30.9–32.5 s | Mundo → Home | Clic en el logo: una mancha negra orgánica con borde blanco y bloques de glitch RGB tapa la pantalla y se encoge hacia el centro, dejando ver el home. |
| 32.5–41 s | **Home** (`/`) | Render 3D estático con parallax sutil (arcos, escalera, agua, esfera perlada). Titular serif itálica + grotesca, botón "Ver trabajo". Pie: píldora de noticia y switch "INVISIBLE ◉ MUNDO" para volver al mundo. |
| 41.3–43.5 s | Home → Mundo | El switch abre la mancha al revés: crece desde el centro hasta cubrir todo (~0.5 s), negro, y el título se arma con glitch. |
| 46–49 s | Mundo (otra vez) | Se vuelve a explorar; el estado se reinicia. |
| 49.1–51 s | Mundo → Home | Misma máscara de mancha. |
| 54.6–56 s | Home → **Proyectos** (`/projects/`) | La cámara sube y la escena se lava a blanco. Entra "Proyectos seleccionados" con chips de filtro y una grilla de 2 columnas. |
| 56–64 s | Proyectos (scroll) | Las tarjetas se curvan en los bordes al entrar y salir del viewport (deformación WebGL tipo "página que se dobla"). Fondo blanco con arcos difuminados. |
| 64.1–70 s | **Detalle de proyecto** | Pantalla crema vacía; el nombre del proyecto aparece letra por letra con scramble, una esfera perlada se materializa y se arma el layout tipográfico del caso. |

## 2. Transiciones

| Transición | Duración aprox. | Movimiento | Easing estimado |
|---|---|---|---|
| Entrada → mundo | 0.4 s fundido + 1.6–2.0 s título | Opacidad de la UI a 0, fondo a negro; el título entra con cortes horizontales y RGB split, parpadea 3–4 veces y se estabiliza; la segunda palabra se escribe al final (~0.3 s). | Fundido `power2.in`; glitch escalonado (`steps`), sin interpolación suave. |
| Portada → exploración | ~0.8 s | El título se desvanece; las tarjetas entran desde la profundidad con blur. | `expo.out` |
| Arrastre | continuo | Rotación de la cámara con inercia; las tarjetas dejan estela (motion blur, ghosting) y las lejanas tienen desenfoque de profundidad. | Inercia con amortiguación (lerp ~0.08–0.12 por frame). |
| Foco en tarjeta | ~0.8–1.0 s | Dolly-in hacia la tarjeta, que queda centrada; las vecinas se oscurecen y muestran scanlines. | `power3.inOut` |
| Mancha (mundo ↔ home) | 0.25 s para cubrir + ~1.2 s para encogerse | Máscara orgánica animada (ruido) con borde claro y bloques de glitch; al cerrarse revela la escena nueva. | Cubrir: `expo.in`; revelar: `expo.out`. |
| Home → proyectos | ~0.75 s | Tilt/pan hacia arriba con fundido a blanco; el título y la grilla suben desde abajo. | `expo.out` |
| Abrir proyecto | ~2.5 s | Fundido a crema, scramble de letras y armado tipográfico. | Scramble por pasos + `power2.out` en la maqueta. |

Patrón general: **salidas rápidas (≤0.4 s) y entradas largas (1–2 s)**. Casi nunca hay corte seco.

## 3. Interacciones

- **Hover**
  - Botón de entrada: el contorno pasa a relleno negro; el logo reacciona (cambia la expresión).
  - Links del header: el texto se desordena (scramble) y vuelve a armarse; en reposo pueden quedar caracteres mezclados.
  - Tarjetas del mundo: leve escala y menos blur.
- **Clic**: entrar; enfocar una tarjeta; flechas anterior/siguiente; logo → home; switch → mundo; tarjeta de proyecto → detalle.
- **Drag**: rota la vista del mundo. Es la interacción principal y se anuncia con texto ("Arrastrá para explorar").
- **Scroll**: en proyectos, scroll suave con deformación de las imágenes según la velocidad.
- **Cursor**: puntero propio pequeño. En el mundo, mano abierta/cerrada (grab/grabbing). En el home, un anillo que sigue al puntero con retardo. En el foco, las flechas son manos que señalan.

## 4. Estilo visual

- **Paleta** (muestreada de los fotogramas)
  - Entrada: rosado pálido `#eddbd7`, tinta negra.
  - Mundo: casi negro `#151714` / `#10120d`; wireframe gris muy tenue; acentos que salen de las fotos (verde ácido, rojo).
  - Home: rosados y lilas `#fce5f5`, `#816d79`.
  - Proyectos: gris claro `#d3d5d4` / `#e6e7e2`. Detalle: crema `#faf8ec`.
- **Tipografía**: una grotesca neutra (titulares y UI) combinada con una serif itálica de alto contraste para la palabra destacada. Etiquetas en mayúsculas pequeñas con mucho tracking.
- **Iluminación y materiales**: en el mundo, sin luz de escena; las tarjetas son planos con textura y el "material" lo ponen los efectos de postproceso (RGB split, scanlines, grano, viñeta, profundidad de campo). El home es un render offline (luz cálida difusa, agua reflectante, esfera iridiscente).
- **Nivel de detalle**: geometría mínima (esfera de líneas + planos); el detalle está en las imágenes y el postproceso.
- **UI**: header y pie fijos, muy chicos, siempre visibles; mucho espacio negativo.

## 5. Carga, audio y navegación

- **Carga**: no se ve un loader en la grabación (la entrada ya estaba cargada). La entrada funciona como pantalla de espera: el mundo se monta detrás y se muestra al hacer clic.
- **Audio**: la grabación no tiene pista de audio, así que no se puede evaluar el sonido. Lo que sí se ve: "Ingresar" (con audio) y "Entrar sin audio" separados, y un botón persistente de audio con barras de ecualizador abajo a la izquierda. El audio se desbloquea con el clic de entrada.
- **Navegación**: header fijo (logo → home; 3 links; menú circular). Cada vista tiene URL propia (`/world/`, `/`, `/projects/`, `/projects/<slug>/`). Para volver al mundo hay un switch dedicado en el pie del home. En el foco de tarjeta se sale haciendo clic afuera o arrastrando.

## 6. Adoptar / Adaptar / Evitar

| | Elemento | Decisión para mi portfolio |
|---|---|---|
| **Adoptar** | Entrada como pantalla de espera mientras carga el mundo | Igual, con barra de carga real. |
| **Adoptar** | Doble entrada "con audio / sin audio"; audio solo tras un clic | Igual. |
| **Adoptar** | Salidas rápidas y entradas largas (`expo.in` → `expo.out`) | Regla general de las transiciones con GSAP. |
| **Adoptar** | Header y pie mínimos fijos; botón de audio persistente | Igual, con mi marca. |
| **Adoptar** | URL o estado por vista y una forma explícita de volver | Estado por escena (oficina, universidad, disponible) y botón "volver al mundo". |
| **Adaptar** | Mundo esférico de tarjetas que se arrastra | Diorama isométrico low-poly con cámara ortográfica: se rota en un rango acotado y se hace zoom sobre mi personaje. |
| **Adaptar** | Foco con dolly-in y el resto oscurecido | Zoom de cámara sobre mí que abre el panel de chat; el resto de la escena se atenúa. |
| **Adaptar** | Título con glitch al entrar | Glitch sobrio y corto (≤0.6 s) solo en el cambio de escena, o reemplazarlo por un barrido tipo "señal". |
| **Adaptar** | Máscara de mancha para cambiar de vista | Máscara geométrica (barrido diagonal o celdas isométricas) en lugar de una mancha orgánica. |
| **Adaptar** | Scramble de texto en hover | Solo en mono (JetBrains Mono), para etiquetas de estado. |
| **Adaptar** | Mundo oscuro | Mundo en grafito con luz verde de señal, para que el diorama y el estado "en línea" destaquen; la entrada queda clara (papel). |
| **Adaptar** | Grilla de proyectos que se curva con el scroll | Revelado con ScrollTrigger + Lenis, sin deformación WebGL en esta etapa. |
| **Evitar** | Logo de ojos y sus expresiones | Es su identidad. Uso mis iniciales "FS" en partículas. |
| **Evitar** | Combinación grotesca + serif itálica de alto contraste en los titulares | Es su firma tipográfica. Uso Instrument Sans + JetBrains Mono. |
| **Evitar** | Paleta rosada y lila, esfera perlada, arcos y agua | Es su universo visual. |
| **Evitar** | Cursores de manos pixeladas que señalan | Es parte de su lenguaje. Uso un cursor propio sobrio. |
| **Evitar** | Textos, nombres de secciones y sus fotos | No se copia contenido. |
