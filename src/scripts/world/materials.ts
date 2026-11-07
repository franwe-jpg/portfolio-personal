import * as T from 'three';

/** Flat-shaded standard material, the look of every solid in the dioramas. */
export const M = (color: number, o: T.MeshStandardMaterialParameters = {}): T.MeshStandardMaterial =>
  new T.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0, flatShading: true, ...o });

/** Shared palette. Static props batch by material, so each entry is one draw call per scene. */
export const mat = {
  slab: M(0x1c2027),
  floor: M(0x2a2f38),
  wall: M(0x252a32),
  wall2: M(0x2f3540),
  trim: M(0x3a4250),
  furn: M(0x434b58),
  furnL: M(0x5a6372),
  pale: M(0x9aa3b0),
  paper: M(0xc9cfd8),
  dark: M(0x15181d),
  black: M(0x0f1114),
  metal: M(0x6b7482, { roughness: 0.45, metalness: 0.35 }),
  plant: M(0x3d6b57),
  plant2: M(0x335a49),
  pot: M(0x5b6370),
  sofa: M(0x4a5361),
  cushion: M(0x5a6372),
  rug: M(0x333a46),
  rug2: M(0x3f3a40),
  plum: M(0x5a4458),
  screen: M(0x27313a, { emissive: 0x6f8aa0, emissiveIntensity: 0.55, roughness: 0.4 }),
  screen2: M(0x1f2a24, { emissive: 0x3fa883, emissiveIntensity: 0.5, roughness: 0.4 }),
  dog: M(0x16181c, { flatShading: false, roughness: 0.7 }),
  catW: M(0xe4e6e9),
  catO: M(0xd9873a),
  catB: M(0x22252c),
  silver: M(0xc6ccd4, { roughness: 0.3, metalness: 0.7 }),
  glass: M(0x2a2e36, { roughness: 0.35, metalness: 0.5 }),
  red: new T.MeshBasicMaterial({ color: 0xe25544 }),
  eye: new T.MeshBasicMaterial({ color: 0xf0d060 }),
  glassDay: M(0x34465a, { emissive: 0x1a2a3a, emissiveIntensity: 1, roughness: 0.3 }),
  glassNight: M(0x0f1824, { emissive: 0x0a121d, emissiveIntensity: 1, roughness: 0.3 }),
  shade: M(0xd9c7a8, { emissive: 0xffc98a, emissiveIntensity: 0.55 }),
  signal: new T.MeshBasicMaterial({ color: 0x1fbf75 }),
  moon: new T.MeshBasicMaterial({ color: 0xdfe4ea }),
};

/** Materials of a figure (skin, hair, shirt, pants, shoes). */
export interface FigureMats {
  skin: T.MeshStandardMaterial;
  hair: T.MeshStandardMaterial;
  shirt: T.MeshStandardMaterial;
  pants: T.MeshStandardMaterial;
  shoes: T.MeshStandardMaterial;
}

/** Franco's own materials: the hover tint touches only these. */
export const fr: FigureMats = {
  skin: M(0xc8a68e),
  hair: M(0x4e3424),
  shirt: M(0x8fbbdc),
  pants: M(0x15181d),
  shoes: M(0x0c0e11),
};
export const francoMats = [fr.skin, fr.hair, fr.shirt, fr.pants, fr.shoes];

/** Secondary people get their own materials, cached per colour, so Franco's hover never tints them. */
const pmCache = new Map<number, T.MeshStandardMaterial>();
export function pm(hex: number): T.MeshStandardMaterial {
  let m = pmCache.get(hex);
  if (!m) {
    m = M(hex);
    pmCache.set(hex, m);
  }
  return m;
}

export const gridMat = new T.LineBasicMaterial({ color: 0x3a4250, transparent: true, opacity: 0.45 });
export const edgeMat = new T.LineBasicMaterial({ color: 0x1fbf75, transparent: true, opacity: 0.75 });
