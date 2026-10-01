import type { Lang } from './config';

/** Icon keys for the "how this site is built" list; the SVGs live in ProfilePanel. */
export type BuiltWithIcon = 'code' | 'cloud' | 'model' | 'assistant' | 'repo' | 'audit';

export interface BuiltWithItem {
  icon: BuiltWithIcon;
  name: string;
  description: string;
}

/**
 * Every UI string that is not content data. Typed as a closed interface so a
 * key missing from one language is a compile error, not a Spanish leak.
 */
export interface UiCopy {
  /** BCP 47 tag for Intl formatting. */
  locale: string;
  /** Open Graph locale. */
  ogLocale: string;
  /** Built from the per-language role, so the tag stays in one place. */
  metaDescription: (role: string) => string;

  emoji: {
    /** emoji-picker-element locale code. */
    locale: string;
    /** Self-hosted dataset, fetched only when the picker opens. */
    dataSource: string;
  };

  statusOnline: string;
  /** Markup: the <b> is authored here, never network input. */
  statusTyping: string;

  menuLabel: string;
  themeDark: string;
  themeLight: string;
  /** Names the language it switches TO, like the theme item does. */
  langMenuItem: string;

  disclaimer: string;
  todayChip: string;
  /** Shown on touch screens; `clickHint` replaces it with a fine pointer. */
  tapHint: string;
  clickHint: string;
  suggestionsLabel: string;
  openPromptTitle: string;
  openPromptText: string;

  composerLabel: (name: string) => string;
  composerPlaceholderOpen: string;
  emojiButtonLabel: string;
  sendButtonLabel: string;
  networkError: string;

  projectsTitle: string;
  previousImage: string;
  nextImage: string;

  viewProjects: string;
  viewChat: string;

  avatarAlt: (name: string) => string;
  emailLink: string;

  openProfileLabel: (name: string) => string;
  contactInfoTitle: string;
  backToChat: string;
  builtWithTitle: string;
  builtWith: BuiltWithItem[];
}

export const UI: Record<Lang, UiCopy> = {
  es: {
    locale: 'es-AR',
    ogLocale: 'es_AR',
    metaDescription: (role) =>
      `${role} en Trelew, Chubut. Desarrollo web full stack con foco en front-end. Abrí el chat y preguntame lo que quieras.`,

    emoji: { locale: 'es', dataSource: '/emoji/emoji-es.json' },

    statusOnline: 'en línea',
    statusTyping: '<b>escribiendo…</b>',

    menuLabel: 'Más opciones',
    themeDark: 'Tema oscuro',
    themeLight: 'Tema claro',
    langMenuItem: 'English',

    disclaimer: 'Este chat es una simulación. El CV, los links y las ganas de trabajar son reales.',
    todayChip: 'HOY',
    tapHint: 'Tocá la pantalla para continuar',
    clickHint: 'Hacé clic para chatear',
    suggestionsLabel: 'Preguntas sugeridas',
    openPromptTitle: 'Ahora te toca a vos',
    openPromptText: 'Escribime lo que quieras acá abajo y te respondo.',

    composerLabel: (name) => `Escribile un mensaje a ${name}`,
    composerPlaceholderOpen: 'Preguntame lo que quieras',
    emojiButtonLabel: 'Elegir un emoji',
    sendButtonLabel: 'Enviar mensaje',
    networkError: 'No pude conectarme. Probá de nuevo en un momento, o escribime por mail.',

    projectsTitle: 'Proyectos',
    previousImage: 'Imagen anterior',
    nextImage: 'Imagen siguiente',

    viewProjects: 'Ver proyectos',
    viewChat: 'Ver el chat',

    avatarAlt: (name) => `Foto de ${name}`,
    emailLink: 'Correo',

    openProfileLabel: (name) => `Ver el perfil de ${name}`,
    contactInfoTitle: 'Info. del contacto',
    backToChat: 'Volver al chat',
    builtWithTitle: 'Cómo está hecho este sitio',
    builtWith: [
      {
        icon: 'code',
        name: 'Astro + TypeScript',
        description: 'Páginas estáticas, rápidas y con tipado de punta a punta.',
      },
      {
        icon: 'cloud',
        name: 'Cloudflare',
        description: 'Hosting en Workers, base de datos D1 y verificación anti-bots con Turnstile.',
      },
      {
        icon: 'model',
        name: 'Llama 3.1',
        description: 'El modelo de IA que responde en el chat, corriendo en Workers AI.',
      },
      {
        icon: 'assistant',
        name: 'Claude',
        description: 'Mi copiloto para programar, revisar y documentar el código.',
      },
      {
        icon: 'repo',
        name: 'GitHub',
        description: 'Repositorio y control de versiones.',
      },
      {
        icon: 'audit',
        name: 'Auditoría de preguntas y respuestas',
        description:
          'Cada pregunta y su respuesta quedan registradas, con la IP anonimizada, para revisar y mejorar el chat.',
      },
    ],
  },

  en: {
    locale: 'en-US',
    ogLocale: 'en_US',
    metaDescription: (role) =>
      `${role} based in Trelew, Chubut. Full stack web development with a front-end focus. Open the chat and ask me anything.`,

    emoji: { locale: 'en', dataSource: '/emoji/emoji-en.json' },

    statusOnline: 'online',
    statusTyping: '<b>typing…</b>',

    menuLabel: 'More options',
    themeDark: 'Dark theme',
    themeLight: 'Light theme',
    langMenuItem: 'Español',

    disclaimer: 'This chat is a simulation. The CV, the links and the willingness to work are real.',
    todayChip: 'TODAY',
    tapHint: 'Tap the screen to continue',
    clickHint: 'Click to chat',
    suggestionsLabel: 'Suggested questions',
    openPromptTitle: 'Your turn',
    openPromptText: 'Ask me anything below and I will reply.',

    composerLabel: (name) => `Write a message to ${name}`,
    composerPlaceholderOpen: 'Ask me anything',
    emojiButtonLabel: 'Pick an emoji',
    sendButtonLabel: 'Send message',
    networkError: "I couldn't connect. Try again in a moment, or drop me an email.",

    projectsTitle: 'Projects',
    previousImage: 'Previous image',
    nextImage: 'Next image',

    viewProjects: 'View projects',
    viewChat: 'Back to the chat',

    avatarAlt: (name) => `Photo of ${name}`,
    emailLink: 'Email',

    openProfileLabel: (name) => `View ${name}'s profile`,
    contactInfoTitle: 'Contact info',
    backToChat: 'Back to the chat',
    builtWithTitle: 'How this site is built',
    builtWith: [
      {
        icon: 'code',
        name: 'Astro + TypeScript',
        description: 'Static, fast pages, typed end to end.',
      },
      {
        icon: 'cloud',
        name: 'Cloudflare',
        description: 'Hosting on Workers, a D1 database and bot checks with Turnstile.',
      },
      {
        icon: 'model',
        name: 'Llama 3.1',
        description: 'The AI model that answers in the chat, running on Workers AI.',
      },
      {
        icon: 'assistant',
        name: 'Claude',
        description: 'My copilot for writing, reviewing and documenting the code.',
      },
      {
        icon: 'repo',
        name: 'GitHub',
        description: 'Repository and version control.',
      },
      {
        icon: 'audit',
        name: 'Question and answer audit',
        description:
          'Every question and its answer are logged, with the IP anonymised, to review and improve the chat.',
      },
    ],
  },
};
