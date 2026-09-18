export interface ProfileLinks {
  linkedin: string;
  instagram: string;
  github: string;
  email: string;
}

export interface Profile {
  name: string;
  role: string;
  initials: string;
  tagline: string;
  bio: string;
  links: ProfileLinks;
}

// The linkedin and instagram handles are still placeholders: the owner has not
// provided them yet. Everything else is real.
export const profile: Profile = {
  name: 'Franco Soler',
  role: 'Analista Programador',
  initials: 'FS',
  tagline: 'Franco Soler — Analista Programador',
  bio: 'Analista Programador y estudiante de Licenciatura en Sistemas, en Trelew. Llevo un problema desde la charla con el cliente hasta el sistema andando y mantenido. Abrí el chat de al lado: contesta todo lo que quieras preguntarme.',
  links: {
    linkedin: 'https://www.linkedin.com/in/TU-USUARIO',
    instagram: 'https://www.instagram.com/TU-USUARIO',
    github: 'https://github.com/franwe-jpg',
    email: 'francomartin2012@hotmail.com',
  },
};
