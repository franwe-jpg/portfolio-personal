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
}

export interface ProfileCopy {
  role: string;
  tagline: string;
  /** One entry per rendered line of the intro. Kept as separate lines on the page. */
  bio: string[];
}

// The linkedin and instagram handles are still placeholders: the owner has not
// provided them yet. Everything else is real.
export const profile: Profile = {
  name: 'Franco Soler',
  initials: 'FS',
  links: {
    linkedin: 'https://www.linkedin.com/in/franco-martin-soler-19745a346',
    instagram: 'https://www.instagram.com/fr4ncosoler/',
    github: 'https://github.com/franwe-jpg',
    email: 'francomartin2012@hotmail.com',
  },
};

export const PROFILE_COPY: Record<Lang, ProfileCopy> = {
  es: {
    role: 'Analista Programador',
    tagline: 'Franco Soler — Analista Programador',
    bio: [
      'Analista Programador y estudiante avanzado de Licenciatura en Sistemas.',
      'Haciendo del mundo un lugar mejor, pero no tanto...',
      'Abrí el chat de al lado: contesto todo lo que quieras preguntarme.',
    ],
  },
  en: {
    // The degree name stays in Spanish, glossed once so an English reader knows
    // what it is. Everything after this point just says "software analyst".
    role: 'Analista Programador (Software Analyst)',
    tagline: 'Franco Soler — Software Analyst',
    bio: [
      'Software analyst and senior-year student of Licenciatura en Sistemas.',
      'Making the world a better place, but only a little...',
      'Open the chat next door: I answer anything you feel like asking.',
    ],
  },
};
