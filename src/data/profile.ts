import type { Lang } from '../i18n/config';

export interface ProfileLinks {
  linkedin: string;
  instagram: string;
  github: string;
  email: string;
}

/** The parts that read the same in every language. */
export interface Profile {
  name: string;
  initials: string;
  links: ProfileLinks;
  /** Tools used across projects, shown as chips; no fixed stack. */
  tools: string[];
}

export interface Fact {
  label: string;
  value: string;
}

export interface TimelineItem {
  when: string;
  title: string;
  text: string;
  /** Highlights the entry as the current one. */
  now?: boolean;
}

export interface Service {
  title: string;
  text: string;
}

export interface ProfileCopy {
  role: string;
  tagline: string;
  /** Heading of the "Sobre mí" page. */
  headline: string;
  quote: string;
  lead: string;
  facts: Fact[];
  photoAlt: string;
  jobs: TimelineItem[];
  events: TimelineItem[];
  services: Service[];
}

export const profile: Profile = {
  name: 'Franco Martin Soler',
  initials: 'FS',
  links: {
    linkedin: 'https://www.linkedin.com/in/franco-martin-soler-19745a346',
    instagram: 'https://www.instagram.com/fr4ncosoler/',
    github: 'https://github.com/franwe-jpg',
    email: 'francomartin2012@hotmail.com',
  },
  tools: ['React', 'TypeScript', 'FastAPI', 'SQLite', 'Astro', 'Cloudflare Workers', 'Workers AI', 'D1'],
};

export const PROFILE_COPY: Record<Lang, ProfileCopy> = {
  es: {
    role: 'Analista Programador',
    tagline: 'Franco Martin Soler — Analista Programador',
    headline: 'Analista Programador y estudiante avanzado de Licenciatura en Sistemas.',
    quote: 'Haciendo del mundo un lugar mejor, pero no tanto...',
    lead: 'Soy Franco Martin Soler, tengo 22 años y vivo en Trelew, Chubut. Me recibí de Analista Programador en 2025 y estoy cursando 4.º año de la Licenciatura en Sistemas en la UNPSJB.',
    facts: [
      { label: 'Título', value: 'Analista Programador · 2025' },
      { label: 'Cursando', value: 'Licenciatura en Sistemas · UNPSJB · 4.º año' },
      { label: 'Secundario', value: 'Técnico en Informática · ESETP N.º 724 · 2022' },
      { label: 'Base', value: 'Trelew, Chubut, Argentina' },
    ],
    photoAlt: 'Franco Martin Soler, de perfil, con gorra, en la montaña.',
    jobs: [
      { when: 'Ahora', now: true, title: 'Legislatura de Chubut', text: 'Trabajando en lo mío. Es mi primer año ahí.' },
      { when: '1 año', title: 'Oficina de Desarrollo de Software', text: 'Subsecretaría de Innovación de Chubut.' },
      { when: '2 años y medio', title: 'Empleado administrativo', text: 'En una empresa comercial. Mi primer trabajo.' },
    ],
    events: [
      {
        when: '2026',
        title: 'Universidad Abierta UNPSJB',
        text: 'Organizador: acerco la carrera de Sistemas a quienes están por empezar.',
      },
      {
        when: '2025',
        title: 'NASA Space Apps Challenge',
        text: 'Sede Puerto Madryn. Mención honorable y nominación global con AtmOS.',
      },
      {
        when: '2025',
        title: 'Proyecto final · Analista Programador',
        text: 'Sistema de Retroalimentación Académica para la Facultad de Ingeniería, Sede Trelew.',
      },
    ],
    services: [
      {
        title: 'Landing pages y sistemas a medida',
        text: 'Del sitio de presentación al sistema completo, frontend y backend.',
      },
      { title: 'Integraciones', text: 'Conecto lo tuyo con AFIP/ARCA, Mercado Pago, WhatsApp y servicios parecidos.' },
      { title: 'SEO', text: 'Que te encuentren en Google y que el sitio tenga más visibilidad.' },
      {
        title: 'Mantenimiento',
        text: 'Después de la entrega sigo: el mantenimiento es parte de la vida de cualquier software.',
      },
      { title: 'Logos', text: 'Diseño gráfico e identidad para que todo hable el mismo idioma.' },
    ],
  },
  en: {
    // The degree name stays in Spanish, glossed once so an English reader knows
    // what it is. Everything after this point just says "software analyst".
    role: 'Analista Programador (Software Analyst)',
    tagline: 'Franco Martin Soler — Software Analyst',
    headline: 'Software analyst and senior-year student of Licenciatura en Sistemas.',
    quote: 'Making the world a better place, but only a little...',
    lead: 'I am Franco Martin Soler, 22, and I live in Trelew, Chubut. I graduated as a software analyst in 2025 and I am in the fourth year of the Licenciatura en Sistemas at UNPSJB.',
    facts: [
      { label: 'Degree', value: 'Software Analyst · 2025' },
      { label: 'Studying', value: 'Licenciatura en Sistemas · UNPSJB · 4th year' },
      { label: 'High school', value: 'IT Technician · ESETP No. 724 · 2022' },
      { label: 'Based in', value: 'Trelew, Chubut, Argentina' },
    ],
    photoAlt: 'Franco Martin Soler, in profile, wearing a cap, in the mountains.',
    jobs: [
      { when: 'Now', now: true, title: 'Legislature of Chubut', text: 'Working in my field. It is my first year there.' },
      { when: '1 year', title: 'Software Development Office', text: 'Undersecretariat of Innovation of Chubut.' },
      { when: '2.5 years', title: 'Administrative clerk', text: 'At a retail company. My first job.' },
    ],
    events: [
      {
        when: '2026',
        title: 'Universidad Abierta UNPSJB',
        text: 'Organiser: I bring the Systems degree closer to those about to start.',
      },
      {
        when: '2025',
        title: 'NASA Space Apps Challenge',
        text: 'Puerto Madryn venue. Honorable mention and global nomination with AtmOS.',
      },
      {
        when: '2025',
        title: 'Final project · Software Analyst',
        text: 'Academic Feedback System for the Faculty of Engineering, Trelew campus.',
      },
    ],
    services: [
      {
        title: 'Landing pages and custom systems',
        text: 'From the presentation site to the full system, frontend and backend.',
      },
      { title: 'Integrations', text: 'I connect your business with AFIP/ARCA, Mercado Pago, WhatsApp and similar services.' },
      { title: 'SEO', text: 'So people find you on Google and the site gets more visibility.' },
      {
        title: 'Maintenance',
        text: 'I stay after delivery: maintenance is part of the life of any software.',
      },
      { title: 'Logos', text: 'Graphic design and identity so everything speaks the same language.' },
    ],
  },
};
