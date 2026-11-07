import type { Lang } from '../i18n/config';

/**
 * A photo in the "Fotos" grid. Files live in `public/fotos/` (webp, 1600 px wide
 * at most). `width`/`height` decide the cell: landscape shots take two columns,
 * portrait ones two rows; `wide`/`tall` force it. Without `src` the grid shows a
 * dashed slot with the caption, until the photo exists.
 */
export interface PhotoBase {
  src?: string;
  width?: number;
  height?: number;
  wide?: boolean;
  tall?: boolean;
}

export interface PhotoCopy {
  alt?: string;
  caption: string;
}

export interface Photo extends PhotoBase, PhotoCopy {
  /** Grid cell shape derived from the ratio or the explicit flags. */
  shape: 'wide' | 'tall' | '';
}

// Newest first: this order is the order on the page.
const PHOTO_BASE: PhotoBase[] = [
  { src: '/fotos/2026-01-17-montana.webp', width: 1600, height: 900 },
  {},
  { tall: true },
  {},
  { wide: true },
  {},
];

const PHOTO_COPY: Record<Lang, PhotoCopy[]> = {
  es: [
    {
      alt: 'Franco, de gorra y con mochila, mirando un valle entre montañas.',
      caption: 'Montaña · ene 2026',
    },
    { caption: 'Foto 02' },
    { caption: 'Foto 03' },
    { caption: 'Foto 04' },
    { caption: 'Foto 05' },
    { caption: 'Foto 06' },
  ],
  en: [
    {
      alt: 'Franco, wearing a cap and a backpack, looking over a valley between mountains.',
      caption: 'Mountain · Jan 2026',
    },
    { caption: 'Photo 02' },
    { caption: 'Photo 03' },
    { caption: 'Photo 04' },
    { caption: 'Photo 05' },
    { caption: 'Photo 06' },
  ],
};

function shapeOf(photo: PhotoBase): Photo['shape'] {
  const ratio = photo.width && photo.height ? photo.width / photo.height : 1;
  if (photo.wide || ratio > 1.3) return 'wide';
  if (photo.tall || ratio < 0.8) return 'tall';
  return '';
}

/** Zips the shared base with the copy for `lang`, in authoring order. */
export function photosFor(lang: Lang): Photo[] {
  return PHOTO_BASE.map((base, index) => ({
    ...base,
    ...PHOTO_COPY[lang][index],
    shape: shapeOf(base),
  }));
}
