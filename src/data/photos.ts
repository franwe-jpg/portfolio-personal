import type { Lang } from '../i18n/config';

/**
 * The "Fotos" section. Files live in `public/fotos/` (webp, 1600 px on the long side at most,
 * metadata stripped). `width`/`height` are the file's real size: the grid keeps every photo at
 * its own ratio, so portrait shots stay portrait. The page shows `PHOTOS_PER_PAGE` at a time and
 * "Ver más fotos" swaps the whole group for the next one, in this order.
 */
export const PHOTOS_PER_PAGE = 7;

interface PhotoCopy {
  caption: string;
  /** Defaults to the caption. */
  alt?: string;
}

interface PhotoEntry {
  file: string;
  width: number;
  height: number;
  es: PhotoCopy;
  en: PhotoCopy;
}

export interface Photo {
  src: string;
  width: number;
  height: number;
  caption: string;
  alt: string;
}

const PHOTOS: PhotoEntry[] = [
  {
    file: '2026-01-17-montana.webp',
    width: 1600,
    height: 900,
    es: { caption: 'Montaña · ene 2026', alt: 'Franco, de gorra y con mochila, mirando un valle entre montañas.' },
    en: { caption: 'Mountain · Jan 2026', alt: 'Franco, wearing a cap and a backpack, looking over a valley between mountains.' },
  },
  { file: 'velero-lago.webp', width: 1600, height: 900, es: { caption: 'Velero en el lago · ene 2026' }, en: { caption: 'Sailboat on the lake · Jan 2026' } },
  { file: 'camino-montana.webp', width: 900, height: 1600, es: { caption: 'Camino a la montaña · ene 2026' }, en: { caption: 'Path to the mountains · Jan 2026' } },
  { file: 'luna-mar.webp', width: 1600, height: 1200, es: { caption: 'Luna sobre el mar · sep 2024' }, en: { caption: 'Moon over the sea · Sep 2024' } },
  { file: 'abejorro-cardo.webp', width: 1600, height: 1200, es: { caption: 'Abejorro en un cardo' }, en: { caption: 'Bumblebee on a thistle' } },
  { file: 'acantilado-atardecer.webp', width: 900, height: 1600, es: { caption: 'Atardecer en el acantilado' }, en: { caption: 'Sunset by the cliff' } },
  { file: 'bote-lago.webp', width: 1200, height: 1600, es: { caption: 'Bote en el lago · ene 2026' }, en: { caption: 'Raft on the lake · Jan 2026' } },

  { file: 'atardecer-meseta.webp', width: 1600, height: 900, es: { caption: 'Atardecer en la meseta' }, en: { caption: 'Sunset over the steppe' } },
  { file: 'puente-rojo.webp', width: 900, height: 1600, es: { caption: 'Puente rojo · mar 2026' }, en: { caption: 'Red bridge · Mar 2026' } },
  { file: 'gaviotines.webp', width: 1600, height: 1200, es: { caption: 'Gaviotines en la amarra' }, en: { caption: 'Terns on a mooring line' } },
  { file: 'margarita.webp', width: 1200, height: 1600, es: { caption: 'Margarita · dic 2024' }, en: { caption: 'Daisy · Dec 2024' } },
  { file: 'vacas-camino.webp', width: 1600, height: 900, es: { caption: 'Vacas en el camino · ene 2026' }, en: { caption: 'Cows on the trail · Jan 2026' } },
  { file: 'lagartija.webp', width: 1600, height: 1200, es: { caption: 'Lagartija en la piedra · feb 2024' }, en: { caption: 'Lizard on the rock · Feb 2024' } },
  { file: 'luna-noche.webp', width: 1600, height: 1200, es: { caption: 'Luna de noche · sep 2024' }, en: { caption: 'Moon at night · Sep 2024' } },

  { file: 'valle-bosque.webp', width: 1600, height: 900, es: { caption: 'Valle en el bosque · ene 2026' }, en: { caption: 'Forest valley · Jan 2026' } },
  { file: 'arbol-banco.webp', width: 1200, height: 1600, es: { caption: 'Árbol y banco · ene 2026' }, en: { caption: 'Tree and bench · Jan 2026' } },
  { file: 'pez-nenufares.webp', width: 1600, height: 1200, es: { caption: 'Pez entre nenúfares · ene 2026' }, en: { caption: 'Fish among lily pads · Jan 2026' } },
  { file: 'arcoiris-ruta.webp', width: 1200, height: 1600, es: { caption: 'Arcoíris en la ruta' }, en: { caption: 'Rainbow on the road' } },
  { file: 'tormenta-ruta.webp', width: 1179, height: 641, es: { caption: 'Tormenta en la ruta · nov 2026' }, en: { caption: 'Storm on the road · Nov 2026' } },
  { file: 'barco-puerto.webp', width: 1200, height: 1600, es: { caption: 'Barco en el puerto · ene 2026' }, en: { caption: 'Ship in port · Jan 2026' } },
  { file: 'caminando-lago.webp', width: 1600, height: 1200, es: { caption: 'Caminando junto al lago' }, en: { caption: 'Walking by the lake' } },

  { file: 'luna-saliendo.webp', width: 1600, height: 1200, es: { caption: 'Luna saliendo del mar · sep 2024' }, en: { caption: 'Moonrise over the sea · Sep 2024' } },
  { file: 'muelle-lago.webp', width: 1600, height: 584, es: { caption: 'Muelle en el lago · ene 2026' }, en: { caption: 'Lake pier · Jan 2026' } },
  { file: 'niebla-sierras.webp', width: 1600, height: 1200, es: { caption: 'Niebla en las sierras' }, en: { caption: 'Fog over the hills' } },
  { file: 'cerro.webp', width: 900, height: 1600, es: { caption: 'Cerro · ago 2026' }, en: { caption: 'Hill · Aug 2026' } },
  { file: 'puerta-vieja.webp', width: 1600, height: 1200, es: { caption: 'Puerta vieja' }, en: { caption: 'Old door' } },
  { file: 'avioneta.webp', width: 1600, height: 1200, es: { caption: 'Avioneta bajo el cielo gris · ene 2026' }, en: { caption: 'Light plane under a grey sky · Jan 2026' } },
];

/** The photos for `lang`, split into the groups "Ver más fotos" cycles through. */
export function photoPagesFor(lang: Lang): Photo[][] {
  const photos = PHOTOS.map(({ file, width, height, ...copy }) => ({
    src: `/fotos/${file}`,
    width,
    height,
    caption: copy[lang].caption,
    alt: copy[lang].alt ?? copy[lang].caption,
  }));
  const pages: Photo[][] = [];
  for (let i = 0; i < photos.length; i += PHOTOS_PER_PAGE) pages.push(photos.slice(i, i + PHOTOS_PER_PAGE));
  return pages;
}
