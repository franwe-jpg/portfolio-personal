import type * as T from 'three';

/** What every diorama module returns; later phases add their fields here. */
export interface Diorama {
  root: T.Group;
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
