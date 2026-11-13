import type { Lang } from './config';

/** The three dioramas; `home` is the "available" evening scene. */
export type Scene = 'office' | 'uni' | 'home';

export interface SceneCopy {
  /** Scene tag number shown next to the name ("ESCENA 01 · OFICINA"). */
  n: string;
  name: string;
  status: string;
  title: string;
  /** Title while this scene is shown although it is not the current one (picked on the clock or the switcher). */
  titleAt: string;
  /** Appended to the chat panel title ("Franco (IA) · en la oficina"). */
  where: string;
  /** First message in the panel when it opens on this scene. */
  hello: string;
}

/**
 * Every UI string that is not content data. Typed as a closed interface so a
 * key missing from one language is a compile error, not a Spanish leak.
 * Content (profile, projects, photos) lives in src/data.
 */
export interface UiCopy {
  /** BCP 47 tag for Intl formatting. */
  locale: string;
  /** Open Graph locale. */
  ogLocale: string;
  /** Built from the per-language role, so the tag stays in one place. */
  metaDescription: (role: string) => string;
  /** Alt text of the Open Graph card (public/og.png). */
  ogImageAlt: string;

  loader: {
    loading: (pct: number) => string;
    offline: string;
    enterLoading: (pct: number) => string;
  };

  gate: {
    label: string;
    markAlt: string;
    name: string;
    role: string;
    roleNext: string;
    statusNow: string;
    enter: string;
    mute: string;
  };

  header: {
    /** Back arrow, by where it leads: the gate (from inicio), inicio, or the current scene (from another scene of the world). */
    back: { gate: string; inicio: string; now: string };
    brand: string;
    brandSr: string;
    navLabel: string;
    nav: { mundo: string; proyectos: string; sobre: string };
    /** Skip link: first Tab stop after entering, jumps to the active page's heading. */
    skip: string;
    /** Language flags: name of the link to the other language, written in that language. */
    lang: { sr: string };
  };

  sound: {
    label: string;
    /** Screen-reader suffix after the visible label. */
    sr: string;
    /** aria-label of the toggle in each state. */
    on: string;
    off: string;
  };

  inicio: {
    label: string;
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    description: string;
    explore: string;
    projects: string;
    /** Accessible names of the social links in the bottom-right corner. */
    social: { label: string; instagram: string; linkedin: string; email: string };
  };

  mundo: {
    label: string;
    fallbackAlt: string;
    fallbackNote: string;
    /** Note when the world chunk could not be downloaded. */
    fallbackOffline: string;
    talk: string;
    francoLabel: string;
    clockLabel: string;
    clockPlaceholder: string;
    clock: (time: string) => string;
    switcherLegend: string;
    switcherLabel: string;
    modes: { auto: string; autoNow: string; office: string; uni: string; home: string };
    dragHint: [string, string];
    sceneTag: (scene: SceneCopy) => string;
    statusLine: (scene: SceneCopy, time: string) => string;
    scenes: Record<Scene, SceneCopy>;
    surpriseBack: string;
    /** Title of the YouTube player embedded on the living-room TV. */
    tvTitle: string;
  };

  proyectos: {
    eyebrow: string;
    title: string;
    next: string;
    prevImage: string;
    nextImage: string;
    /** aria-label of each gallery dot. */
    slide: (n: number, total: number) => string;
  };

  sobre: {
    eyebrow: string;
    jobs: string;
    events: string;
    now: string;
    photos: { eyebrow: string; title: string; note: string };
    stack: { eyebrow: string; title: string; toolsHead: string; toolsNote: string };
    contact: {
      eyebrow: string;
      title: string;
      back: string;
      github: string;
      linkedin: string;
      instagram: string;
    };
    copyright: (year: number, name: string) => string;
  };

  hunt: {
    tab: string;
    dialogLabel: string;
    intro: string;
    reward: string;
    count: (found: number, total: number) => string;
    show: string;
    reset: string;
    found: (found: number, total: number) => string;
    foundAll: string;
    ticketFound: string;
    ticket: string;
    /** "No." label on the big ticket of the toast. */
    ticketNo: string;
    /** Header on the surprise screens, above the quote. */
    screenHeader: string;
    /** Prize line under the surprise shot, the terms link and its route. */
    prize: string;
    terms: string;
    termsHref: string;
  };

