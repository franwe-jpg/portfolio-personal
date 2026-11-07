/** Environment flags read once at startup. */

export const params = new URLSearchParams(location.search);
export const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const FINE = matchMedia('(pointer: fine)').matches;
export const COARSE = matchMedia('(pointer: coarse)').matches;
/** `?debug` exposes internals on `window` for headless checks. */
export const DEBUG = params.has('debug');

export const isNarrow = (): boolean => innerWidth < 768;

/** `?sinwebgl=1` simulates a browser without WebGL (the world then shows its SVG fallback). */
function hasWebGL(): boolean {
  if (params.get('sinwebgl') === '1') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}
export const WEBGL = hasWebGL();
