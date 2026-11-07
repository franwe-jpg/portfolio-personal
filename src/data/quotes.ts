import type { Lang } from '../i18n/config';

/** A phrase shown on the surprise screens, with the line that credits it. */
export interface Quote {
  text: string;
  source: string;
}

/**
 * Ticket-hunt surprise quotes. Same order in both languages (one index = one quote); the hunt
 * shuffles that order once per visitor and advances through it on every restart.
 */
export const QUOTES: Record<Lang, Quote[]> = {
  es: [
    {
      text: 'Ningún ser viviente puede reírse, con la excepción del hombre. Solo yo tengo el don de la risa, y puedo usarlo cuando quiera.',
      source: 'Og Mandino, El vendedor más grande del mundo (1968), pergamino VII',
    },
    {
      text: 'Cuando realmente deseas algo, el universo entero conspira para que puedas obtenerlo.',
      source: 'Paulo Coelho, El alquimista (1988)',
    },
    {
      text: 'Si existe alguna magia en este mundo, debe ser el intento de comprender a alguien que comparte algo.',
      source: 'Céline, Antes del amanecer (1995)',
    },
    {
      text: 'La seguridad del pájaro no se encuentra en la rama en que se apoya, sino en su capacidad de volar si esta se rompe.',
      source: 'Alguien a quien aprecio',
    },
    {
      text: 'Si solo haces lo que ya sabes hacer, no serás más de lo que ya eres.',
      source: 'Shifu, Kung Fu Panda 3 (2016)',
    },
    {
      text: 'Tendré que soportar dos o tres orugas si quiero conocer las mariposas.',
      source: 'Antoine de Saint-Exupéry, El principito (1943)',
    },
    {
      text: 'Únicamente sembrando la felicidad a nuestro alrededor podremos aumentar la nuestra.',
      source: 'Paulo Coelho, El don supremo (1991)',
    },
    {
      text: 'Es mucho más difícil juzgarse a sí mismo que juzgar a los demás. Si logras juzgarte bien a ti mismo, eres un verdadero sabio.',
      source: 'Antoine de Saint-Exupéry, El principito (1943)',
    },
    {
      text: 'Puede aún sobrecogerme el fracaso al dar mi milésimo paso, pero quizás el éxito se oculte detrás del siguiente recodo del camino. Jamás sabré cuán cerca estoy del éxito a menos que doble la curva.',
      source: 'Og Mandino, El vendedor más grande del mundo (1968), pergamino III',
    },
    {
      text: 'Tengo tan solo una vida, y la vida nada es sino una medida de tiempo. Si malgasto el hoy, destruyo la última página de mi vida.',
      source: 'Og Mandino, El vendedor más grande del mundo (1968), pergamino V',
    },
  ],
  en: [
    {
      text: 'No living creature can laugh except man. Only I have the gift of laughter, and I can use it whenever I choose.',
      source: 'Og Mandino, The Greatest Salesman in the World (1968), Scroll VII',
    },
    {
      text: 'When you want something, all the universe conspires in helping you to achieve it.',
      source: 'Paulo Coelho, The Alchemist (1988)',
    },
    {
      text: "If there's any kind of magic in this world, it must be in the attempt of understanding someone, sharing something.",
      source: 'Céline, Before Sunrise (1995)',
    },
    {
      text: 'A bird does not trust the branch it rests on; it trusts its own wings, should the branch break.',
      source: 'Someone I hold dear',
    },
    {
      text: 'If you only do what you can do, you will never be more than you are now.',
      source: 'Shifu, Kung Fu Panda 3 (2016)',
    },
    {
      text: 'I must endure the presence of two or three caterpillars if I wish to become acquainted with the butterflies.',
      source: 'Antoine de Saint-Exupéry, The Little Prince (1943)',
    },
    {
      text: 'Only by sowing happiness around us can we increase our own.',
      source: 'Paulo Coelho, The Supreme Gift (1991)',
    },
    {
      text: 'It is much more difficult to judge oneself than to judge others. If you succeed in judging yourself rightly, then you are indeed a man of true wisdom.',
      source: 'Antoine de Saint-Exupéry, The Little Prince (1943)',
    },
    {
      text: 'I may encounter failure at the thousandth step, yet success hides behind the next bend in the road. Never will I know how close it lies unless I turn the corner.',
      source: 'Og Mandino, The Greatest Salesman in the World (1968), Scroll III',
    },
    {
      text: 'I have but one life, and life is naught but a measurement of time. When I waste one, I destroy the other. If I waste today, I destroy the last page of my life.',
      source: 'Og Mandino, The Greatest Salesman in the World (1968), Scroll V',
    },
  ],
};
