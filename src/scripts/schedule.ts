import type { Scene } from '../i18n/ui';
import { t } from './i18n';
import type { Mode } from './state';

/** Argentina time (UTC-3 all year) decides which diorama is the "current" one. */
const TZ = 'America/Argentina/Buenos_Aires';

export interface ArgentinaNow {
  hour: number;
  weekend: boolean;
  /** "HH:MM" in the site locale. */
  time: string;
}

export function argNow(): ArgentinaNow {
  const date = new Date();
  const hour = +new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', hourCycle: 'h23' }).format(date);
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' }).format(date);
  const time = new Intl.DateTimeFormat(t.locale, {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
  return { hour, weekend: weekday === 'Sat' || weekday === 'Sun', time };
}

/** Schedule: Mon–Fri 07–13 office, Mon–Fri 14–19 university, otherwise available. */
export function sceneFor(now: ArgentinaNow): Scene {
  if (now.weekend) return 'home';
  if (now.hour >= 7 && now.hour < 13) return 'office';
  if (now.hour >= 14 && now.hour < 19) return 'uni';
  return 'home';
}

export const resolveScene = (mode: Mode): Scene => (mode === 'auto' ? sceneFor(argNow()) : mode);

/** Signature hour of each hand-picked scene, for the wall clocks. */
export const SCENE_HOUR: Record<Scene, number> = { office: 9, uni: 16, home: 21 };
/** Tapping a wall clock cycles the scenes in this order. */
export const CLOCK_NEXT: Record<Scene, Scene> = { home: 'office', office: 'uni', uni: 'home' };

/** Minutes since midnight in Argentina (fixed UTC-3), with the seconds as a fraction. */
export function realMinutes(): number {
  const d = new Date(Date.now() - 3 * 3600e3);
  return d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60;
}

/** What the wall clocks show: the real time in auto mode, the scene's signature hour otherwise (seconds always run). */
export function clockMinutes(mode: Mode): number {
  const real = realMinutes();
  return mode === 'auto' ? real : SCENE_HOUR[mode] * 60 + (real % 1);
}

export const statusLine = (scene: Scene): string => t.mundo.statusLine(t.mundo.scenes[scene], argNow().time);
