import { QUOTES, type Quote } from '../data/quotes';
import { lang } from './i18n';

/**
 * Which surprise quote this visitor sees. The order is shuffled once per browser and kept in
 * localStorage with a cursor; `advanceQuote` moves the cursor when the hunt restarts, so every
 * visitor walks through the list in their own order.
 */
const KEY = 'fs-frases';

interface Stored {
  order: number[];
  i: number;
}

const LIST = QUOTES[lang];

function shuffled(): number[] {
  const order = LIST.map((_, index) => index);
  for (let a = order.length - 1; a > 0; a--) {
    const b = Math.floor(Math.random() * (a + 1));
    [order[a], order[b]] = [order[b], order[a]];
  }
  return order;
}

function valid(data: unknown): data is Stored {
  if (!data || typeof data !== 'object') return false;
  const { order, i } = data as Partial<Stored>;
  return (
    Array.isArray(order) &&
    order.length === LIST.length &&
    order.every((n) => Number.isInteger(n) && n >= 0 && n < LIST.length) &&
    new Set(order).size === LIST.length &&
    Number.isInteger(i) &&
    (i as number) >= 0
  );
}

function load(): Stored {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (valid(data)) return data;
  } catch {
    /* ignore */
  }
  const fresh = { order: shuffled(), i: 0 };
  save(fresh);
  return fresh;
}

function save(data: Stored): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage blocked: the order lasts this visit only */
  }
}

let stored: Stored | null = null;
const current = () => (stored ??= load());

/** The quote for this visitor's current run of the hunt. */
export function currentQuote(): Quote {
  const { order, i } = current();
  return LIST[order[i % order.length]];
}

/** Moves to the next quote of this visitor's order (called when the hunt restarts). */
export function advanceQuote(): void {
  const data = current();
  data.i = (data.i + 1) % data.order.length;
  save(data);
}