  panel: {
    title: (where: string) => string;
    /** Title and subtitle of the direct-contact mode (home scene). */
    titleContact: string;
    subContact: string;
    close: string;
    /** Status line under the title: probing, reachable, unreachable. */
    checking: string;
    live: string;
    offline: string;
    /** Speaker labels on the bubbles. */
    who: { ai: string; franco: string; me: string };
    typing: string;
    /** System bubble when the endpoint fails without its own message. */
    errorStatus: (status: number) => string;
    /** System bubble when the request never reaches the endpoint. */
    errorNetwork: string;
    form: {
      name: string;
      via: string;
      whatsapp: string;
      mail: string;
      /** WhatsApp option: a line above the button, the button, and the message prefilled in the chat. */
      waNote: string;
      waCta: string;
      waText: string;
      mailHandle: string;
      mailPlaceholder: string;
      message: string;
      send: string;
      /** Send button label while the message is on its way. */
      sending: string;
      errName: string;
      errMail: string;
      errMessage: string;
      /** The visitor's bubble: message, then name and email. */
      summary: (message: string, name: string, mail: string) => string;
      /** Confirmation once /api/contact accepted the message. */
      ack: (name: string, mail: string) => string;
    };
    composer: {
      label: string;
      placeholder: string;
      send: string;
      count: (length: number, max: number) => string;
    };
  };
}

