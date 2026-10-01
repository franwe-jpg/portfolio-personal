import type { Lang } from '../i18n/config';

export type MessageAuthor = 'franco' | 'visitor';

export interface ChatMessage {
  from: MessageAuthor;
  /** Authored markup, rendered with innerHTML. Never holds network content. */
  html: string;
}

// `data-action="proyectos"` is a selector read by src/scripts/landing.ts, so it
// is byte-identical in every language. Only the anchor text is translated.
export const MESSAGES: Record<Lang, ChatMessage[]> = {
  es: [
    { from: 'franco', html: 'Hola, ¿estas ahi?' },
    { from: 'visitor', html: 'Hola.' },
    { from: 'franco', html: 'Hola! Soy Franco 👋' },
    {
      from: 'franco',
      html: 'Gracias por abrir el chat. Charlemos un rato',
    },

    { from: 'visitor', html: '¿A qué te dedicás?' },
    {
      from: 'franco',
      html: 'Soy Analista Programador, recibido en 2025, y estoy cursando cuarto año de la Licenciatura en Sistemas.',
    },
    {
      from: 'franco',
      html: 'Principalmente hago desarrollo web, creando sistemas desde cero',
    },

    { from: 'visitor', html: '¿Y experiencia?' },
    {
      from: 'franco',
      html: 'Hoy trabajo de lo mío en la <b>Legislatura de Chubut</b>, va mi primer año.',
    },
    {
      from: 'franco',
      html: 'Antes estuve un año en la oficina de Desarrollo de Software de la <b>Subsecretaría de Innovación de Chubut</b>.',
    },
    {
      from: 'franco',
      html: 'Y mi primer trabajo fueron dos años y medio como administrativo en una empresa de comercio. Ahí aprendí a tratar con gente, que después resultó ser la mitad del laburo.',
    },

    { from: 'visitor', html: '¿Qué sabés hacer, concretamente?' },
    {
      from: 'franco',
      html: 'Teoricamente las 5 etapas de un producto: hablar con el cliente, sacar requerimientos funcionales y no funcionales, diseñar, implementar, verificar y validar, y después mantener y escalar.',
    },
    {
      from: 'franco',
      html: 'Me las sé de memoria, te diría que a la fuerza: tres materias de Desarrollo de Software seguidas 😴',
    },
    {
      from: 'franco',
      html: 'También integrar el sistema con otros sistemas externos.',
    },

    { from: 'visitor', html: '¿Y con la IA cómo te llevás?' },
    {
      from: 'franco',
      html: 'La uso en serio: gestiono el proyecto con metodologías ágiles, a través de un orquestador y con SDD (Spec Driven Development), aplicando esas mismas cinco etapas.',
    },
    {
      from: 'franco',
      html: 'Sé conducirla porque antes del boom me tocó hacer todo eso a mano. Esa base es justo lo que me parece que se está perdiendo.',
    },

    { from: 'visitor', html: '¿Dónde estás ubicado?' },
    {
      from: 'franco',
      html: 'Trelew, Chubut 🇦🇷. Nací acá. Tengo 22 años.',
    },
    {
      from: 'franco',
      html: 'Dato de color: este sitio está alojado en una Raspberry que tengo de servidor en casa.',
    },

    { from: 'visitor', html: '¿Tenés algún hobbie?' },
    {
      from: 'franco',
      html: 'Varios. Me gusta explorar y hacer trekking por la naturaleza, que acá en Chubut sobra 🏔️',
    },
    {
      from: 'franco',
      html: 'Puertas adentro: cine y series, sobre todo ciencia ficción, tambien novelas de misterio y aventura.',
    },
    {
      from: 'franco',
      html: ' ademas ultimamente la ciberseguridad y el hacking ético, y sobre todo: hacerle bromas técnicas a mis compañeros. Con esas debería arrancar un blog para enseñarlas.',
    },

    { from: 'visitor', html: '¿Puedo ver tus proyectos?' },
    {
      from: 'franco',
      html: 'Sí, mirá: <a href="#" data-action="proyectos">abrir mis proyectos</a>',
    },
    {
      from: 'franco',
      html: 'Está mi proyecto final de la tecnicatura, y las landings que hago para instituciones/negocios.',
    },
    { from: 'visitor', html: '¿Cómo te contacto?' },
    {
      from: 'franco',
      html: 'Por mail: <a href="mailto:francomartin2012@hotmail.com">francomartin2012@hotmail.com</a>',
    },
    {
      from: 'franco',
      html: 'O por LinkedIn: <a href="https://www.linkedin.com/in/franco-martin-soler-19745a346/" target="_blank" rel="noopener">linkedin.com/in/franco-martin-soler</a>',
    },
    {
      from: 'franco',
      html: 'Y si querés ver el lado menos formal: <a href="https://www.instagram.com/fr4ncosoler/" target="_blank" rel="noopener">Instagram</a>',
    },

    { from: 'visitor', html: 'Buenísimo. Te escribo.' },
    {
      from: 'franco',
      html: 'Te leo. Y si te quedó alguna duda, escribime acá abajo 👇',
    },
  ],

  en: [
    { from: 'franco', html: 'Hey, you there?' },
    { from: 'visitor', html: 'Hi.' },
    { from: 'franco', html: "Hi! I'm Franco 👋" },
    {
      from: 'franco',
      html: 'Thanks for opening the chat. Let’s talk for a bit',
    },

    { from: 'visitor', html: 'What do you do?' },
    {
      from: 'franco',
      html: "I'm a software analyst — Analista Programador, graduated in 2025 — and I'm in my fourth year of the Licenciatura en Sistemas.",
    },
    {
      from: 'franco',
      html: 'Mostly web development, building systems from scratch',
    },

    { from: 'visitor', html: 'And experience?' },
    {
      from: 'franco',
      html: "Right now I do exactly that at the <b>Legislatura de Chubut</b>. It's my first year there.",
    },
    {
      from: 'franco',
      html: 'Before that I spent a year in the software development office of the <b>Subsecretaría de Innovación de Chubut</b>.',
    },
    {
      from: 'franco',
      html: 'And my first job was two and a half years as an admin clerk at a retail company. That’s where I learned to deal with people, which turned out to be half the job.',
    },

    { from: 'visitor', html: 'What can you actually do?' },
    {
      from: 'franco',
      html: 'In theory, all 5 stages of a product: talk to the client, pull out the functional and non-functional requirements, design it, build it, verify and validate it, and then maintain and scale it.',
    },
    {
      from: 'franco',
      html: 'I know them by heart — not by choice, mind you: three software development courses drilling the same thing 😴',
    },
    {
      from: 'franco',
      html: 'Also wiring the system up to other external systems.',
    },

    { from: 'visitor', html: 'How do you get along with AI?' },
    {
      from: 'franco',
      html: 'I use it seriously: I run the project with agile methods, through an orchestrator and with SDD (Spec Driven Development), applying those same five stages.',
    },
    {
      from: 'franco',
      html: 'I know how to steer it because before the boom I had to do all of that by hand. That groundwork is exactly what I think is getting lost.',
    },

    { from: 'visitor', html: 'Where are you based?' },
    {
      from: 'franco',
      html: 'Trelew, Chubut 🇦🇷. Born here. I’m 22.',
    },
    {
      from: 'franco',
      html: 'Fun fact: this site is hosted on a Raspberry Pi I keep as a home server.',
    },

    { from: 'visitor', html: 'Any hobbies?' },
    {
      from: 'franco',
      html: 'A few. I like getting out and trekking in nature, which Chubut has no shortage of 🏔️',
    },
    {
      from: 'franco',
      html: 'Indoors: films and series, mostly sci-fi, plus mystery and adventure novels.',
    },
    {
      from: 'franco',
      html: ' lately also cybersecurity and ethical hacking, and above all: pulling technical pranks on my coworkers. I should really start a blog to teach those.',
    },

    { from: 'visitor', html: 'Can I see your projects?' },
    {
      from: 'franco',
      html: 'Sure, here: <a href="#" data-action="proyectos">open my projects</a>',
    },
    {
      from: 'franco',
      html: 'There’s my final project from the degree, and the landing pages I build for institutions and businesses.',
    },
    { from: 'visitor', html: 'How do I reach you?' },
    {
      from: 'franco',
      html: 'By email: <a href="mailto:francomartin2012@hotmail.com">francomartin2012@hotmail.com</a>',
    },
    {
      from: 'franco',
      html: 'Or on LinkedIn: <a href="https://www.linkedin.com/in/franco-martin-soler-19745a346/" target="_blank" rel="noopener">linkedin.com/in/franco-martin-soler</a>',
    },
    {
      from: 'franco',
      html: 'And if you want the less formal side: <a href="https://www.instagram.com/fr4ncosoler/" target="_blank" rel="noopener">Instagram</a>',
    },

    { from: 'visitor', html: 'Great. I’ll write to you.' },
    {
      from: 'franco',
      html: 'I’ll be reading. And if anything is still unclear, write to me down here 👇',
    },
  ],
};
