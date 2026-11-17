import type { APIRoute } from 'astro';
import { terminalCard } from '../lib/terminal-card';

/** `curl francosolersistemas.com/hola`: a card for the terminal (src/lib/terminal-card.ts). */
export const prerender = false;

export const GET: APIRoute = ({ request }) => terminalCard(request, 'es');
