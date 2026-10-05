import type { Lang } from '../i18n/config';

/**
 * A carousel slide. Most are screenshots; a project can also show an embedded
 * YouTube video, which plays inside the carousel instead of leaving the page.
 */
export type ProjectMediaBase = { kind: 'image'; src: string } | { kind: 'video'; youtubeId: string };

export type ProjectMedia =
  | { kind: 'image'; src: string; alt: string }
  /** `alt` is used as the iframe title, which is what a screen reader announces. */
  | { kind: 'video'; youtubeId: string; alt: string };

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
  media: ProjectMedia[];
  links: ProjectLink[];
}

const PROJECT_BASE: ProjectBase[] = [
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
  {
    id: 'landing-tienda-apple',
    media: [
      { kind: 'image', src: '/proyectos/apple-1.webp' },
      { kind: 'image', src: '/proyectos/apple-2.webp' },
    ],
    links: [],
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
    'landing-tienda-apple': {
      title: 'Landing para tienda de tecnología',
      badge: 'Pieza de demostración',
      description:
        'Además de los sistemas grandes, hago y comercializo landing pages para negocios e instituciones. Esta es una pieza de muestra, no un trabajo para un cliente real: una tienda ficticia de productos Apple en Trelew, para enseñar el tipo de página que entrego. Una sola pieza HTML, sin dependencias externas, responsive y accesible.',
      imageAlts: [
        'Portada de la landing de la tienda de tecnología, con titular grande y llamada a la acción',
        'Grilla de productos de la landing, con nombre, especificación breve y precio de cada equipo',
      ],
      linkLabels: [],
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
    'landing-tienda-apple': {
      title: 'Landing page for a tech store',
      badge: 'Demo piece',
      description:
        'Besides the bigger systems, I build and sell landing pages for businesses and institutions. This one is a sample, not work for a real client: a fictional Apple products store in Trelew, to show the kind of page I deliver. A single HTML piece, no external dependencies, responsive and accessible.',
      imageAlts: [
        'Hero of the tech store landing page, with a large headline and a call to action',
        'Product grid of the landing page, with the name, a short spec and the price of each device',
      ],
      linkLabels: [],
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
