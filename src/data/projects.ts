import type { Lang } from '../i18n/config';

/**
 * A carousel slide. Most are screenshots; a project can also show an embedded
 * YouTube video, which plays inside the carousel instead of leaving the page.
 */
export type ProjectMediaBase =
  | { kind: 'image'; src: string }
  | { kind: 'video'; youtubeId: string }
  /** A short self-hosted clip (mp4 in `public/proyectos/`), shown with native controls. */
  | { kind: 'clip'; src: string; poster: string };

export type ProjectMedia =
  | { kind: 'image'; src: string; alt: string }
  /** `alt` is used as the iframe title, which is what a screen reader announces. */
  | { kind: 'video'; youtubeId: string; alt: string }
  | { kind: 'clip'; src: string; poster: string; alt: string };

export interface ProjectLink {
  label: string;
  href: string;
}

/** Everything that does not change with the language. */
export interface ProjectBase {
  id: string;
  media: ProjectMediaBase[];
  links: { href: string }[];
}

/** The translated half, keyed by the same id. */
export interface ProjectCopy {
  title: string;
  description: string;
  /** Shown as a small pill above the title. Use it to be honest about status. */
  badge?: string;
  /** Text laid over the carousel, for a project that cannot be shown yet. */
  overlay?: string;
  /** Blurred, faded line drawn behind `overlay`, naming what is coming. */
  overlayGhost?: string;
  /** One alt per image, in the same order as `images`. */
  imageAlts: string[];
  /** One label per link, in the same order as `links`. */
  linkLabels: string[];
}

/** What a rendered card receives: base and copy already zipped together. */
export interface Project {
  id: string;
  title: string;
  description: string;
  badge?: string;
  overlay?: string;
  overlayGhost?: string;
  media: ProjectMedia[];
  links: ProjectLink[];
}

// Newest first: this order is the order on the page.
const PROJECT_BASE: ProjectBase[] = [
  {
    // Still being built: a stock food photo stands in until there are screenshots.
    id: 'gestion-restaurante',
    media: [{ kind: 'image', src: '/proyectos/restaurante-1.webp' }],
    links: [],
  },
  {
    // First version of this site, kept online at v1.francosolersistemas.com after the redesign.
    id: 'portfolio-v1',
    media: [
      { kind: 'image', src: '/proyectos/portfolio-v1-1.webp' },
      { kind: 'image', src: '/proyectos/portfolio-v1-2.webp' },
      { kind: 'image', src: '/proyectos/portfolio-v1-3.webp' },
      { kind: 'image', src: '/proyectos/portfolio-v1-4.webp' },
      { kind: 'image', src: '/proyectos/portfolio-v1-5.webp' },
      { kind: 'image', src: '/proyectos/portfolio-v1-6.webp' },
      { kind: 'image', src: '/proyectos/portfolio-v1-7.webp' },
      { kind: 'clip', src: '/proyectos/portfolio-v1-demo.mp4', poster: '/proyectos/portfolio-v1-poster.webp' },
    ],
    links: [{ href: 'https://v1.francosolersistemas.com' }, { href: 'https://github.com/franwe-jpg/portfolio-v1' }],
  },
  {
    id: 'aeroclub-trelew',
    media: [
      { kind: 'image', src: '/proyectos/aeroclub-1.webp' },
      { kind: 'image', src: '/proyectos/aeroclub-2.webp' },
      { kind: 'image', src: '/proyectos/aeroclub-3.webp' },
      { kind: 'image', src: '/proyectos/aeroclub-4.webp' },
      { kind: 'image', src: '/proyectos/aeroclub-5.webp' },
    ],
    links: [{ href: 'https://aeroclubtrelew.org/' }],
  },
  {
    id: 'retroalimentacion-academica',
    media: [
      { kind: 'image', src: '/proyectos/apu-1.webp' },
      { kind: 'image', src: '/proyectos/apu-2.webp' },
      { kind: 'image', src: '/proyectos/apu-3.webp' },
      { kind: 'image', src: '/proyectos/apu-4.webp' },
      { kind: 'image', src: '/proyectos/apu-5.webp' },
      { kind: 'image', src: '/proyectos/apu-6.webp' },
      { kind: 'image', src: '/proyectos/apu-7.webp' },
    ],
    links: [
      { href: 'https://sistema-reporte-academico-unpsjb.unpsjb.workers.dev/login' },
      { href: '/isfpp-gestion-academica.pdf' },
    ],
  },
  {
    id: 'atmos',
    media: [
      { kind: 'image', src: '/proyectos/atmos-equipo.webp' },
      { kind: 'video', youtubeId: 'TdlaQjNjynM' },
      { kind: 'image', src: '/proyectos/atmos-mencion.webp' },
    ],
    links: [
      { href: 'https://www.spaceappschallenge.org/2025/find-a-team/notus/?tab=details' },
      { href: 'https://www.youtube.com/watch?v=TdlaQjNjynM' },
    ],
  },
];

