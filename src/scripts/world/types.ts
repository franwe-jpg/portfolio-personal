import type * as T from 'three';
import type { Clock } from './clock';
import type { Franco } from './figure';

/** POV framing (plan, Fase 6): distance behind Franco's head, height, shoulder offset and fov. */
export interface PovFraming {
  back: number;
  up: number;
  side: number;
  fov: number;
}

/** What the POV camera looks at from behind Franco, with optional per-scene framing overrides. */
export interface PovSpec {
  target: T.Vector3;
  wide?: Partial<PovFraming>;
  narrow?: Partial<PovFraming>;
  /** Fixed "behind" axis (otherwise from the target towards Franco's head). */
  back?: T.Vector3;
}

/** Surprise shot (plan, Fase 8): the screen to frame, straight on, and how far from it. */
export interface Shot {
  mesh: T.Mesh;
  dist: number;
  lift?: number;
  yaw?: number;
  /** Draw the screen over whatever crosses the view while the shot lasts. */
  onTop?: boolean;
}

/** What every diorama module returns; later phases add their fields here. */
export interface Diorama {
  root: T.Group;
  franco: Franco;
  clock?: Clock;
  pov?: PovSpec;
  shot?: Shot;
  /** Where the hidden ticket peeks out (plan, Fase 8), local to `root`. */
  tkSpot?: T.Vector3;
  /** Puts the surprise phrase on the screens, or restores them (plan, Fase 8). */
  surprise?(on: boolean): void;
  update(t: number, dt: number): void;
  /** Global light levels while this scene is active. */
  light: { hemi: number; sun: number; sunColor: number };
  /** Scene-local lights with their active intensity; 0 while another scene shows. */
  lights: [T.Light, number][];
  /** Told whether the scene is active and in view (the living-room TV plays only then). */
  onActive?(on: boolean): void;
  /** Told when the POV view starts or ends (the projector cone hides then). */
  onFocus?(on: boolean): void;
}
