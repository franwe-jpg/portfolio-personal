import type { Scene } from '../../i18n/ui';
import { COARSE } from '../env';

/** Constants shared by every world module (ported from the prototype's `createWorld`). */

/** World x of each diorama root: the three slabs sit side by side, 18 units apart. */
export const SCENE_X: Record<Scene, number> = { office: -18, uni: 0, home: 18 };
/** Phone-class device: no shadows, lower pixel ratio, fewer secondary figures. */
export const MOBILE = COARSE || innerWidth < 768;
export const FOV = 24;
/** Animated screens redraw at most six times per second. */
export const FPS6 = 1 / 6;
export const MONO = '"JetBrains Mono", monospace';