const PROJECT_COPY: Record<Lang, Record<string, ProjectCopy>> = {
  es: {
    'retroalimentacion-academica': {
      title: 'Gestión de Retroalimentación Académica',
      badge: 'Proyecto final · APU 2025',
      description:
        'Sistema Web de Gestión Académica centralizado que digitaliza el ciclo completo de retroalimentación institucional. El sistema integra en un único flujo la recolección de encuestas estudiantiles, la generación automática de reportes para docentes y la elaboración de Informes de Actividad Curricular e Informes Sintéticos de Carrera por parte del Departamento, cumpliendo con las normativas vigentes (CDFI N.º005/2014 y N.º283/2015). Esta integración permite completar, en un mismo entorno, todas las tareas del circuito de evaluación académica',
      imageAlts: [
        'Pantalla de bienvenida del Sistema de Análisis Académico, con las tarjetas para entrar como Alumno, Docente o Departamento',
        'Vista del alumno: listado de encuestas pendientes, con materia, docente, fecha de cierre y el botón para responder',
        'Vista del docente: listado de reportes generados, con accesos a ver el reporte, el informe curricular y las estadísticas',
        'Análisis de respuestas por variable de una materia, con el porcentaje de cada opción y las métricas de la encuesta al costado',
        'Vista del Departamento: informes sintéticos por carrera, con la cantidad de informes incluidos y publicados por período',
        'Dashboard de estadísticas de la Facultad: asignaturas evaluadas, docentes participantes, respuestas y satisfacción global',
        'Asignaturas con mayor participación y la tabla de alertas automáticas por calidad docente e infraestructura, con su severidad',
      ],
      linkLabels: ['Ver en producción', '📄 Ver informe'],
    },
    'aeroclub-trelew': {
      title: 'Sitio del Aeroclub Trelew',
      badge: 'Cliente real',
      description:
        'Sitio institucional para el Aeroclub Trelew, Centro de Instrucción de Aeronáutica Civil habilitado por ANAC desde 1938. Presenta las carreras y cursos que dicta, la flota, la galería y un formulario de contacto con el tipo de consulta ya clasificado. Un caso claro de página pensada alrededor de una necesidad real: que el interesado encuentre la carrera y consulte fácilmente.',
      imageAlts: [
        'Portada del sitio del Aeroclub Trelew: avión en vuelo, los logos del club y de ANAC, y los botones para ver cursos o conocer la institución',
        'Sección de carreras y cursos, con una tarjeta por formación: tripulante de cabina, piloto privado y el resto de los programas',
        'Sección "Nuestra Historia", con fotos de archivo de 1944 y el relato de la fundación del club en 1938',
        'Sección "Aeronaves de Instrucción", con una tarjeta por avión de la flota: Cessna, Piper, Petrel, Tecnam y Lockheed',
        'Sección de contacto: ubicación, teléfono, email y horarios junto al mapa y al formulario de consulta',
      ],
      linkLabels: ['Ver en producción'],
    },
    atmos: {
      title: 'AtmOS — NASA Space Apps Challenge',
      badge: 'Mención honorable · Nominado global',
      description:
        'App web hecha en 48 horas en la sede Puerto Madryn del NASA Space Apps Challenge 2025. Con mi equipo cruzamos datos satelitales y de calidad del aire para evaluar su impacto en la salud. Nos valió una mención honorable y la nominación global. El aprendizaje real fue sintetizar información y priorizar con el reloj en contra.',
      imageAlts: [
        'El equipo de AtmOS posando junto a los banners de NASA Space Apps Puerto Madryn y FAND durante el NASA Space Apps Challenge 2025',
        'Video demo de AtmOS, reproducible acá mismo',
        'Tarjeta de la mención honorable de AtmOS en el NASA Space Apps Challenge 2025, sede Puerto Madryn',
      ],
      linkLabels: ['Ver proyecto', '🎬 Ver demo'],
    },
    'gestion-restaurante': {
      title: 'Sistema de Gestión de Restaurante',
      badge: 'En desarrollo · ISFPP 2026',
      overlay: 'Próximamente...',
      overlayGhost: 'App gestión de restaurante',
      description:
        'Un sistema para manejar un restaurante completo desde un solo lugar: la carta, los menús y promociones, el salón y los mozos, las comandas, las reservas y los cobros, cada módulo con sus reportes. Con mi equipo llevamos el 100% del proyecto desde cero: planificación, diseño, desarrollo y pruebas, con Scrum. El objetivo es que al terminarlo quede funcional y listo para comercializar. React y TypeScript, FastAPI y SQLite.',
      imageAlts: [
        'Platos de restaurante vistos desde arriba sobre una mesa de madera: carne con ensalada, croquetas y salsas',
      ],
      linkLabels: [],
    },
    'portfolio-v1': {
      title: 'Portfolio Personal',
      badge: 'Primera versión · 2025',
      description:
        'La primera versión de este sitio, pensada como un chat de WhatsApp: una versión IA mía responde preguntas sobre mi formación, mis proyectos y cómo trabajo, con las respuestas ancladas en mi CV real. Astro y TypeScript, desplegado en Cloudflare Workers con Llama 3.1 en Workers AI, auditoría de preguntas en D1 y verificación anti-bots con Turnstile. En español e inglés, con tema claro y oscuro. Sigue en línea en su propio subdominio.',
      imageAlts: [
        'Portada del primer portfolio: el nombre y la presentación a la izquierda y, a la derecha, un chat estilo WhatsApp con la invitación a hacer clic para chatear',
        'El chat en tema oscuro, recién abierto: el saludo inicial y la invitación a hacer clic para seguir',
        'La conversación guionada completa en tema oscuro: a qué me dedico, dónde vivo y mis proyectos, con el campo para preguntar lo que quieras',
        'Panel de información del contacto en tema oscuro: foto de perfil y la lista de tecnologías con las que estaba hecho el sitio',
        'Vista de proyectos: tarjeta del sitio del Aeroclub Trelew con su carrusel de capturas, descripción y enlace a producción',
        'El sitio en un iPhone: la portada con el nombre, la presentación y los botones de proyectos y contacto',
        'El chat en un iPhone con el teclado abierto: los datos de contacto en burbujas y el campo para preguntar',
        'Grabación de pantalla del celular recorriendo el chat guionado del primer portfolio',
      ],
      linkLabels: ['Ver el sitio', 'Ver el código'],
    },
  },

  en: {
    'retroalimentacion-academica': {
      title: 'Academic Feedback Management',
      badge: 'Final project · APU 2025',
      description:
        'Centralised Academic Management web system that digitalises the full cycle of institutional feedback. In a single flow it brings together the collection of student surveys, the automatic generation of reports for teachers, and the Department’s Curricular Activity Reports and Degree Summary Reports, in compliance with the current regulations (CDFI No. 005/2014 and No. 283/2015). This integration makes it possible to complete every task of the academic evaluation circuit within the same environment.',
      imageAlts: [
        'Welcome screen of the Academic Analysis System, with the cards to enter as Student, Teacher or Department',
        'Student view: list of pending surveys, with the course, the teacher, the closing date and the button to answer',
        'Teacher view: list of generated reports, with access to the report, the curricular report and the statistics',
        'Per-variable analysis of the answers for a course, with the percentage of each option and the survey metrics on the side',
        'Department view: summary reports by degree programme, with how many reports each one includes and how many are published',
        'Faculty statistics dashboard: courses evaluated, participating teachers, total answers and overall satisfaction',
        'Courses with the highest participation and the table of automatic alerts on teaching quality and infrastructure, with their severity',
      ],
      linkLabels: ['See it live', '📄 Read the report'],
    },
    'aeroclub-trelew': {
      title: 'Aeroclub Trelew website',
      badge: 'Real client',
      description:
        'Institutional site for Aeroclub Trelew, a Civil Aviation Instruction Centre approved by ANAC since 1938. It presents the programmes and courses it teaches, the fleet, the gallery and a contact form where the type of enquiry is already classified. A clear case of a page built around a real need: that a prospective student finds the programme and gets in touch easily.',
      imageAlts: [
        'Home page of the Aeroclub Trelew site: an aircraft in flight, the club and ANAC logos, and the buttons to see the programmes or learn about the institution',
        'Programmes and courses section, one card per training path: cabin crew, private pilot and the remaining programmes',
        '"Our History" section, with archive photographs from 1944 and the story of the club founded in 1938',
        '"Training Aircraft" section, one card per aircraft in the fleet: Cessna, Piper, Petrel, Tecnam and Lockheed',
        'Contact section: location, phone, email and opening hours next to the map and the enquiry form',
      ],
      linkLabels: ['See it live'],
    },
    atmos: {
      title: 'AtmOS — NASA Space Apps Challenge',
      badge: 'Honorable mention · Global Nominee',
      description:
        'Web app built in 48 hours at the Puerto Madryn venue of the NASA Space Apps Challenge 2025. With my team we crossed satellite and air quality data to assess its impact on health. It earned us an honorable mention and the global nomination. The real lesson was synthesising information and setting priorities with the clock against us.',
      imageAlts: [
        'The AtmOS team posing next to the NASA Space Apps Puerto Madryn and FAND banners during the NASA Space Apps Challenge 2025',
        'AtmOS demo video, playable right here',
        'Honorable mention card for AtmOS at the NASA Space Apps Challenge 2025, Puerto Madryn venue',
      ],
      linkLabels: ['See the project', '🎬 Watch the demo'],
    },
    'gestion-restaurante': {
      title: 'Restaurant Management System',
      badge: 'In progress · ISFPP 2026',
      overlay: 'Coming soon...',
      overlayGhost: 'Restaurant management app',
      description:
        'A system to run a whole restaurant from one place: the menu, set menus and promotions, the floor and the waiters, orders, reservations and payments, each module with its own reports. My team and I own 100% of the project from scratch: planning, design, development and testing, run with Scrum. The goal is for it to be fully working and ready to sell once it is finished. React and TypeScript, FastAPI and SQLite.',
      imageAlts: [
        'Restaurant dishes seen from above on a wooden table: steak with salad, croquettes and sauces',
      ],
      linkLabels: [],
    },
    'portfolio-v1': {
      title: 'Personal Portfolio',
      badge: 'First version · 2025',
      description:
        'The first version of this site, designed as a WhatsApp chat: an AI version of me answers questions about my studies, my projects and how I work, with answers grounded in my real CV. Astro and TypeScript, deployed on Cloudflare Workers with Llama 3.1 on Workers AI, a question audit log in D1 and anti-bot verification with Turnstile. In Spanish and English, with light and dark themes. Still online on its own subdomain.',
      imageAlts: [
        'Home page of the first portfolio: name and introduction on the left and, on the right, a WhatsApp-style chat inviting you to click to start chatting',
        'The chat in dark theme, just opened: the first greeting and the invitation to click to continue',
        'The full scripted conversation in dark theme: what I do, where I live and my projects, with the field to ask anything',
        'Contact info panel in dark theme: profile photo and the list of technologies the site was built with',
        'Projects view: the Aeroclub Trelew site card with its screenshot carousel, description and link to production',
        'The site on an iPhone: the home page with the name, the introduction and the projects and contact buttons',
        'The chat on an iPhone with the keyboard open: the contact details in bubbles and the field to ask a question',
        'Phone screen recording walking through the scripted chat of the first portfolio',
      ],
      linkLabels: ['Visit the site', 'View the code'],
    },
  },
};

/** Zips the shared base with the copy for `lang`, in authoring order. */
export function projectsFor(lang: Lang): Project[] {
  return PROJECT_BASE.map((base) => {
    const copy = PROJECT_COPY[lang][base.id];
    return {
      id: base.id,
      title: copy.title,
      description: copy.description,
      badge: copy.badge,
      overlay: copy.overlay,
      overlayGhost: copy.overlayGhost,
      media: base.media.map((item, index) => ({
        ...item,
        alt: copy.imageAlts[index] ?? '',
      })),
      links: base.links.map((link, index) => ({
        href: link.href,
        label: copy.linkLabels[index] ?? '',
      })),
    };
  });
}
