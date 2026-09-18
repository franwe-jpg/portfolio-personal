# Brief: portfolio personal — fase de análisis y decisión de stack

## Quién soy y qué quiero construir

Soy Analista Programador. Voy a construir mi portfolio personal desde cero. El repositorio es `franwe-jpg/portfolio-personal` y por ahora está vacío.

El objetivo es un sitio que funcione como carta de presentación ante reclutadores técnicos y líderes de equipo, pero que no sea una landing estática más. Quiero incluir algo con lógica real y peso visual — un juego o una pieza interactiva elaborada — que demuestre capacidad técnica y no solo prolijidad.

**Importante: en esta fase no quiero que escribas código ni que asumas un stack.** Primero vamos a analizar referencias y recién después vamos a decidir tecnologías. Si en algún momento necesitás asumir algo para avanzar, decilo explícitamente en vez de darlo por sentado.

## Restricciones de despliegue (no negociables)

El sitio se va a desplegar en **Cloudflare Workers con static assets**, plan gratuito. Cualquier decisión de arquitectura tiene que respetar estos límites:

- **Requests a assets estáticos:** ilimitados y sin costo. No cuentan contra ninguna cuota.
- **Invocaciones del Worker:** 100.000 por día. Solo se consumen cuando corre lógica de servidor.
- **Tiempo de CPU:** 10 ms por invocación. Es cómputo puro, no espera de I/O: llamadas a APIs externas no consumen ese presupuesto. Descarta procesamiento de imágenes o cálculo pesado en el edge.
- **Tamaño del bundle del Worker:** 3 MB comprimido. Aplica solo al código de servidor.
- **Assets estáticos:** máximo 25 MiB por archivo y 20.000 archivos en total.
- **Persistencia:** KV tiene 1.000 escrituras por día (100.000 lecturas). D1 tiene 100.000 filas escritas por día y 5 GB. Para cualquier cosa que se escriba con frecuencia — por ejemplo una tabla de puntajes — hay que usar D1, no KV. KV queda para datos que se leen mucho y se escriben poco.
- **Ancho de banda:** no medido, pero el ToS prohíbe hostear video o archivos grandes que no sean parte del sitio.

Consecuencia práctica: los assets del juego tienen que ir comprimidos (WebP o AVIF para imágenes, Draco o similar para geometría 3D si la hubiera).

## Requisitos de contenido

- Cada proyecto debe mostrar descripción concisa, stack utilizado, y **dos links: demo en vivo y código en GitHub**. Un proyecto sin link al repositorio genera desconfianza.
- Mostrar, no contar. Nada de barras de progreso tipo "React 85%". La evidencia es el proyecto funcionando.
- CTA claro: en los primeros cinco segundos tiene que entenderse qué hago y cómo contactarme. Mail visible, LinkedIn, GitHub y CV descargable en PDF.
- La pieza interactiva o el juego **no puede ser un obstáculo**. Tiene que poder llegarse a proyectos y contacto sin jugar. Es una sección destacada, no la navegación principal.
- Mobile real: buena parte de los reclutadores abre el link desde el celular. Si el juego es solo para desktop, necesita un fallback digno, no una pantalla rota.
- SEO básico: URLs limpias, metadata estructurada, Open Graph.
- Accesibilidad siguiendo WCAG: navegación por teclado, contraste, textos alternativos.

## Principios de rendimiento

El resto del sitio tiene que pintar de inmediato y el juego cargarse de forma diferida. Una escena que tarda ocho segundos en aparecer juega en contra aunque sea impresionante.

## Lo que necesito de vos en esta fase

**Paso 1.** Te voy a pasar una lista de portfolios de referencia, uno por uno o en lote. De cada uno quiero que extraigas y anotes:

- Estructura y jerarquía de la información: qué secciones hay, en qué orden, qué se ve sin hacer scroll.
- Decisiones visuales: paleta, tipografía, densidad, uso de espacio en blanco, tipo de layout.
- Elementos interactivos: qué animaciones o interacciones usa, cuándo se disparan, si aportan o distraen.
- Stack detectable, si se puede inferir desde el HTML, los headers, los nombres de los bundles o el código fuente visible.
- Rendimiento percibido: qué tan rápido pinta, si hay pantalla de carga, si bloquea contenido.
- Qué me llevo y qué descarto, con el motivo.

Mantené un registro acumulado de estos hallazgos para poder compararlos al final.

**Paso 2.** Con todas las referencias analizadas, armá una síntesis: qué patrones se repiten entre los buenos, qué errores se repiten, y qué combinación concreta de elementos tiene sentido para mi caso particular.

**Paso 3.** Recién entonces, recomendame un stack. Quiero que compares al menos tres opciones viables y que justifiques la elección contra estos criterios, en este orden de prioridad:

1. Compatibilidad con los límites de Cloudflare Workers listados arriba.
2. Rendimiento del sitio para el visitante — tiempo hasta el primer render, peso del JavaScript enviado.
3. Capacidad de aislar el juego para que no arrastre su runtime al resto del sitio.
4. Velocidad de desarrollo y mantenimiento posterior.
5. Qué tan bien se ve la elección ante un reclutador técnico que mire el repositorio.

Para cada opción, decime también qué pierdo si la elijo. No quiero solo el ganador.

## Formato de las respuestas

Sé directo y técnico, sin preámbulos. Si detectás que algo de lo que pido es una mala idea, decilo. Si necesitás información que no te di, preguntá antes de asumir.
