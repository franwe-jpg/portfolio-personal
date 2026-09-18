export type MessageAuthor = 'franco' | 'visitor';

export interface ChatMessage {
  from: MessageAuthor;
  /** Authored markup, rendered with innerHTML. Never holds network content. */
  html: string;
  /** Displayed timestamp. */
  t: string;
}

export const MESSAGES: ChatMessage[] = [
  { from: 'franco', html: '¿Hola?', t: '21:14' },
  { from: 'visitor', html: 'Hola.', t: '21:14' },
  { from: 'franco', html: '¡Hola! Me llamo Franco Soler 👋', t: '21:15' },
  {
    from: 'franco',
    html: 'Gracias por abrir el chat. Preguntame lo que quieras, ya tengo las respuestas preparadas.',
    t: '21:15',
  },

  { from: 'visitor', html: '¿A qué te dedicás?', t: '21:15' },
  {
    from: 'franco',
    html: 'Soy Analista Programador, recibido en 2025, y estoy cursando cuarto año de la Licenciatura en Sistemas.',
    t: '21:16',
  },
  {
    from: 'franco',
    html: 'Desarrollo web, y lo que más me interesa es agarrar un problema desde cero y dejarlo andando de punta a punta.',
    t: '21:16',
  },

  { from: 'visitor', html: '¿Y experiencia?', t: '21:16' },
  {
    from: 'franco',
    html: 'Hoy trabajo de lo mío en la <b>Legislatura de Chubut</b>, va mi primer año.',
    t: '21:17',
  },
  {
    from: 'franco',
    html: 'Antes estuve un año en la oficina de Desarrollo de Software de la <b>Subsecretaría de Innovación de Chubut</b>.',
    t: '21:17',
  },
  {
    from: 'franco',
    html: 'Y mi primer trabajo fueron dos años y medio como administrativo en una empresa de comercio. Ahí aprendí a tratar con gente, que después resultó ser la mitad del laburo.',
    t: '21:18',
  },

  { from: 'visitor', html: '¿Qué sabés hacer, concretamente?', t: '21:18' },
  {
    from: 'franco',
    html: 'Las cinco etapas completas: hablar con el cliente, sacar requerimientos funcionales y no funcionales, diseñar, implementar, verificar y validar, y después mantener y escalar.',
    t: '21:19',
  },
  {
    from: 'franco',
    html: 'Me las sé de memoria, te diría que a la fuerza: tres materias de Desarrollo de Software repitiéndolas 😴',
    t: '21:19',
  },
  {
    from: 'franco',
    html: 'También integrar el sistema con otros sistemas externos, que en la práctica es donde se cae la mayoría de los proyectos.',
    t: '21:19',
  },

  { from: 'visitor', html: '¿Y con la IA cómo te llevás?', t: '21:20' },
  {
    from: 'franco',
    html: 'La uso en serio: gestiono el proyecto con metodologías ágiles, a través de un orquestador y con SDD (Spec Driven Development), aplicando esas mismas cinco etapas.',
    t: '21:20',
  },
  {
    from: 'franco',
    html: 'Sé conducirla porque antes del boom me tocó hacer todo eso a mano. Esa base es justo lo que me parece que se está perdiendo.',
    t: '21:20',
  },

  { from: 'visitor', html: '¿Dónde estás ubicado?', t: '21:21' },
  {
    from: 'franco',
    html: 'Trelew, Chubut 🇦🇷. Nací acá. Tengo 22 años.',
    t: '21:21',
  },
  {
    from: 'franco',
    html: 'Dato de color: este sitio está alojado en una Raspberry que tengo de servidor en casa.',
    t: '21:21',
  },

  { from: 'visitor', html: '¿Puedo ver tus proyectos?', t: '21:22' },
  {
    from: 'franco',
    html: 'Sí, mirá: <a href="#" data-action="proyectos">abrir mis proyectos</a>',
    t: '21:22',
  },
  {
    from: 'franco',
    html: 'Está mi proyecto final de la tecnicatura, AtmOS del NASA Space Apps (mención honorable y nominado global), y las landings que hago para negocios.',
    t: '21:22',
  },

  { from: 'visitor', html: '¿Tenés CV?', t: '21:23' },
  {
    from: 'franco',
    html: '📄 <a href="/cv-franco-soler.pdf" target="_blank" rel="noopener">CV — Franco Soler.pdf</a>',
    t: '21:23',
  },

  { from: 'visitor', html: '¿Cómo te contacto?', t: '21:23' },
  {
    from: 'franco',
    html: 'Por mail: <a href="mailto:francomartin2012@hotmail.com">francomartin2012@hotmail.com</a>',
    t: '21:23',
  },
  {
    from: 'franco',
    html: 'O por LinkedIn: <a href="https://www.linkedin.com/in/TU-USUARIO" target="_blank" rel="noopener">linkedin.com/in/TU-USUARIO</a>',
    t: '21:23',
  },
  {
    from: 'franco',
    html: 'Y si querés ver el lado menos formal: <a href="https://www.instagram.com/TU-USUARIO" target="_blank" rel="noopener">Instagram</a>',
    t: '21:23',
  },

  { from: 'visitor', html: 'Buenísimo. Te escribo.', t: '21:24' },
  {
    from: 'franco',
    html: 'Te leo. Y si te quedó alguna duda, escribime acá abajo 👇',
    t: '21:24',
  },
];
