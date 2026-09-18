export interface ProjectImage {
  src: string;
  alt: string;
}

export interface ProjectLink {
  label: string;
  href: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  /** Shown as a small pill above the title. Use it to be honest about status. */
  badge?: string;
  images: ProjectImage[];
  links: ProjectLink[];
}

export const PROJECTS: Project[] = [
  {
    id: 'retroalimentacion-academica',
    title: 'Gestión de Retroalimentación Académica',
    badge: 'Proyecto final · APU 2025',
    description:
      'Sistema web para la Facultad de Ingeniería, Sede Trelew. Los alumnos responden encuestas de cátedra, el sistema consolida las respuestas solas y genera los reportes que docentes y Departamento usan para decidir. En equipo de 4, en 12 semanas, con Python, FastAPI y React en arquitectura por capas. Lo más difícil no fue programarlo: fue entender las reglas que tenía que respetar (anonimato, unicidad por período, informes inmutables una vez cerrados).',
    images: [
      {
        src: '/proyectos/apu-1.webp',
        alt: 'Pantalla de inicio de sesión del Sistema de Análisis Académico, sobre una foto de la sede Trelew de la UNPSJB',
      },
      {
        src: '/proyectos/apu-2.webp',
        alt: 'Portada de la infografía del sistema: Facultad de Ingeniería, sede Trelew, equipo de 4 personas, 12 semanas',
      },
      {
        src: '/proyectos/apu-3.webp',
        alt: 'Diagrama del circuito: encuesta del alumno, reporte automático del sistema, informe del docente e informe sintético del Departamento',
      },
      {
        src: '/proyectos/apu-4.webp',
        alt: 'Grilla de reglas de negocio del sistema: unicidad, anonimato, inmutabilidad, ventanas de tiempo y cierre automático',
      },
      {
        src: '/proyectos/apu-5.webp',
        alt: 'Diagrama de la arquitectura en capas: presentación, controladores, servicios y datos, con el stack de cada una',
      },
    ],
    links: [
      {
        label: 'Ver en producción',
        href: 'https://sistema-reporte-academico-unpsjb.unpsjb.workers.dev/login',
      },
    ],
  },
  {
    id: 'atmos',
    title: 'AtmOS — NASA Space Apps Challenge',
    badge: 'Mención honorable · Nominado global',
    description:
      'App web hecha en 48 horas en la sede Puerto Madryn del NASA Space Apps Challenge 2025. Con mi equipo cruzamos datos satelitales y de calidad del aire para evaluar su impacto en la salud. Nos valió una mención honorable y la nominación global. El aprendizaje real fue sintetizar información y priorizar con el reloj en contra.',
    images: [
      {
        src: '/proyectos/atmos-1.webp',
        alt: 'Panel de AtmOS mostrando el resumen de calidad del aire por ubicación y el mapa de estaciones',
      },
    ],
    links: [{ label: 'Ver en producción', href: 'https://atmos-web.ignacio658mg.workers.dev/' }],
  },
  {
    id: 'landing-tienda-apple',
    title: 'Landing para tienda de tecnología',
    badge: 'Pieza de demostración',
    description:
      'Además de los sistemas grandes, hago y comercializo landing pages para negocios e instituciones. Esta es una pieza de muestra, no un trabajo para un cliente real: una tienda ficticia de productos Apple en Trelew, para enseñar el tipo de página que entrego. Una sola pieza HTML, sin dependencias externas, responsive y accesible.',
    images: [
      {
        src: '/proyectos/apple-1.webp',
        alt: 'Portada de la landing de la tienda de tecnología, con titular grande y llamada a la acción',
      },
      {
        src: '/proyectos/apple-2.webp',
        alt: 'Grilla de productos de la landing, con nombre, especificación breve y precio de cada equipo',
      },
    ],
    links: [],
  },
];
