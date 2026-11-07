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

/** Signature hour of each hand-picked scene, for the wall clocks (plan, Fase 5). */
export const SCENE_HOUR: Record<Scene, number> = { office: 9, uni: 16, home: 21 };

export const statusLine = (scene: Scene): string => t.mundo.statusLine(t.mundo.scenes[scene], argNow().time);
