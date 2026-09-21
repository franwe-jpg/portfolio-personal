import type { Lang } from '../i18n/config';

export interface ProjectImage {
  src: string;
  alt: string;
}

export interface ProjectLink {
  label: string;
  href: string;
}

/** Everything that does not change with the language. */
export interface ProjectBase {
  id: string;
  images: { src: string }[];
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
  images: ProjectImage[];
  links: ProjectLink[];
}

const PROJECT_BASE: ProjectBase[] = [
  {
    id: 'retroalimentacion-academica',
    images: [
      { src: '/proyectos/apu-1.webp' },
      { src: '/proyectos/apu-2.webp' },
      { src: '/proyectos/apu-3.webp' },
      { src: '/proyectos/apu-4.webp' },
      { src: '/proyectos/apu-5.webp' },
    ],
    links: [{ href: 'https://sistema-reporte-academico-unpsjb.unpsjb.workers.dev/login' }],
  },
  {
    id: 'atmos',
    images: [{ src: '/proyectos/atmos-1.webp' }],
    links: [{ href: 'https://atmos-web.ignacio658mg.workers.dev/' }],
  },
  {
    id: 'landing-tienda-apple',
    images: [{ src: '/proyectos/apple-1.webp' }, { src: '/proyectos/apple-2.webp' }],
    links: [],
  },
];

const PROJECT_COPY: Record<Lang, Record<string, ProjectCopy>> = {
  es: {
    'retroalimentacion-academica': {
      title: 'Gestión de Retroalimentación Académica',
      badge: 'Proyecto final · APU 2025',
      description:
        'Sistema web para la Facultad de Ingeniería, Sede Trelew. Los alumnos responden encuestas de cátedra, el sistema consolida las respuestas solas y genera los reportes que docentes y Departamento usan para decidir. En equipo de 4, en 12 semanas, con Python, FastAPI y React en arquitectura por capas. Lo más difícil no fue programarlo: fue entender las reglas que tenía que respetar (anonimato, unicidad por período, informes inmutables una vez cerrados).',
      imageAlts: [
        'Pantalla de inicio de sesión del Sistema de Análisis Académico, sobre una foto de la sede Trelew de la UNPSJB',
        'Portada de la infografía del sistema: Facultad de Ingeniería, sede Trelew, equipo de 4 personas, 12 semanas',
        'Diagrama del circuito: encuesta del alumno, reporte automático del sistema, informe del docente e informe sintético del Departamento',
        'Grilla de reglas de negocio del sistema: unicidad, anonimato, inmutabilidad, ventanas de tiempo y cierre automático',
        'Diagrama de la arquitectura en capas: presentación, controladores, servicios y datos, con el stack de cada una',
      ],
      linkLabels: ['Ver en producción'],
    },
    atmos: {
      title: 'AtmOS — NASA Space Apps Challenge',
      badge: 'Mención honorable · Nominado global',
      description:
        'App web hecha en 48 horas en la sede Puerto Madryn del NASA Space Apps Challenge 2025. Con mi equipo cruzamos datos satelitales y de calidad del aire para evaluar su impacto en la salud. Nos valió una mención honorable y la nominación global. El aprendizaje real fue sintetizar información y priorizar con el reloj en contra.',
      imageAlts: [
        'Panel de AtmOS mostrando el resumen de calidad del aire por ubicación y el mapa de estaciones',
      ],
      linkLabels: ['Ver en producción'],
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
        'Web system for the Facultad de Ingeniería, Sede Trelew. Students answer course surveys, the system consolidates the responses on its own and generates the reports that teachers and the Department use to make decisions. A team of 4, 12 weeks, Python, FastAPI and React on a layered architecture. The hard part was not writing it: it was understanding the rules it had to respect (anonymity, one response per term, reports that become immutable once closed).',
      imageAlts: [
        'Login screen of the Academic Analysis System, over a photo of the UNPSJB Trelew campus',
        'Cover of the system infographic: Facultad de Ingeniería, Trelew campus, team of 4, 12 weeks',
        'Diagram of the circuit: student survey, automatic system report, teacher report and the Department summary report',
        'Grid of the system business rules: uniqueness, anonymity, immutability, time windows and automatic closing',
        'Diagram of the layered architecture: presentation, controllers, services and data, with the stack of each layer',
      ],
      linkLabels: ['See it live'],
    },
    atmos: {
      title: 'AtmOS — NASA Space Apps Challenge',
      badge: 'Honorable mention · Global Nominee',
      description:
        'Web app built in 48 hours at the Puerto Madryn venue of the NASA Space Apps Challenge 2025. With my team we crossed satellite and air quality data to assess its impact on health. It earned us an honorable mention and the global nomination. The real lesson was synthesising information and setting priorities with the clock against us.',
      imageAlts: [
        'AtmOS dashboard showing the air quality summary by location and the map of monitoring stations',
      ],
      linkLabels: ['See it live'],
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
      images: base.images.map((image, index) => ({
        src: image.src,
        alt: copy.imageAlts[index] ?? '',
      })),
      links: base.links.map((link, index) => ({
        href: link.href,
        label: copy.linkLabels[index] ?? '',
      })),
    };
  });
}
