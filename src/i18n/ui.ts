import type { Lang } from './config';

/** The three dioramas; `home` is the "available" evening scene. */
export type Scene = 'office' | 'uni' | 'home';

export interface SceneCopy {
  /** Scene tag number shown next to the name ("ESCENA 01 · OFICINA"). */
  n: string;
  name: string;
  status: string;
  title: string;
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
    backToGate: string;
    brand: string;
    brandSr: string;
    navLabel: string;
    nav: { mundo: string; proyectos: string; sobre: string };
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
  };

  mundo: {
    label: string;
    fallbackAlt: string;
    fallbackNote: string;
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
  };

  proyectos: {
    eyebrow: string;
    title: string;
    next: string;
    prevImage: string;
    nextImage: string;
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
    /** Shown on the screen Franco is looking at once every ticket is found. */
    surprise: string;
  };

  panel: {
    title: (where: string) => string;
    close: string;
    checking: string;
    form: {
      name: string;
      via: string;
      telegram: string;
      mail: string;
      handle: string;
      handlePlaceholder: string;
      message: string;
      send: string;
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
    backToGate: 'Volver a la entrada',
    brand: 'FrancoSolerSistemas',
    brandSr: 'FrancoSolerSistemas, volver al inicio',
    navLabel: 'Páginas',
    nav: { mundo: 'Mundo', proyectos: 'Proyectos', sobre: 'Sobre mí' },
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
  },

  mundo: {
    label: 'Mundo: dónde está Franco ahora',
    fallbackAlt:
      'Ilustración isométrica de la oficina de Franco: escritorio con monitor, rack de servidores y Franco trabajando.',
    fallbackNote: 'Tu navegador no muestra el mundo 3D. Igual podés hablar conmigo.',
    talk: 'Hablar con Franco',
    francoLabel: 'Franco · tocá para hablar',
    clockLabel: 'Hora en Argentina',
    clockPlaceholder: '--:-- · Hora Argentina',
    clock: (time) => `${time} · Hora Argentina`,
    switcherLegend: 'Forzar escena (prueba)',
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
        where: 'en la oficina',
        hello:
          'Estoy en la oficina. Mientras tanto te responde mi versión IA: preguntame por mis proyectos, mi formación o cómo trabajo.',
      },
      uni: {
        n: '02',
        name: 'UNIVERSIDAD',
        status: 'EN LA UNIVERSIDAD',
        title: 'Franco está en la universidad',
        where: 'en la universidad',
        hello:
          'Estoy en clase, en la universidad. Mientras tanto te responde mi versión IA: preguntame por mis proyectos, mi formación o cómo trabajo.',
      },
      home: {
        n: '03',
        name: 'DISPONIBLE',
        status: 'DISPONIBLE',
        title: 'Franco está disponible',
        where: 'disponible',
        hello:
          'Ya terminé el día. Esto no lo contesta una IA: dejame tu mensaje y te respondo yo, por Telegram o por mail.',
      },
    },
    surpriseBack: 'Volver al mundo',
  },

  proyectos: {
    eyebrow: 'Proyectos',
    title: 'Proyectos con gente y problemas reales.',
    next: 'Sobre mí',
    prevImage: 'Anterior',
    nextImage: 'Siguiente',
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
    surprise: 'Lo mejor siempre está escondido donde casi nadie se anima a mirar.',
  },

  panel: {
    title: (where) => `Franco (IA) · ${where}`,
    close: 'Cerrar',
    checking: '○ verificando /api/chat…',
    form: {
      name: 'Tu nombre',
      via: 'Respondeme por',
      telegram: 'Telegram',
      mail: 'Mail',
      handle: 'Tu usuario de Telegram',
      handlePlaceholder: '@usuario',
      message: 'Mensaje',
      send: 'Enviar mensaje',
    },
    composer: {
      label: 'Tu pregunta para Franco',
      placeholder: 'Preguntame algo…',
      send: 'Enviar pregunta',
      count: (length, max) => `${length}/${max}`,
    },
  },
};

// English reuses the Spanish copy until the translation phase (plan, Fase 9);
// only the locale metadata is already English.
const en: UiCopy = {
  ...es,
  locale: 'en-US',
  ogLocale: 'en_US',
  metaDescription: (role) =>
    `${role} based in Trelew, Chubut. Full stack web development with a front-end focus. Step into my world and talk to me.`,
};

export const UI: Record<Lang, UiCopy> = { es, en };
