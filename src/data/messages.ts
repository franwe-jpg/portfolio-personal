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

    { from: 'visitor', html: '¿Dónde estás ubicado?' },
    {
      from: 'franco',
      html: 'Trelew, Chubut 🇦🇷. Nací acá. Tengo 22 años.',
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

    { from: 'visitor', html: 'Where are you based?' },
    {
      from: 'franco',
      html: 'Trelew, Chubut 🇦🇷. Born here. I’m 22.',
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

/**
 * Questions the script no longer asks. They are offered as suggestion chips
 * once the live chat opens; the AI persona answers them from its own facts.
 */
export const SUGGESTIONS: Record<Lang, string[]> = {
  es: [
    '¿Y experiencia?',
    '¿Qué sabés hacer, concretamente?',
    '¿Y con la IA cómo te llevás?',
    '¿Tenés algún hobbie?',
  ],
  en: [
    'And experience?',
    'What can you actually do?',
    'How do you get along with AI?',
    'Any hobbies?',
  ],
};
