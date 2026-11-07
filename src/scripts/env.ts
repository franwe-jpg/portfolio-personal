/** Environment flags read once at startup. */

export const params = new URLSearchParams(location.search);
export const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const FINE = matchMedia('(pointer: fine)').matches;
export const COARSE = matchMedia('(pointer: coarse)').matches;
/** `?debug` exposes internals on `window` for headless checks. */
export const DEBUG = params.has('debug');

export const isNarrow = (): boolean => innerWidth < 768;