const es: UiCopy = {
  locale: 'es-AR',
  ogLocale: 'es_AR',
  metaDescription: (role) =>
    `${role} en Trelew, Chubut. Desarrollo web full stack con foco en front-end. Entrá a mi mundo y hablá conmigo.`,
  ogImageAlt: 'Tecla negra con las iniciales FS y un punto verde, junto al nombre Franco Martin Soler, Analista Programador en Trelew, Chubut.',

  loader: {
    loading: (pct) => `CARGANDO MUNDO ${pct}%`,
    offline: 'SIN CONEXIÓN · MODO LIVIANO',
    enterLoading: (pct) => `Cargando… ${pct}%`,
  },

  gate: {
    label: 'Entrada',
    markAlt: 'Logo FS: una tecla negra con las iniciales y un punto verde',
    name: 'Franco Soler Sistemas',
    role: '/ Analista Programador',
    roleNext: 'Futuro Licenciado en Sistemas',
    statusNow: 'AHORA',
    enter: 'Ingresar',
    mute: 'Entrar sin audio',
  },

  header: {
    back: { gate: 'Volver a la entrada', inicio: 'Volver al inicio', now: 'Volver a la hora actual' },
    brand: 'FrancoSolerSistemas',
    brandSr: 'FrancoSolerSistemas, volver al inicio',
    navLabel: 'Páginas',
    nav: { mundo: 'Mundo', proyectos: 'Proyectos', sobre: 'Sobre mí' },
    skip: 'Saltar al contenido',
    lang: { sr: 'English version' },
  },

  sound: {
    label: 'Sonido',
    sr: ' ambiente',
    on: 'Sonido ambiente: activado',
    off: 'Sonido ambiente: desactivado',
  },

  inicio: {
    label: 'Inicio',
    eyebrow: 'Analista Programador · Trelew, Chubut',
    titleLine1: 'Franco Soler',
    titleLine2: 'Sistemas',
    description:
      'Desarrollo software y estudio sistemas en Chubut. Entrá a mi mundo: vas a ver dónde estoy ahora y podés hablar conmigo.',
    explore: 'Explorar mi mundo',
    projects: 'Ver proyectos',
    social: { label: 'Redes y contacto', instagram: 'Instagram', linkedin: 'LinkedIn', email: 'Enviarme un correo' },
  },

  mundo: {
    label: 'Mundo: dónde está Franco ahora',
    fallbackAlt:
      'Ilustración isométrica de la oficina de Franco: escritorio con monitor, rack de servidores y Franco trabajando.',
    fallbackNote: 'Tu navegador no muestra el mundo 3D. Igual podés hablar conmigo.',
    fallbackOffline: 'No se pudo cargar el mundo 3D (sin conexión). Igual podés hablar conmigo.',
    talk: 'Hablar con Franco',
    francoLabel: 'Franco · tocá para hablar',
    clockLabel: 'Hora en Argentina',
    clockPlaceholder: '--:-- · Hora Argentina',
    clock: (time) => `${time} · Hora Argentina`,
    switcherLegend: 'Cambiar de escena',
    switcherLabel: 'Escena',
    modes: { auto: 'Auto', autoNow: ' (ahora)', office: 'Oficina', uni: 'Universidad', home: 'Disponible' },
    dragHint: ['Arrastrá para girar', 'Rueda para acercar'],
    sceneTag: (scene) => `ESCENA ${scene.n} · ${scene.name}`,
    statusLine: (scene, time) => `AHORA · ${scene.status} · ${time} ART`,
    scenes: {
      office: {
        n: '01',
        name: 'OFICINA',
        status: 'EN LA OFICINA',
        title: 'Franco está en la oficina',
        titleAt: 'Franco, a esta hora, está en la oficina',
        where: 'en la oficina',
        hello:
          'Estoy en la oficina. Mientras tanto te responde mi versión IA: preguntame por mis proyectos, mi formación o cómo trabajo.',
      },
      uni: {
        n: '02',
        name: 'UNIVERSIDAD',
        status: 'EN LA UNIVERSIDAD',
        title: 'Franco está en la universidad',
        titleAt: 'Franco, a esta hora, está en la universidad',
        where: 'en la universidad',
        hello:
          'Estoy en clase, en la universidad. Mientras tanto te responde mi versión IA: preguntame por mis proyectos, mi formación o cómo trabajo.',
      },
      home: {
        n: '03',
        name: 'DISPONIBLE',
        status: 'DISPONIBLE',
        title: 'Franco está disponible',
        titleAt: 'Franco, a esta hora, está disponible',
        where: 'disponible',
        hello:
          'Ya terminé el día. Esto no lo contesta una IA: escribime por WhatsApp o dejame tu mensaje por mail, y te respondo yo.',
      },
    },
    surpriseBack: 'Volver al mundo',
    tvTitle: 'Video en la tele del living',
  },

  proyectos: {
    eyebrow: 'Proyectos',
    title: 'Proyectos con gente y problemas reales.',
    next: 'Sobre mí',
    prevImage: 'Anterior',
    nextImage: 'Siguiente',
    slide: (n, total) => `Imagen ${n} de ${total}`,
  },

  sobre: {
    eyebrow: 'Sobre mí',
    jobs: 'Trabajos',
    events: 'Eventos y capacitaciones',
    now: 'Ahora',
    photos: {
      eyebrow: 'Fotos',
      title: 'Cuando no programo, saco fotos.',
      note: 'Una selección de lo que voy sacando con el celular.',
    },
    stack: {
      eyebrow: 'Qué hago',
      title: 'Construyo lo que el problema necesita.',
      toolsHead: 'Herramientas usadas en proyectos',
      toolsNote: 'No hay un stack fijo: elijo según lo que haya que construir',
    },
    contact: {
      eyebrow: 'Contacto',
      title: 'Escribime',
      back: 'Volver al inicio',
      github: 'GitHub',
      linkedin: 'LinkedIn',
      instagram: 'Instagram',
    },
    copyright: (year, name) => `© ${year} ${name}`,
  },

  hunt: {
    tab: 'Ábreme',
    dialogLabel: 'Búsqueda de tickets escondidos',
    intro: 'Busca los 5 tickets escondidos por la web.',
    reward: 'Si encuentras todos, te ganas una sorpresa.',
    count: (found, total) => `${found}/${total} encontrados`,
    show: 'Ver sorpresa',
    reset: 'Reiniciar',
    found: (found, total) => `Has encontrado ${found}/${total} tickets. ¡Sigue buscando!`,
    foundAll: '¡Has encontrado los 5 tickets! Te llevo a tu sorpresa…',
    ticketFound: 'ENCONTRADO',
    ticket: 'TICKET',
    ticketNo: 'Nº',
    screenHeader: 'De lo más profundo de mí, te comparto esta frase:',
    prize: '¡Y te ganaste una landing page desarrollada por mí! Saca captura y enviámela.',
    terms: 'Ver condiciones',
    termsHref: '/tyc/',
  },

  panel: {
    title: (where) => `Franco (IA) · ${where}`,
    titleContact: 'Franco · disponible',
    subContact: 'Te respondo yo, no una IA',
    close: 'Cerrar',
    checking: '○ verificando /api/chat…',
    live: '● conectado a /api/chat',
    offline: '○ sin conexión a /api/chat',
    who: { ai: 'Franco (IA)', franco: 'Franco', me: 'Vos' },
    typing: 'escribiendo…',
    errorStatus: (status) => `No pude responder (error ${status}).`,
    errorNetwork: 'No pude conectarme. Probá de nuevo en un momento, o escribime por mail.',
    form: {
      name: 'Tu nombre',
      via: 'Hablame por',
      whatsapp: 'WhatsApp',
      mail: 'Mail',
      waNote: 'Te abre un chat conmigo en WhatsApp. Te contesto yo.',
      waCta: 'Escribime por WhatsApp',
      waText: 'Hola Franco, te escribo desde tu portfolio.',
      mailHandle: 'Tu mail',
      mailPlaceholder: 'nombre@dominio.com',
      message: 'Mensaje',
      send: 'Enviar mensaje',
      sending: 'Enviando…',
      errName: 'Escribí tu nombre.',
      errMail: 'Ingresá un mail válido.',
      errMessage: 'Escribí tu mensaje.',
      summary: (message, name, mail) => `${message}\n\n— ${name} · ${mail}`,
      ack: (name, mail) => `Gracias, ${name}. Ya me llegó tu mensaje; te respondo a ${mail}.`,
    },
    composer: {
      label: 'Tu pregunta para Franco',
      placeholder: 'Preguntame algo…',
      send: 'Enviar pregunta',
      count: (length, max) => `${length}/${max}`,
    },
  },
};

