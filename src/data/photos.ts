import type { Lang } from '../i18n/config';

/**
 * The "Fotos" section. Files live in `public/fotos/` (webp, 1600 px on the long side at most,
 * metadata stripped). `width`/`height` are the file's real size: the grid keeps every photo at
 * its own ratio, so portrait shots stay portrait. The page shows one group at a time, in this
 * order; src/scripts/photos.ts sizes the groups to the screen (about 9 on desktop, 7 on phones)
 * and "Ver más fotos" swaps the whole group for the next one.
 */
/** Shown before the script runs (and without it). */
export const PHOTOS_FIRST_GROUP = 7;

interface PhotoEntry {
  file: string;
  width: number;
  height: number;
  /** Year and month the photo was taken (`YYYY-MM`), only when the file's own metadata says so. */
  date?: string;
  /** Not shown: read by screen readers and search engines. */
  alt: Record<Lang, string>;
}

export interface Photo {
  src: string;
  width: number;
  height: number;
  /** The month it was taken ("ene 2026"), or empty: the photos carry no other caption. */
  date: string;
  alt: string;
}

const PHOTOS: PhotoEntry[] = [
  { file: '2026-01-17-montana.webp', width: 1600, height: 900, date: '2026-01', alt: { es: 'Franco, de gorra y con mochila, mirando un valle entre montañas.', en: 'Franco, wearing a cap and a backpack, looking over a valley between mountains.' } },
  { file: 'velero-lago.webp', width: 1600, height: 900, date: '2026-01', alt: { es: 'Velero en el lago', en: 'Sailboat on the lake' } },
  { file: 'camino-montana.webp', width: 900, height: 1600, date: '2026-01', alt: { es: 'Camino a la montaña', en: 'Path to the mountains' } },
  { file: 'luna-mar.webp', width: 1600, height: 1200, date: '2024-09', alt: { es: 'Luna sobre el mar', en: 'Moon over the sea' } },
  { file: 'abejorro-cardo.webp', width: 1600, height: 1200, alt: { es: 'Abejorro en un cardo', en: 'Bumblebee on a thistle' } },
  { file: 'acantilado-atardecer.webp', width: 900, height: 1600, date: '2026-05', alt: { es: 'Atardecer en el acantilado', en: 'Sunset by the cliff' } },
  { file: 'bote-lago.webp', width: 1200, height: 1600, date: '2026-01', alt: { es: 'Bote en el lago', en: 'Raft on the lake' } },
  { file: 'atardecer-meseta.webp', width: 1600, height: 900, date: '2026-06', alt: { es: 'Atardecer en la meseta', en: 'Sunset over the steppe' } },
  { file: 'puente-rojo.webp', width: 900, height: 1600, alt: { es: 'Puente rojo', en: 'Red bridge' } },
  { file: 'gaviotines.webp', width: 1600, height: 1200, alt: { es: 'Gaviotines en la amarra', en: 'Terns on a mooring line' } },
  { file: 'margarita.webp', width: 1200, height: 1600, date: '2024-12', alt: { es: 'Margarita', en: 'Daisy' } },
  { file: 'vacas-camino.webp', width: 1600, height: 900, date: '2026-01', alt: { es: 'Vacas en el camino', en: 'Cows on the trail' } },
  { file: 'lagartija.webp', width: 1600, height: 1200, date: '2024-02', alt: { es: 'Lagartija en la piedra', en: 'Lizard on the rock' } },
  { file: 'luna-noche.webp', width: 1600, height: 1200, date: '2024-09', alt: { es: 'Luna de noche', en: 'Moon at night' } },
  { file: 'valle-bosque.webp', width: 1600, height: 900, date: '2026-01', alt: { es: 'Valle en el bosque', en: 'Forest valley' } },
  { file: 'arbol-banco.webp', width: 1200, height: 1600, date: '2026-01', alt: { es: 'Árbol y banco', en: 'Tree and bench' } },
  { file: 'pez-nenufares.webp', width: 1600, height: 1200, date: '2026-01', alt: { es: 'Pez entre nenúfares', en: 'Fish among lily pads' } },
  { file: 'arcoiris-ruta.webp', width: 1200, height: 1600, date: '2026-10', alt: { es: 'Arcoíris en la ruta', en: 'Rainbow on the road' } },
  { file: 'tormenta-ruta.webp', width: 1179, height: 641, date: '2026-11', alt: { es: 'Tormenta en la ruta', en: 'Storm on the road' } },
  { file: 'barco-puerto.webp', width: 1200, height: 1600, date: '2026-01', alt: { es: 'Barco en el puerto', en: 'Ship in port' } },
  { file: 'caminando-lago.webp', width: 1600, height: 1200, alt: { es: 'Caminando junto al lago', en: 'Walking by the lake' } },
  { file: 'luna-saliendo.webp', width: 1600, height: 1200, date: '2024-09', alt: { es: 'Luna saliendo del mar', en: 'Moonrise over the sea' } },
  { file: 'muelle-lago.webp', width: 1600, height: 584, date: '2026-01', alt: { es: 'Muelle en el lago', en: 'Lake pier' } },
  { file: 'niebla-sierras.webp', width: 1600, height: 1200, alt: { es: 'Niebla en las sierras', en: 'Fog over the hills' } },
  { file: 'cerro.webp', width: 900, height: 1600, date: '2026-08', alt: { es: 'Cerro', en: 'Hill' } },
  { file: 'puerta-vieja.webp', width: 1600, height: 1200, alt: { es: 'Puerta vieja', en: 'Old door' } },
  { file: 'avioneta.webp', width: 1600, height: 1200, date: '2026-01', alt: { es: 'Avioneta bajo el cielo gris', en: 'Light plane under a grey sky' } },
];

const MONTHS: Record<Lang, string[]> = {
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

function formatDate(date: string | undefined, lang: Lang): string {
  if (!date) return '';
  const [year, month] = date.split('-');
  return `${MONTHS[lang][Number(month) - 1]} ${year}`;
}

/** Every photo for `lang`, in page order. */
export function photosFor(lang: Lang): Photo[] {
  return PHOTOS.map(({ file, width, height, date, alt }) => ({
    src: `/fotos/${file}`,
    width,
    height,
    date: formatDate(date, lang),
    alt: alt[lang],
  }));
}
