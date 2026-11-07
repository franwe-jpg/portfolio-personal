import type { Scene } from '../i18n/ui';
import { params } from './env';
import { resolveScene } from './schedule';

export const PAGES = ['inicio', 'mundo', 'proyectos', 'sobre'] as const;
export type Page = (typeof PAGES)[number];
export const isPage = (value: unknown): value is Page => PAGES.includes(value as Page);

export const SCENES: readonly Scene[] = ['office', 'uni', 'home'];
/** `auto` follows the Argentina schedule; a scene name forces that diorama. */
export type Mode = 'auto' | Scene;

/** `?escena=` values, in Spanish, as the prototype documents them. */
export const PARAM_TO_SCENE: Record<string, Scene> = { oficina: 'office', universidad: 'uni', disponible: 'home' };
export const SCENE_TO_PARAM: Record<Scene, string> = { office: 'oficina', uni: 'universidad', home: 'disponible' };

export interface AppState {
  mode: Mode;
  scene: Scene;
  /** Active page; null until the visitor enters through the gate. */
  page: Page | null;
  entered: boolean;
  panelOpen: boolean;
  /** A scene switch or page transition is running: inputs that would overlap wait. */
  busy: boolean;
  audio: boolean;
}

const initialMode: Mode = PARAM_TO_SCENE[params.get('escena') ?? ''] ?? 'auto';

/** Single mutable app state. Modules read it directly and write only their own fields. */
export const state: AppState = {
  mode: initialMode,
  scene: resolveScene(initialMode),
  page: null,
  entered: false,
  panelOpen: false,
  busy: false,
  audio: false,
};

/** Custom events the modules use to stay decoupled (listen on `document`). */
export interface AppEvents {
  /** The visitor has entered: `#app` is visible and the first page is about to show. */
  'app:enter': CustomEvent<void>;
  /** A page transition starts (panel, audio and world react before the blob covers the screen). */
  'app:navigate': CustomEvent<Page>;
  /** A page just became active. */
  'app:pageswap': CustomEvent<Page>;
  /** The visitor tapped Franco in the world (or the fallback's button): the panel (Fase 6) opens. */
  'app:talk': CustomEvent<'world' | 'button'>;
  /** The chat/contact panel just closed (the ticket hunt, Fase 8, clears the surprise screens then). */
  'app:panelclose': CustomEvent<void>;
}

export function emit<K extends keyof AppEvents>(type: K, detail?: AppEvents[K]['detail']): void {
  document.dispatchEvent(new CustomEvent(type, { detail }));
}

export function on<K extends keyof AppEvents>(type: K, handler: (event: AppEvents[K]) => void): void {
  document.addEventListener(type, handler as EventListener);
}