const en: UiCopy = {
  locale: 'en-US',
  ogLocale: 'en_US',
  metaDescription: (role) =>
    `${role} based in Trelew, Chubut. Full stack web development with a front-end focus. Step into my world and talk to me.`,
  ogImageAlt: 'Black key cap with the initials FS and a green dot, next to the name Franco Martin Soler, software analyst in Trelew, Chubut.',

  loader: {
    loading: (pct) => `LOADING WORLD ${pct}%`,
    offline: 'OFFLINE · LITE MODE',
    enterLoading: (pct) => `Loading… ${pct}%`,
  },

  gate: {
    label: 'Entrance',
    markAlt: 'FS logo: a black key cap with the initials and a green dot',
    name: 'Franco Soler Sistemas',
    role: '/ Software Analyst',
    roleNext: 'Licenciatura en Sistemas, in progress',
    statusNow: 'NOW',
    enter: 'Enter',
    mute: 'Enter without audio',
  },

  header: {
    back: { gate: 'Back to the entrance', inicio: 'Back to home', now: 'Back to the current time' },
    brand: 'FrancoSolerSistemas',
    brandSr: 'FrancoSolerSistemas, back to the start',
    navLabel: 'Pages',
    nav: { mundo: 'World', proyectos: 'Projects', sobre: 'About me' },
    skip: 'Skip to content',
    lang: { sr: 'Versión en español' },
  },

  sound: {
    label: 'Sound',
    sr: ' ambience',
    on: 'Ambient sound: on',
    off: 'Ambient sound: off',
  },

  inicio: {
    label: 'Home',
    eyebrow: 'Software Analyst · Trelew, Chubut',
    titleLine1: 'Franco Soler',
    titleLine2: 'Sistemas',
    description:
      'I build software and study systems in Chubut. Step into my world: you will see where I am right now, and you can talk to me.',
    explore: 'Explore my world',
    projects: 'See projects',
    social: { label: 'Social and contact', instagram: 'Instagram', linkedin: 'LinkedIn', email: 'Send me an email' },
  },

  mundo: {
    label: 'World: where Franco is right now',
    fallbackAlt:
      'Isometric illustration of Franco’s office: a desk with a monitor, a server rack and Franco at work.',
    fallbackNote: 'Your browser cannot show the 3D world. You can still talk to me.',
    fallbackOffline: 'The 3D world could not be loaded (offline). You can still talk to me.',
    talk: 'Talk to Franco',
    francoLabel: 'Franco · tap to talk',
    clockLabel: 'Time in Argentina',
    clockPlaceholder: '--:-- · Argentina time',
    clock: (time) => `${time} · Argentina time`,
    switcherLegend: 'Switch scene',
    switcherLabel: 'Scene',
    modes: { auto: 'Auto', autoNow: ' (now)', office: 'Office', uni: 'University', home: 'Available' },
    dragHint: ['Drag to rotate', 'Scroll to zoom'],
    sceneTag: (scene) => `SCENE ${scene.n} · ${scene.name}`,
    statusLine: (scene, time) => `NOW · ${scene.status} · ${time} ART`,
    scenes: {
      office: {
        n: '01',
        name: 'OFFICE',
        status: 'AT THE OFFICE',
        title: 'Franco is at the office',
        titleAt: 'At this hour, Franco is at the office',
        where: 'at the office',
        hello:
          'I am at the office. In the meantime my AI version answers for me: ask me about my projects, my studies or how I work.',
      },
      uni: {
        n: '02',
        name: 'UNIVERSITY',
        status: 'AT UNIVERSITY',
        title: 'Franco is at university',
        titleAt: 'At this hour, Franco is at university',
        where: 'at university',
        hello:
          'I am in class, at university. In the meantime my AI version answers for me: ask me about my projects, my studies or how I work.',
      },
      home: {
        n: '03',
        name: 'AVAILABLE',
        status: 'AVAILABLE',
        title: 'Franco is available',
        titleAt: 'At this hour, Franco is available',
        where: 'available',
        hello:
          'My day is done. This is not an AI answering: message me on WhatsApp or leave me a note by email, and I will reply myself.',
      },
    },
    surpriseBack: 'Back to the world',
    tvTitle: 'Video on the living-room TV',
  },

  proyectos: {
    eyebrow: 'Projects',
    title: 'Projects with real people and real problems.',
    next: 'About me',
    prevImage: 'Previous',
    nextImage: 'Next',
    slide: (n, total) => `Image ${n} of ${total}`,
  },

  sobre: {
    eyebrow: 'About me',
    jobs: 'Jobs',
    events: 'Events and training',
    now: 'Now',
    photos: {
      eyebrow: 'Photos',
      title: 'When I am not coding, I take photos.',
      note: 'A selection of what I shoot with my phone.',
    },
    stack: {
      eyebrow: 'What I do',
      title: 'I build what the problem needs.',
      toolsHead: 'Tools used in projects',
      toolsNote: 'No fixed stack: I pick according to what has to be built',
    },
    contact: {
      eyebrow: 'Contact',
      title: 'Write to me',
      back: 'Back to the start',
      github: 'GitHub',
      linkedin: 'LinkedIn',
      instagram: 'Instagram',
    },
    copyright: (year, name) => `© ${year} ${name}`,
  },

  hunt: {
    tab: 'Open me',
    dialogLabel: 'Hidden ticket hunt',
    intro: 'Find the 5 tickets hidden around the site.',
    reward: 'Find them all and you win a surprise.',
    count: (found, total) => `${found}/${total} found`,
    show: 'See the surprise',
    reset: 'Start over',
    found: (found, total) => `You have found ${found}/${total} tickets. Keep looking!`,
    foundAll: 'You have found all 5 tickets! Taking you to your surprise…',
    ticketFound: 'FOUND',
    ticket: 'TICKET',
    ticketNo: 'No.',
    screenHeader: 'From deep within me, I share this quote with you:',
    prize: 'And you have won a landing page built by me! Take a screenshot and send it to me.',
    terms: 'See the terms',
    termsHref: '/en/tyc/',
  },

  panel: {
    title: (where) => `Franco (AI) · ${where}`,
    titleContact: 'Franco · available',
    subContact: 'I reply myself, not an AI',
    close: 'Close',
    checking: '○ checking /api/chat…',
    live: '● connected to /api/chat',
    offline: '○ no connection to /api/chat',
    who: { ai: 'Franco (AI)', franco: 'Franco', me: 'You' },
    typing: 'typing…',
    errorStatus: (status) => `I could not answer (error ${status}).`,
    errorNetwork: 'I could not connect. Try again in a moment, or write to me by email.',
    form: {
      name: 'Your name',
      via: 'Talk to me on',
      whatsapp: 'WhatsApp',
      mail: 'Email',
      waNote: 'Opens a chat with me on WhatsApp. I reply myself.',
      waCta: 'Message me on WhatsApp',
      waText: 'Hi Franco, I am writing from your portfolio.',
      mailHandle: 'Your email',
      mailPlaceholder: 'name@domain.com',
      message: 'Message',
      send: 'Send message',
      sending: 'Sending…',
      errName: 'Enter your name.',
      errMail: 'Enter a valid email address.',
      errMessage: 'Write your message.',
      summary: (message, name, mail) => `${message}\n\n— ${name} · ${mail}`,
      ack: (name, mail) => `Thanks, ${name}. Your message reached me; I will reply to ${mail}.`,
    },
    composer: {
      label: 'Your question for Franco',
      placeholder: 'Ask me something…',
      send: 'Send question',
      count: (length, max) => `${length}/${max}`,
    },
  },
};

export const UI: Record<Lang, UiCopy> = { es, en };
